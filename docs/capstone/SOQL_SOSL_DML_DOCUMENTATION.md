# CivicTax SOQL, SOSL and DML Implementation Documentation

## 1. SOQL Query Patterns

All SOQL queries in CivicTax strictly use bind variables, enforce security with `WITH SECURITY_ENFORCED`, and avoid queries inside loops.

### 1.1 Relationship Query: Properties with Active Assessments
```apex
public static List<Property__c> getPropertiesWithAssessments(Id contactId) {
    return [
        SELECT Id, Name, Property_Number__c, Built_Up_Area__c, Verification_Status__c,
               (SELECT Id, Assessment_Year__c, Total_Amount__c, Status__c, Due_Date__c 
                FROM Tax_Assessments__r 
                ORDER BY Due_Date__c DESC)
        FROM Property__c
        WHERE Owner_Contact__c = :contactId
        WITH SECURITY_ENFORCED
    ];
}
```

### 1.2 Aggregate Query: Total Revenue by Municipal Zone
```apex
public static List<AggregateResult> getRevenueByZone() {
    return [
        SELECT Property__r.Municipal_Zone__r.Name zoneName, 
               SUM(Amount_Paid__c) totalRevenue, 
               COUNT(Id) totalTransactions
        FROM Tax_Payment__c
        WHERE Payment_Status__c = 'SUCCESS'
        WITH SECURITY_ENFORCED
        GROUP BY Property__r.Municipal_Zone__r.Name
    ];
}
```

---

## 2. SOSL Cross-Object Search Pattern

```apex
public static List<List<SObject>> searchMunicipalRecords(String searchPhrase) {
    String sanitized = String.escapeSingleQuotes(searchPhrase) + '*';
    return [
        FIND :sanitized IN ALL FIELDS
        RETURNING 
            Property__c(Id, Name, Property_Number__c, Property_Category__c LIMIT 10),
            Tax_Assessment__c(Id, Name, Assessment_Year__c, Total_Amount__c LIMIT 10),
            Case(Id, CaseNumber, Subject, Status LIMIT 10)
        WITH SECURITY_ENFORCED
    ];
}
```

---

## 3. Transactional DML & Savepoints

```apex
Savepoint sp = Database.setSavepoint();
try {
    Database.SaveResult sr = Database.insert(newPayment, false);
    if (!sr.isSuccess()) {
        Database.rollback(sp);
        throw new CivicTaxException('DML Error: ' + sr.getErrors()[0].getMessage());
    }
} catch (Exception ex) {
    Database.rollback(sp);
    throw ex;
}
```
