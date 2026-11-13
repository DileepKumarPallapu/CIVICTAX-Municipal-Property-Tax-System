# CivicTax SOQL, SOSL and DML Implementation Patterns

## 1. SOQL Patterns (Bulk-Safe, Injection-Proof)

All SOQL queries in CivicTax strictly utilize bind variables, run with field-level security enforcement (`WITH SECURITY_ENFORCED`), and avoid SOQL queries within loops.

### 1.1 Property Lookup by Zone & Category
```apex
public static List<Property__c> getPropertiesByZone(Id zoneId, String category) {
    return [
        SELECT Id, Name, Property_Number__c, Property_Category__c, 
               Built_Up_Area__c, Verification_Status__c, Owner_Contact__r.Name
        FROM Property__c
        WHERE Municipal_Zone__c = :zoneId 
          AND Property_Category__c = :category
        WITH SECURITY_ENFORCED
        LIMIT 500
    ];
}
```

### 1.2 Outstanding Tax Assessments for Fiscal Year
```apex
public static List<Tax_Assessment__c> getOutstandingAssessments(String fiscalYear) {
    return [
        SELECT Id, Name, Property__r.Property_Number__c, Total_Amount__c, 
               Due_Date__c, Status__c,
               (SELECT Amount_Paid__c, Payment_Date__c, Payment_Status__c 
                FROM Tax_Payments__r 
                WHERE Payment_Status__c = 'SUCCESS')
        FROM Tax_Assessment__c
        WHERE Assessment_Year__c = :fiscalYear
          AND Status__c IN ('DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'OVERDUE')
        WITH SECURITY_ENFORCED
        ORDER BY Due_Date__c ASC
    ];
}
```

---

## 2. SOSL Search Patterns

SOSL provides fast cross-object municipal index search across properties, assessments, and grievances:

```apex
public static List<List<SObject>> searchMunicipalRecords(String searchPhrase) {
    String sanitizedQuery = String.escapeSingleQuotes(searchPhrase) + '*';
    return [
        FIND :sanitizedQuery IN ALL FIELDS
        RETURNING 
            Property__c(Id, Name, Property_Number__c, Property_Category__c LIMIT 20),
            Tax_Assessment__c(Id, Name, Assessment_Year__c, Total_Amount__c LIMIT 20),
            Grievance__c(Id, Name, Grievance_Number__c, Subject__c, Status__c LIMIT 20)
        WITH SECURITY_ENFORCED
    ];
}
```

---

## 3. ACID DML & Savepoint Rollback Operations

```apex
Savepoint sp = Database.setSavepoint();
try {
    // 1. Ingest Payment Record
    insert paymentRecord;
    
    // 2. Refresh & Lock Assessment Record
    Tax_Assessment__c assessment = [
        SELECT Id, Total_Amount__c, Status__c 
        FROM Tax_Assessment__c 
        WHERE Id = :paymentRecord.Assessment__c 
        FOR UPDATE
    ];
    
    // 3. Recompute balance and update status
    assessment.Status__c = (paymentRecord.Amount_Paid__c >= assessment.Total_Amount__c) 
                           ? 'PAID' : 'PARTIALLY_PAID';
    update assessment;
} catch (Exception ex) {
    Database.rollback(sp);
    throw new CivicTaxException('Transactional Payment Failure: ' + ex.getMessage());
}
```
