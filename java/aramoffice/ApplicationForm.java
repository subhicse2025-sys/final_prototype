package aramoffice;

import java.util.List;

/**
 * ApplicationForm – Subclass of GovernmentDocument (Inheritance)
 *
 * Represents a government application form citizens fill to request services.
 * Demonstrates:
 *  - Inheritance: extends GovernmentDocument
 *  - Polymorphism: overrides validateMetadata() with form-specific rules
 */
public class ApplicationForm extends GovernmentDocument {

    private String targetService;      // e.g. "Income Certificate"
    private boolean requiresProofDoc;  // whether proof documents are mandatory

    public ApplicationForm(String documentId, String title, List<String> keywords,
                           String department, String category, String importanceLevel,
                           String content, String targetService, boolean requiresProofDoc) {
        super(documentId, title, keywords, department, category, importanceLevel, content, "ApplicationForm");
        this.targetService     = targetService;
        this.requiresProofDoc  = requiresProofDoc;
    }

    /**
     * Polymorphism – overrides GovernmentDocument.validateMetadata()
     * Application forms require a target service and at least 2 keywords
     * (since forms need more searchability than circulars).
     */
    @Override
    public boolean validateMetadata() {
        if (getTitle() == null || getTitle().isBlank()) {
            System.err.println("Validation failed: Form title is empty.");
            return false;
        }
        if (targetService == null || targetService.isBlank()) {
            System.err.println("Validation failed: Target service must be specified for application forms.");
            return false;
        }
        if (getKeywords() == null || getKeywords().size() < 2) {
            System.err.println("Validation failed: Application forms require at least 2 keywords.");
            return false;
        }
        if (getDepartment() == null || getDepartment().isBlank()) {
            System.err.println("Validation failed: Department is required.");
            return false;
        }
        return true;
    }

    public String getTargetService()        { return targetService; }
    public boolean isRequiresProofDoc()     { return requiresProofDoc; }
    public void setTargetService(String s)  { this.targetService = s; }
    public void setRequiresProofDoc(boolean b) { this.requiresProofDoc = b; }

    @Override
    public String toString() {
        return "AppForm [" + targetService + "] | " + super.toString()
               + (requiresProofDoc ? " | Proof Required" : "");
    }
}
