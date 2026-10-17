package aramoffice;

import java.util.ArrayList;
import java.util.List;

/**
 * CategoryNode – Tree node for department/category hierarchy.
 *
 * Represents the category tree structure used in the Category Tree page.
 *
 * Data Structure: N-ary Tree
 *  - Root: "Aram Office"
 *  - Level 1 children: Departments (Revenue, Health, Education, Public Works)
 *  - Level 2 children: Categories (Income Certificate, Pension, etc.)
 *
 * OOP Concepts:
 *  - Encapsulation: private fields with getters/setters
 *  - Recursion: tree traversal methods
 *  - Composition: each node contains a list of child nodes
 */
public class CategoryNode {

    private String           name;        // Department or Category name
    private String           type;        // "root" | "department" | "category"
    private List<CategoryNode> children;  // Child nodes (Composition)
    private List<String>     documentIds; // Documents at this node (leaf level)

    public CategoryNode(String name, String type) {
        this.name        = name;
        this.type        = type;
        this.children    = new ArrayList<>();
        this.documentIds = new ArrayList<>();
    }

    /** Add a child node (department inside root, category inside department). */
    public void addChild(CategoryNode child) {
        children.add(child);
    }

    /** Add a document ID to this leaf node. */
    public void addDocumentId(String docId) {
        if (!documentIds.contains(docId)) {
            documentIds.add(docId);
        }
    }

    /** Recursive DFS traversal – print the entire tree. */
    public void printTree(String indent) {
        System.out.println(indent + "📁 " + name + " [" + type + "]"
            + (documentIds.isEmpty() ? "" : " (" + documentIds.size() + " docs)"));
        for (CategoryNode child : children) {
            child.printTree(indent + "  ");
        }
    }

    /** Find a category node by name (recursive DFS). */
    public CategoryNode findByName(String targetName) {
        if (this.name.equalsIgnoreCase(targetName)) return this;
        for (CategoryNode child : children) {
            CategoryNode found = child.findByName(targetName);
            if (found != null) return found;
        }
        return null;
    }

    /** Count total documents in this subtree. */
    public int getTotalDocumentCount() {
        int count = documentIds.size();
        for (CategoryNode child : children) {
            count += child.getTotalDocumentCount();
        }
        return count;
    }

    // ── Getters & Setters ────────────────────────────────────────────────
    public String           getName()        { return name; }
    public String           getType()        { return type; }
    public List<CategoryNode> getChildren()  { return children; }
    public List<String>     getDocumentIds() { return documentIds; }
}
