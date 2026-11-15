// CivicTaxSearchService.cls
// CivicTax 9.0 SOQL and SOSL Search Engine
public with sharing class CivicTaxSearchService {

    // 1. SOQL Complex Query with Aggregations and Group By
    public static Map<String, Object> getZoneAnalytics(String zoneCode) {
        Map<String, Object> result = new Map<String, Object>();

        // Aggregate collections by zone using SOQL AggregateResult
        AggregateResult[] agg = [
            SELECT SUM(Total_Amount__c) totalDemand, SUM(Amount_Paid__c) totalCollected 
            FROM Tax_Assessment__c 
            WHERE Property__r.Zone__c = :zoneCode
        ];

        Decimal demand = 0;
        Decimal collected = 0;
        if (!agg.isEmpty()) {
            demand = (Decimal) agg[0].get('totalDemand');
            collected = (Decimal) agg[0].get('totalCollected');
        }

        result.put('zoneCode', zoneCode);
        result.put('totalDemand', demand != null ? demand : 0);
        result.put('totalCollected', collected != null ? collected : 0);
        return result;
    }

    // 2. SOSL Full-Text Search across Properties, Grievances, and Assessments
    public static List<List<sObject>> searchCivicTaxRecords(String searchPhrase) {
        if (String.isBlank(searchPhrase) || searchPhrase.length() < 2) {
            return new List<List<sObject>>();
        }

        // Search text across multiple municipal objects
        List<List<sObject>> searchResults = [
            FIND :searchPhrase IN ALL FIELDS 
            RETURNING 
                Property__c(Id, Name, Property_Number__c, Property_Address__c, Verification_Status__c),
                Grievance__c(Id, Name, Subject__c, Status__c, Priority__c),
                Tax_Assessment__c(Id, Name, Assessment_Year__c, Total_Amount__c, Outstanding_Amount__c)
            LIMIT 50
        ];

        return searchResults;
    }
}
