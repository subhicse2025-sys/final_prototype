/**
 * trie.js – Trie data structure for prefix-based keyword suggestions
 * Aram Office – E-Governance Document Processing & Retrieval System
 *
 * Maps the Java Trie concept from the academic requirement.
 * Simulates: insert(), search(), startsWith(), getSuggestions()
 */

"use strict";

class TrieNode {
  constructor() {
    this.children = {};   // char -> TrieNode
    this.isEnd = false;   // marks end of a complete keyword
    this.docIds = new Set(); // which docs contain this keyword
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Normalize a word: lowercase + trim.
   * Mirrors Java: keyword.trim().toLowerCase()
   */
  normalize(word) {
    return word.trim().toLowerCase();
  }

  /**
   * Insert a keyword into the trie, associated with a document ID.
   */
  insert(keyword, docId) {
    const word = this.normalize(keyword);
    if (!word) return;
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode();
      }
      node = node.children[ch];
      node.docIds.add(docId); // every prefix node knows which docs pass through it
    }
    node.isEnd = true;
  }

  /**
   * Remove a keyword-docId association (used when updating keywords).
   * Soft removal: removes docId from all prefix nodes of the keyword.
   */
  removeDocFromKeyword(keyword, docId) {
    const word = this.normalize(keyword);
    if (!word) return;
    let node = this.root;
    const path = [this.root];
    for (const ch of word) {
      if (!node.children[ch]) return;
      node = node.children[ch];
      path.push(node);
      node.docIds.delete(docId);
    }
  }

  /**
   * Collect all complete keywords reachable from a given node.
   * Returns array of { keyword, docIds }.
   */
  _collectSuggestions(node, prefix, results, limit) {
    if (results.length >= limit) return;
    if (node.isEnd) {
      results.push({ keyword: prefix, docIds: new Set(node.docIds) });
    }
    for (const ch of Object.keys(node.children).sort()) {
      if (results.length >= limit) break;
      this._collectSuggestions(node.children[ch], prefix + ch, results, limit);
    }
  }

  /**
   * Get prefix-matched keyword suggestions.
   * @param {string} prefix - partial word typed by user
   * @param {number} limit  - max suggestions
   * @returns Array of strings (matching complete keywords)
   */
  getSuggestions(prefix, limit = 10) {
    const word = this.normalize(prefix);
    if (!word) return [];
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    const results = [];
    this._collectSuggestions(node, word, results, limit);
    return results.map(r => r.keyword);
  }

  /**
   * Get all document IDs whose keywords start with the given prefix.
   */
  getDocIdsByPrefix(prefix) {
    const word = this.normalize(prefix);
    if (!word) return new Set();
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return new Set();
      node = node.children[ch];
    }
    return new Set(node.docIds);
  }

  /**
   * Check if an exact keyword exists in the trie.
   */
  contains(keyword) {
    const word = this.normalize(keyword);
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }
    return node.isEnd;
  }

  /**
   * Get all docIds for an exact keyword match.
   */
  getDocIdsForKeyword(keyword) {
    const word = this.normalize(keyword);
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return new Set();
      node = node.children[ch];
    }
    // Only return if it's a complete keyword
    return node.isEnd ? new Set(node.docIds) : new Set();
  }
}
