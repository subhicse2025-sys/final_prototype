package aramoffice;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * GovernmentDocument – Base class (Abstraction + Encapsulation)
 *
 * Represents any official document in the Aram Office system.
 * CircularDocument and ApplicationForm extend this class (Inheritance).
 *
 * OOP Concepts demonstrated:
 *  - Encapsulation: all fields private, accessed via getters/setters
 *  - Abstraction:   validateMetadata() is abstract — subclasses must implement
 *  - Composition:   contains a List<DocumentVersion> (version history)
 */
public abstract class GovernmentDocument {

    // ── Encapsulated fields ─────────────────────────────────────────────
    private String       documentId;
    private String       title;
    private List<String> keywords;
    private String       department;
    private String       category;
    private String       importanceLevel;   // "High" | "Medium" | "Low"
    private String       content;
    private String       type;             // "Circular" | "ApplicationForm"

    /**
     * Composition: Each document owns its version history.
     * Mirrors Java concept: ArrayList<DocumentVersion>
     */
    private List<DocumentVersion> versionHistory;

    // ── Constructor ─────────────────────────────────────────────────────
    public GovernmentDocument(String documentId, String title, List<String> keywords,
                               String department, String category,
                               String importanceLevel, String content, String type) {
        this.documentId      = documentId;
        this.title           = title;
        this.keywords        = new ArrayList<>(keywords);
        this.department      = department;
        this.category        = category;
        this.importanceLevel = importanceLevel;
        this.content         = content;
        this.type            = type;
        this.versionHistory  = new ArrayList<>();
    }

    // ── Abstract method (Polymorphism entry point) ──────────────────────
    /**
     * Each subclass provides its own metadata validation logic.
     * Demonstrates runtime polymorphism via method overriding.
     */
    public abstract boolean validateMetadata();

    // ── Version management via Composition ─────────────────────────────
    /**
     * Add a version to this document's history.
     * When a new version is added:
     *  - All existing "Current" versions become "Outdated"
     *  - The new version is marked "Current"
     * Immutability: previous version content is never overwritten.
     */
    public DocumentVersion addVersion(String notes) {
        // Mark all existing versions outdated
        for (DocumentVersion v : versionHistory) {
            v.setStatus("Outdated");
        }
        int nextVersionNumber = versionHistory.size() + 1;
        DocumentVersion newVersion = new DocumentVersion(
            nextVersionNumber,
            LocalDate.now().toString(),
            "Current",
            notes
        );
        versionHistory.add(newVersion);
        return newVersion;
    }

    /**
     * Returns the current (latest approved) version.
     * Only one version can be "Current" at any time.
     */
    public DocumentVersion getCurrentVersion() {
        for (int i = versionHistory.size() - 1; i >= 0; i--) {
            if ("Current".equals(versionHistory.get(i).getStatus())) {
                return versionHistory.get(i);
            }
        }
        return versionHistory.isEmpty() ? null : versionHistory.get(versionHistory.size() - 1);
    }

    /** Returns an unmodifiable view of the version history (immutability). */
    public List<DocumentVersion> getVersionHistory() {
        return java.util.Collections.unmodifiableList(versionHistory);
    }

    // ── Getters & Setters (Encapsulation) ──────────────────────────────
    public String getDocumentId()       { return documentId; }
    public String getTitle()            { return title; }
    public List<String> getKeywords()   { return new ArrayList<>(keywords); }
    public String getDepartment()       { return department; }
    public String getCategory()         { return category; }
    public String getImportanceLevel()  { return importanceLevel; }
    public String getContent()          { return content; }
    public String getType()             { return type; }

    public void setTitle(String title)              { this.title = title; }
    public void setKeywords(List<String> keywords)  { this.keywords = new ArrayList<>(keywords); }
    public void setDepartment(String department)    { this.department = department; }
    public void setCategory(String category)        { this.category = category; }
    public void setImportanceLevel(String level)    { this.importanceLevel = level; }
    public void setContent(String content)          { this.content = content; }

    @Override
    public String toString() {
        DocumentVersion cur = getCurrentVersion();
        return String.format("[%s] %s | %s | %s | Importance: %s | Version: v%d (%s)",
            documentId, title, department, category, importanceLevel,
            cur != null ? cur.getVersionNumber() : 0,
            cur != null ? cur.getStatus() : "N/A");
    }
}
