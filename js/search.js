/**
 * search.js – Smart Document Search Engine
 * Aram Office – E-Governance Document Processing & Retrieval System
 *
 * Implements (mirrors Java backend concepts):
 *   - HashMap<String, HashSet<String>> invertedIndex  (keyword → Set of docIds)
 *   - Trie for prefix suggestions
 *   - SearchQuery / SearchResult classes
 *   - Ranked result using: matchCount DESC → importance DESC → docId DESC
 */

"use strict";

// ── Importance weight map (mirrors Java enum weights) ─────────────────
const IMPORTANCE_WEIGHT = { "High": 3, "Medium": 2, "Low": 1 };

// ── SearchEngine class ────────────────────────────────────────────────
class SearchEngine {
  constructor() {
    // HashMap<String, Set<String>> : keyword → set of doc IDs
    this.invertedIndex = new Map();
    // Trie for prefix suggestions
    this.trie = new Trie();
    // Quick lookup: docId → document object
    this.docMap = new Map();
  }

  /**
   * Normalise a keyword token: lowercase + trim.
   * Mirrors: keyword.trim().toLowerCase()
   */
  normalise(token) {
    return token.trim().toLowerCase();
  }

  /**
   * Tokenise a raw keyword string into individual words.
   * Split on spaces, commas, hyphens.
   */
  tokenise(raw) {
    return raw.split(/[\s,\-]+/).map(t => this.normalise(t)).filter(t => t.length > 0);
  }

