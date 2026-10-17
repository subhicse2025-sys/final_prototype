package aramoffice;

/**
 * DocumentVersion – Represents a single version snapshot of a document.
 *
 * Used in Composition with GovernmentDocument.
 * Version history is IMMUTABLE — once stored, content is never overwritten.
 *
 * OOP Concepts:
 *  - Encapsulation: all fields private
 *  - Composition: contained within GovernmentDocument
 *  - Immutability: version number and date are set at creation and never changed
 */
public class DocumentVersion {

    // Immutable fields (set once at creation)
    private final int    versionNumber;
    private final String date;           // ISO: "YYYY-MM-DD"
    private final String notes;          // Change summary

    // Mutable field: status can change (Current → Outdated)
    private String status;               // "Current" | "Outdated"

    public DocumentVersion(int versionNumber, String date, String status, String notes) {
        this.versionNumber = versionNumber;
        this.date          = date;
        this.status        = status;
        this.notes         = notes;
    }

    // ── Getters ─────────────────────────────────────────────────────────
    public int    getVersionNumber() { return versionNumber; }
    public String getDate()          { return date; }
    public String getNotes()         { return notes; }
    public String getStatus()        { return status; }

    /** Status is the ONLY mutable property (changed when a newer version is added). */
    public void   setStatus(String status) { this.status = status; }

    public boolean isCurrent()  { return "Current".equals(status); }
    public boolean isOutdated() { return "Outdated".equals(status); }

    @Override
    public String toString() {
        return String.format("Version %d [%s] – %s | Notes: %s", versionNumber, status, date, notes);
    }
}
