package aramoffice;

import java.util.List;

/**
 * SearchQuery – Encapsulates a user's search request.
 *
 * OOP Concept: Encapsulation of search parameters into a dedicated class.
 * Separates query construction from search execution (Single Responsibility).
 */
public class SearchQuery {

    private String       rawQuery;         // Original text entered by user
    private List<String> normalizedTokens; // Lowercased, trimmed tokens
    private String       departmentFilter;
    private String       categoryFilter;
    private String       importanceFilter;
    private String       statusFilter;

    public SearchQuery(String rawQuery, List<String> normalizedTokens) {
        this.rawQuery          = rawQuery;
        this.normalizedTokens  = normalizedTokens;
        this.departmentFilter  = "";
        this.categoryFilter    = "";
        this.importanceFilter  = "";
        this.statusFilter      = "";
    }

    /** Apply optional filters to narrow down results. */
    public SearchQuery withDepartment(String dept)   { this.departmentFilter = dept; return this; }
    public SearchQuery withCategory(String cat)      { this.categoryFilter = cat; return this; }
    public SearchQuery withImportance(String imp)    { this.importanceFilter = imp; return this; }
    public SearchQuery withStatus(String status)     { this.statusFilter = status; return this; }

    public String       getRawQuery()         { return rawQuery; }
    public List<String> getNormalizedTokens() { return normalizedTokens; }
    public String       getDepartmentFilter() { return departmentFilter; }
    public String       getCategoryFilter()   { return categoryFilter; }
    public String       getImportanceFilter() { return importanceFilter; }
    public String       getStatusFilter()     { return statusFilter; }

    public boolean hasFilters() {
        return !departmentFilter.isEmpty() || !categoryFilter.isEmpty()
            || !importanceFilter.isEmpty() || !statusFilter.isEmpty();
    }

    @Override
    public String toString() {
        return "SearchQuery{rawQuery='" + rawQuery + "', tokens=" + normalizedTokens
             + (hasFilters() ? ", filters=[dept=" + departmentFilter + ",cat=" + categoryFilter
               + ",imp=" + importanceFilter + ",status=" + statusFilter + "]" : "") + "}";
    }
}