  /**
   * Build the full index from the document store.
   * Called once on startup and after any structural change.
   */
  buildIndex(docs) {
    this.invertedIndex.clear();
    this.trie = new Trie();
    this.docMap.clear();

    for (const doc of docs) {
      this.docMap.set(doc.id, doc);
      const tokens = this._extractTokens(doc);
      for (const token of tokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token).add(doc.id);
        this.trie.insert(token, doc.id);
      }
    }
  }

  /**
   * Extract all searchable tokens from a document.
   * Includes keywords, title words, doc ID, department, category.
   */
  _extractTokens(doc) {
    const tokens = new Set();
    // Explicit keywords
    for (const kw of doc.keywords) {
      for (const t of this.tokenise(kw)) tokens.add(t);
      tokens.add(this.normalise(kw)); // also index as full phrase
    }
    // Title words
    for (const t of this.tokenise(doc.title)) tokens.add(t);
    // Department + Category
    for (const t of this.tokenise(doc.department)) tokens.add(t);
    for (const t of this.tokenise(doc.category)) tokens.add(t);
    // Doc ID
    tokens.add(this.normalise(doc.id));
    return tokens;
  }

  /**
   * Re-index a single document (used after keyword update or version add).
   * First removes old tokens, then re-inserts new ones.
   */
  reindexDoc(doc) {
    // Remove all old references for this doc
    for (const [token, idSet] of this.invertedIndex) {
      idSet.delete(doc.id);
      if (idSet.size === 0) this.invertedIndex.delete(token);
    }
    // Rebuild trie fully (simple approach for prototype)
    this.docMap.set(doc.id, doc);
    this.buildIndex(Array.from(this.docMap.values()));
  }

  /**
   * Add a brand-new document to the index without full rebuild.
   */
  indexNewDoc(doc) {
    this.docMap.set(doc.id, doc);
    const tokens = this._extractTokens(doc);
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token).add(doc.id);
      this.trie.insert(token, doc.id);
    }
  }

  /**
   * PREFIX SUGGESTIONS
   * Returns up to `limit` keyword suggestions for a partial prefix.
   * Uses the Trie's startsWith traversal.
   *
   * @param {string} prefix
   * @param {number} limit
   * @returns {string[]}
   */
  getSuggestions(prefix, limit = 8) {
    const norm = this.normalise(prefix);
    if (norm.length < 2) return [];
    return this.trie.getSuggestions(norm, limit);
  }

  /**
   * MAIN SEARCH
   * Supports:
   *   - Exact keyword match
   *   - Case-insensitive (all tokens normalised)
   *   - Prefix match (via Trie docIdsByPrefix)
   *   - Multiple keyword search
   *   - Ranked results: matchCount DESC → importance DESC → docId DESC
   *
   * @param {string} queryStr  - raw query entered by user
   * @returns {SearchResult[]}
   */
  search(queryStr) {
    const rawTokens = this.tokenise(queryStr);
    if (rawTokens.length === 0) return [];

    // Collect candidate docIds and track which query tokens matched each doc
    const docMatchData = new Map(); // docId → { matchedTokens: Set, matchedKeywords: Set }

    for (const token of rawTokens) {
      // 1. Exact match from inverted index
      const exactSet = this.invertedIndex.get(token) || new Set();
      // 2. Prefix match from trie (catches partial queries like "inc" → "income")
      const prefixSet = this.trie.getDocIdsByPrefix(token);
      // Union of both
      const candidates = new Set([...exactSet, ...prefixSet]);

      for (const docId of candidates) {
        if (!docMatchData.has(docId)) {
          docMatchData.set(docId, { matchedTokens: new Set(), matchedKeywords: new Set() });
        }
        const entry = docMatchData.get(docId);
        entry.matchedTokens.add(token);

        // Which original keywords matched?
        const doc = this.docMap.get(docId);
        if (doc) {
          for (const kw of doc.keywords) {
            const normKw = this.normalise(kw);
            if (normKw.includes(token) || token.startsWith(normKw) || normKw.startsWith(token)) {
              entry.matchedKeywords.add(kw);
            }
          }
        }
      }
    }

    // Build SearchResult objects
    const results = [];
    for (const [docId, data] of docMatchData) {
      const doc = this.docMap.get(docId);
      if (!doc) continue;
      const cur = Store.currentVersion(doc);
      results.push(new SearchResult(
        docId,
        doc.title,
        doc.department,
        doc.category,
        doc.importance,
        cur.version,
        cur.status,
        data.matchedTokens.size,
        Array.from(data.matchedKeywords),
        doc.keywords,
        this._buildMatchReason(rawTokens, data.matchedTokens, data.matchedKeywords)
      ));
    }

    // Sort: matchCount DESC → importanceWeight DESC → docId DESC (deterministic)
    results.sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      const wA = IMPORTANCE_WEIGHT[a.importance] || 0;
      const wB = IMPORTANCE_WEIGHT[b.importance] || 0;
      if (wB !== wA) return wB - wA;
      // Compare docIds lexicographically descending
      return b.docId.localeCompare(a.docId);
    });

    return results;
  }

  /**
   * Filter search: search + apply department/category/importance/status filters.
   */
  filterSearch(queryStr, filters = {}) {
    let results = queryStr.trim()
      ? this.search(queryStr)
      : Store.getAll().map(doc => {
          const cur = Store.currentVersion(doc);
          return new SearchResult(
            doc.id, doc.title, doc.department, doc.category,
            doc.importance, cur.version, cur.status,
            0, [], doc.keywords, "All documents"
          );
        });

    if (filters.department) results = results.filter(r => r.department === filters.department);
    if (filters.category)   results = results.filter(r => r.category   === filters.category);
    if (filters.importance) results = results.filter(r => r.importance  === filters.importance);
    if (filters.status)     results = results.filter(r => r.status      === filters.status);

    return results;
  }

  /**
   * Build a human-readable match reason string.
   */
  _buildMatchReason(queryTokens, matchedTokens, matchedKeywords) {
    const parts = [];
    if (matchedKeywords.size > 0) {
      parts.push(`Keyword match: "${[...matchedKeywords].slice(0,3).join('", "')}"`);
    }
    if (matchedTokens.size > 0) {
      parts.push(`Query terms matched: ${matchedTokens.size}`);
    }
    return parts.join(" · ") || "Document matches query";
  }
}

// ── SearchResult class (mirrors Java SearchResult) ────────────────────
class SearchResult {
  constructor(docId, title, department, category, importance, version, status,
              matchCount, matchedKeywords, allKeywords, reason) {
    this.docId           = docId;
    this.title           = title;
    this.department      = department;
    this.category        = category;
    this.importance      = importance;
    this.version         = version;
    this.status          = status;
    this.matchCount      = matchCount;
    this.matchedKeywords = matchedKeywords;
    this.allKeywords     = allKeywords;
    this.reason          = reason;
  }
}

// ── Singleton engine instance ─────────────────────────────────────────
const Engine = new SearchEngine();
