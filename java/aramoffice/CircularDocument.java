package aramoffice;

import java.util.List;

/**
 * CircularDocument – Subclass of GovernmentDocument (Inheritance)
 *
 * Represents an official government circular issued to departments.
 * Demonstrates:
 *  - Inheritance: extends GovernmentDocument
 *  - Polymorphism: overrides validateMetadata()
 */
public class CircularDocument extends GovernmentDocument {

    private String issuingAuthority;
    private String circularNumber;

    public CircularDocument(String documentId, String title, List<String> keywords,
                            String department, String category, String importanceLevel,
                            String content, String issuingAuthority, String circularNumber) {
        // Call superclass constructor
        super(documentId, title, keywords, department, category, importanceLevel, content, "Circular");
        this.issuingAuthority = issuingAuthority;
        this.circularNumber   = circularNumber;
    }

    /**
     * Polymorphism – overrides GovernmentDocument.validateMetadata()
     * A circular is valid if it has a circular number and issuing authority.
     */
    @Override
    public boolean validateMetadata() {
        if (getTitle() == null || getTitle().isBlank()) {
            System.err.println("Validation failed: Circular title is empty.");
            return false;
        }
        if (circularNumber == null || circularNumber.isBlank()) {
            System.err.println("Validation failed: Circular number is required.");
            return false;
        }
        if (issuingAuthority == null || issuingAuthority.isBlank()) {
            System.err.println("Validation failed: Issuing authority is required for circulars.");
            return false;
        }
        if (getKeywords() == null || getKeywords().isEmpty()) {
            System.err.println("Validation failed: At least one keyword required.");
            return false;
        }
        return true;
    }

    public String getIssuingAuthority() { return issuingAuthority; }
    public String getCircularNumber()   { return circularNumber; }
    public void setIssuingAuthority(String auth) { this.issuingAuthority = auth; }
    public void setCircularNumber(String num)    { this.circularNumber = num; }

    @Override
    public String toString() {
        return "Circular #" + circularNumber + " | " + super.toString();
    }
}
