package aramoffice;

import java.util.*;

/**
 * DocumentManager – Core service class managing all documents.
 *
 * Data Structures used:
 *  - HashMap<String, GovernmentDocument>         : O(1) document lookup by ID
 *  - HashMap<String, HashSet<String>>            : Inverted keyword index
 *                                                   keyword → Set of document IDs
 *  - CategoryNode (N-ary Tree)                   : Hierarchical browsing
 *  - ArrayList<SearchResult> + Collections.sort  : Ranked search output
 *
 * OOP Concepts:
 *  - Encapsulation: all data structures are private
 *  - Abstraction: public API hides internal indexing logic
 *  - Composition: uses CategoryNode tree, DocumentVersion list
 */
public class DocumentManager {

    // ── Core Data Structures ──────────────────────────────────────────────

    /**
     * HashMap<String, GovernmentDocument>
     * Key: documentId → Value: document object
     * Provides O(1) lookup, insert, and update.
     */
    private final Map<String, GovernmentDocument> documentMap = new HashMap<>();

    /**
     * Inverted Index: HashMap<String, HashSet<String>>
     * Key: normalised keyword → Value: Set of document IDs containing that keyword
     * Enables fast keyword-based retrieval without scanning all documents.
     */
    private final Map<String, Set<String>> invertedIndex = new HashMap<>();

    /**
     * Trie root for prefix-based keyword suggestion.
     * Implemented as a nested static class (lightweight Trie).
     */
    private final TrieNode trieRoot = new TrieNode();

    /**
     * Category tree root.
     * Structure: Aram Office → Departments → Categories
     */
    private final CategoryNode categoryTreeRoot;

    // ── Constructor ──────────────────────────────────────────────────────
    public DocumentManager() {
        categoryTreeRoot = buildCategoryTree();
    }

