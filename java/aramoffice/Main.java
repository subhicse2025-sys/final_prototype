package aramoffice;

import java.util.Arrays;
import java.util.List;

/**
 * Main.java – Driver / Demo class for the Aram Office Document System
 *
 * Demonstrates all OOP and DSA concepts for college viva:
 *  1. Polymorphism (validateMetadata on Circular vs ApplicationForm)
 *  2. Inverted index search
 *  3. Prefix suggestions via Trie
 *  4. Version management (Current → Outdated)
 *  5. Duplicate ID prevention
 *  6. Case-insensitive search
 *  7. Ranked search results
 */
public class Main {

    public static void main(String[] args) {

        System.out.println("╔══════════════════════════════════════════════════════════╗");
        System.out.println("║   Aram Office – E-Governance Document System (Java)      ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝\n");

        DocumentManager manager = new DocumentManager();

        // ── 1. Add Sample Documents ────────────────────────────────────
        System.out.println("--- [1] Adding documents ---");

        CircularDocument incomeCircular = new CircularDocument(
            "DOC101", "Income Certificate Circular 2024",
            Arrays.asList("income", "certificate", "circular", "2024", "guidelines", "revenue"),
            "Revenue Department", "Income Certificate", "High",
            "Updated procedures for issuing income certificates. New income slabs effective April 2024.",
            "District Collector", "RC/2024/001"
        );
        incomeCircular.addVersion("Initial release.");
        incomeCircular.addVersion("Updated with Aadhaar verification and new fee structure.");
        manager.addDocument(incomeCircular);

        ApplicationForm incomeForm = new ApplicationForm(
            "DOC102", "Income Certificate Application Form",
            Arrays.asList("income", "certificate", "application", "form", "family income"),
            "Revenue Department", "Income Certificate", "High",
            "Standard application form for obtaining income certificate.",
            "Income Certificate", true
        );
        incomeForm.addVersion("Initial release.");
        manager.addDocument(incomeForm);

        CircularDocument pensionCirc = new CircularDocument(
            "DOC105", "Old Age Pension Guidelines",
            Arrays.asList("pension", "old age", "senior citizen", "social welfare", "scheme"),
            "Revenue Department", "Pension", "High",
            "Guidelines for old age pension scheme for citizens above 60 years.",
            "Social Welfare Dept", "SW/2024/015"
        );
        pensionCirc.addVersion("Original guidelines.");
        pensionCirc.addVersion("Enhanced monthly amount.");
        manager.addDocument(pensionCirc);

        CircularDocument healthCirc = new CircularDocument(
            "DOC201", "Health Awareness Circular – Dengue Prevention",
            Arrays.asList("health", "dengue", "prevention", "awareness", "mosquito"),
            "Health Department", "Public Health", "High",
            "Seasonal circular for dengue prevention activities.",
            "District Health Officer", "DHO/2024/012"
        );
        healthCirc.addVersion("Pre-monsoon circular.");
        healthCirc.addVersion("Updated with rapid test kit protocol.");
        manager.addDocument(healthCirc);

        CircularDocument scholarCirc = new CircularDocument(
            "DOC301", "Scholarship Application Guidelines",
            Arrays.asList("scholarship", "guidelines", "student", "education", "merit"),
            "Education Department", "Education Services", "High",
            "Guidelines for scholarship schemes for meritorious students.",
            "District Education Officer", "DEO/2024/030"
        );
        scholarCirc.addVersion("Original.");
        scholarCirc.addVersion("Updated eligibility.");
        scholarCirc.addVersion("Increased scholarship amount and online process.");
        manager.addDocument(scholarCirc);

        System.out.println("Documents added: 5\n");

        // ── 2. Polymorphism Demo ────────────────────────────────────────
        System.out.println("--- [2] Polymorphism – validateMetadata() ---");
        GovernmentDocument[] docs = { incomeCircular, incomeForm, pensionCirc };
        for (GovernmentDocument doc : docs) {
            System.out.println(doc.getDocumentId() + " [" + doc.getType() + "] valid: "
                + doc.validateMetadata());
        }
        System.out.println();

        // ── 3. Search – "income" ───────────────────────────────────────
        System.out.println("--- [3] Search: 'income' ---");
        SearchQuery q1 = new SearchQuery("income", Arrays.asList("income"));
        List<SearchResult> r1 = manager.search(q1);
        System.out.println("Results: " + r1.size());
        r1.forEach(r -> System.out.println("  " + r));
        System.out.println();

        // ── 4. Prefix Suggestions – "inc" ─────────────────────────────
        System.out.println("--- [4] Prefix Suggestions: 'inc' ---");
        List<String> suggestions = manager.getSuggestions("inc", 8);
        System.out.println("Suggestions: " + suggestions);
        System.out.println();

        // ── 5. Case-Insensitive Search ─────────────────────────────────
        System.out.println("--- [5] Case-insensitive: 'INCOME' vs 'income' ---");
        SearchQuery qUpper = new SearchQuery("INCOME", Arrays.asList("income")); // normalised
        List<SearchResult> rUpper = manager.search(qUpper);
        System.out.println("'INCOME' results: " + rUpper.size() + " (same as 'income': " + r1.size() + ")");
        System.out.println();

        // ── 6. Version Management ─────────────────────────────────────
        System.out.println("--- [6] Version Management ---");
        System.out.println("DOC101 versions BEFORE adding new version:");
        incomeCircular.getVersionHistory().forEach(v -> System.out.println("  " + v));

        manager.addVersion("DOC101", "Annual review – enhanced digital verification.");
        System.out.println("DOC101 versions AFTER adding Version 3:");
        incomeCircular.getVersionHistory().forEach(v -> System.out.println("  " + v));
        System.out.println("Current version: " + incomeCircular.getCurrentVersion());
        System.out.println();

        // ── 7. Duplicate ID Prevention ─────────────────────────────────
        System.out.println("--- [7] Duplicate ID Prevention ---");
        CircularDocument dupDoc = new CircularDocument(
            "DOC101", "Duplicate Test", Arrays.asList("test"),
            "Revenue Department", "Income Certificate", "Low",
            "This should be rejected.", "Test Authority", "TEST/001"
        );
        boolean added = manager.addDocument(dupDoc);
        System.out.println("Attempt to add duplicate DOC101: " + (added ? "Allowed (BUG!)" : "BLOCKED ✅"));
        System.out.println();

        // ── 8. Category Tree ──────────────────────────────────────────
        System.out.println("--- [8] Category Tree ---");
        manager.getCategoryTree().printTree("");
        System.out.println();

        // ── 9. All Documents ──────────────────────────────────────────
        manager.printAllDocuments();

        System.out.println("\n✅ Demo complete. All OOP & DSA concepts demonstrated.");
    }
}
