package aramoffice;

import java.util.List;

/**
 * SearchResult – Encapsulates one result returned from the search engine.
 *
 * Implements Comparable<SearchResult> for the ranking sort:
 *   1. Higher matchCount first
 *   2. Higher importance weight first (High=3 > Medium=2 > Low=1)
 *   3. Higher docId (lexicographic descending) for deterministic tie-breaking
 *
 * This mirrors using a bounded PriorityQueue<SearchResult> for ranking.
 */
public class SearchResult implements Comparable<SearchResult> {

    private String       docId;
    private String       title;
    private String       department;
    private String       category;
    private String       importance;
    private int          versionNumber;
    private String       status;
    private int          matchCount;       // Number of query tokens matched
    private List<String> matchedKeywords;  // Which keywords caused the match
    private String       matchReason;      // Human-readable explanation

    public SearchResult(String docId, String title, String department, String category,
                        String importance, int versionNumber, String status,
                        int matchCount, List<String> matchedKeywords, String matchReason) {
        this.docId           = docId;
        this.title           = title;
        this.department      = department;
        this.category        = category;
        this.importance      = importance;
        this.versionNumber   = versionNumber;
        this.status          = status;
        this.matchCount      = matchCount;
        this.matchedKeywords = matchedKeywords;
        this.matchReason     = matchReason;
    }

    /** Importance weight used for sorting. */
    private int importanceWeight() {
        return switch (importance) {
            case "High"   -> 3;
            case "Medium" -> 2;
            default       -> 1;
        };
    }

    /**
     * Ranking comparator (descending priority):
     *  1. matchCount DESC
     *  2. importanceWeight DESC
     *  3. docId DESC (lexicographic)
     */
    @Override
    public int compareTo(SearchResult other) {
        // 1. Match count – more matches first
        if (other.matchCount != this.matchCount)
            return Integer.compare(other.matchCount, this.matchCount);
        // 2. Importance – higher importance first
        if (other.importanceWeight() != this.importanceWeight())
            return Integer.compare(other.importanceWeight(), this.importanceWeight());
        // 3. Doc ID – descending lexicographic for determinism
        return other.docId.compareTo(this.docId);
    }

    // ── Getters ──────────────────────────────────────────────────────────
    public String       getDocId()           { return docId; }
    public String       getTitle()           { return title; }
    public String       getDepartment()      { return department; }
    public String       getCategory()        { return category; }
    public String       getImportance()      { return importance; }
    public int          getVersionNumber()   { return versionNumber; }
    public String       getStatus()          { return status; }
    public int          getMatchCount()      { return matchCount; }
    public List<String> getMatchedKeywords() { return matchedKeywords; }
    public String       getMatchReason()     { return matchReason; }

    @Override
    public String toString() {
        return String.format(
            "Rank: [%s] %s | Dept: %s | Matches: %d | Importance: %s | v%d (%s)\n  Reason: %s",
            docId, title, department, matchCount, importance, versionNumber, status, matchReason
        );
    }
}