    // ── Trie (inner class) ────────────────────────────────────────────────
    private static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEnd = false;
        Set<String> docIds = new HashSet<>();
    }

    private void trieInsert(String word, String docId) {
        word = word.toLowerCase().trim();
        TrieNode node = trieRoot;
        for (char ch : word.toCharArray()) {
            node.children.putIfAbsent(ch, new TrieNode());
            node = node.children.get(ch);
            node.docIds.add(docId);
        }
        node.isEnd = true;
    }

    /** Returns up to `limit` keyword suggestions for a given prefix. */
    public List<String> getSuggestions(String prefix, int limit) {
        prefix = prefix.toLowerCase().trim();
        TrieNode node = trieRoot;
        for (char ch : prefix.toCharArray()) {
            if (!node.children.containsKey(ch)) return Collections.emptyList();
            node = node.children.get(ch);
        }
        List<String> results = new ArrayList<>();
        collectSuggestions(node, prefix, results, limit);
        return results;
    }

    private void collectSuggestions(TrieNode node, String prefix, List<String> results, int limit) {
        if (results.size() >= limit) return;
        if (node.isEnd) results.add(prefix);
        for (Map.Entry<Character, TrieNode> entry : node.children.entrySet()) {
            collectSuggestions(entry.getValue(), prefix + entry.getKey(), results, limit);
        }
    }

    // ── Keyword normalisation ─────────────────────────────────────────────
    private String normalise(String token) {
        return token.trim().toLowerCase();
    }

    private List<String> tokenise(String raw) {
        List<String> tokens = new ArrayList<>();
        for (String t : raw.split("[\\s,\\-]+")) {
            String norm = normalise(t);
            if (!norm.isEmpty()) tokens.add(norm);
        }
        return tokens;
    }

    // ── Index a document ─────────────────────────────────────────────────
    private void indexDocument(GovernmentDocument doc) {
        Set<String> tokens = new HashSet<>();
        // Keywords
        for (String kw : doc.getKeywords()) {
            for (String t : tokenise(kw)) tokens.add(t);
            tokens.add(normalise(kw));
        }
        // Title words
        tokens.addAll(tokenise(doc.getTitle()));
        // Department, Category, ID
        tokens.addAll(tokenise(doc.getDepartment()));
        tokens.addAll(tokenise(doc.getCategory()));
        tokens.add(normalise(doc.getDocumentId()));

        for (String token : tokens) {
            invertedIndex.computeIfAbsent(token, k -> new HashSet<>()).add(doc.getDocumentId());
            trieInsert(token, doc.getDocumentId());
        }

        // Add to category tree
        CategoryNode catNode = categoryTreeRoot.findByName(doc.getCategory());
        if (catNode != null) catNode.addDocumentId(doc.getDocumentId());
    }

    // ── Add / Update Document ─────────────────────────────────────────────
    /**
     * Add a new document. Validates metadata before adding.
     * Prevents duplicate IDs.
     */
    public boolean addDocument(GovernmentDocument doc) {
        if (documentMap.containsKey(doc.getDocumentId())) {
            System.err.println("ERROR: Document ID " + doc.getDocumentId() + " already exists!");
            return false;
        }
        if (!doc.validateMetadata()) {
            System.err.println("ERROR: Metadata validation failed for " + doc.getDocumentId());
            return false;
        }
        documentMap.put(doc.getDocumentId(), doc);
        indexDocument(doc);
        System.out.println("Added: " + doc);
        return true;
    }

    /**
     * Add a new version to an existing document.
     * Previous current version is automatically marked outdated.
     */
    public DocumentVersion addVersion(String docId, String notes) {
        GovernmentDocument doc = documentMap.get(docId);
        if (doc == null) {
            System.err.println("ERROR: Document not found: " + docId);
            return null;
        }
        DocumentVersion newVer = doc.addVersion(notes);
        // Re-index (keywords may have changed)
        indexDocument(doc);
        System.out.println("Version added: " + newVer + " for " + docId);
        return newVer;
    }

    /** Lookup by ID — O(1) HashMap access. */
    public GovernmentDocument getById(String docId) {
        return documentMap.get(docId);
    }

    public boolean documentExists(String docId) {
        return documentMap.containsKey(docId);
    }

    /**
     * Delete a document by ID.
     * Removes from documentMap, invertedIndex, and Category tree.
     */
    public boolean deleteDocument(String docId) {
        GovernmentDocument doc = documentMap.remove(docId);
        if (doc == null) {
            System.err.println("ERROR: Cannot delete. Document not found: " + docId);
            return false;
        }
        // Remove from inverted index
        for (Set<String> docSet : invertedIndex.values()) {
            docSet.remove(docId);
        }
        // Remove from category tree
        CategoryNode catNode = categoryTreeRoot.findByName(doc.getCategory());
        if (catNode != null) {
            catNode.getDocumentIds().remove(docId);
        }
        System.out.println("Deleted: [" + docId + "] " + doc.getTitle());
        return true;
    }

    // ── Smart Search ─────────────────────────────────────────────────────
    /**
     * Main search method.
     * Steps:
     *  1. Tokenise and normalise the query.
     *  2. Look up each token in the inverted index (exact match).
     *  3. Also look up prefix matches via the Trie.
     *  4. Count how many query tokens matched each candidate doc.
     *  5. Sort: matchCount DESC → importance DESC → docId DESC
     *
     * @param query SearchQuery object with filters
     * @return Sorted List<SearchResult>
     */
    public List<SearchResult> search(SearchQuery query) {
        Map<String, Integer> matchCounts  = new HashMap<>();
        Map<String, Set<String>> matchedKwMap = new HashMap<>();

        for (String token : query.getNormalizedTokens()) {
            // Exact match from inverted index
            Set<String> exactMatches = invertedIndex.getOrDefault(token, Collections.emptySet());
            // Prefix match from trie
            Set<String> prefixMatches = getPrefixDocIds(token);

            Set<String> candidates = new HashSet<>(exactMatches);
            candidates.addAll(prefixMatches);

            for (String docId : candidates) {
                matchCounts.merge(docId, 1, Integer::sum);
                matchedKwMap.computeIfAbsent(docId, k -> new HashSet<>()).add(token);
            }
        }

        List<SearchResult> results = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : matchCounts.entrySet()) {
            String docId = entry.getKey();
            GovernmentDocument doc = documentMap.get(docId);
            if (doc == null) continue;

            // Apply filters
            if (!query.getDepartmentFilter().isEmpty()
                    && !doc.getDepartment().equals(query.getDepartmentFilter())) continue;
            if (!query.getCategoryFilter().isEmpty()
                    && !doc.getCategory().equals(query.getCategoryFilter())) continue;
            if (!query.getImportanceFilter().isEmpty()
                    && !doc.getImportanceLevel().equals(query.getImportanceFilter())) continue;

            DocumentVersion cur = doc.getCurrentVersion();
            if (!query.getStatusFilter().isEmpty()
                    && cur != null && !cur.getStatus().equals(query.getStatusFilter())) continue;

            List<String> matched = new ArrayList<>(matchedKwMap.getOrDefault(docId, Collections.emptySet()));
            String reason = "Matched " + entry.getValue() + " keyword token(s): " + matched;

            results.add(new SearchResult(
                docId, doc.getTitle(), doc.getDepartment(), doc.getCategory(),
                doc.getImportanceLevel(),
                cur != null ? cur.getVersionNumber() : 0,
                cur != null ? cur.getStatus() : "Unknown",
                entry.getValue(), matched, reason
            ));
        }

        // Sort using SearchResult.compareTo (matchCount → importance → docId)
        Collections.sort(results);
        return results;
    }

    /** Get all docIds whose trie path starts with prefix. */
    private Set<String> getPrefixDocIds(String prefix) {
        TrieNode node = trieRoot;
        for (char ch : prefix.toCharArray()) {
            if (!node.children.containsKey(ch)) return Collections.emptySet();
            node = node.children.get(ch);
        }
        return new HashSet<>(node.docIds);
    }

    // ── Category Tree ─────────────────────────────────────────────────────
    private CategoryNode buildCategoryTree() {
        CategoryNode root = new CategoryNode("Aram Office", "root");

        String[][] structure = {
            {"Revenue Department",      "Income Certificate", "Pension", "Tax and Revenue"},
            {"Health Department",       "Public Health"},
            {"Education Department",    "Education Services"},
            {"Public Works Department", "Public Works"}
        };

        for (String[] row : structure) {
            CategoryNode dept = new CategoryNode(row[0], "department");
            for (int i = 1; i < row.length; i++) {
                dept.addChild(new CategoryNode(row[i], "category"));
            }
            root.addChild(dept);
        }
        return root;
    }

    public CategoryNode getCategoryTree() { return categoryTreeRoot; }

    /** Print all documents summary. */
    public void printAllDocuments() {
        System.out.println("\n=== All Documents (" + documentMap.size() + ") ===");
        documentMap.values().stream()
            .sorted(Comparator.comparing(GovernmentDocument::getDocumentId))
            .forEach(System.out::println);
    }
}
