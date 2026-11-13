# Topic 13: SOQL, SOSL, DML & Advanced Apex Logic

## 1. SOQL & Aggregate Query Patterns

### 1.1 Bulk-Safe SOQL with Bind Variables
```apex
public static List<Tax_Assessment__c> getOutstandingAssessments(Set<Id> propertyIds) {
    return [
        SELECT Id, Name, Total_Amount__c, Outstanding_Balance__c, Due_Date__c,
               Property__r.Property_Number__c, Property__r.Municipal_Zone__r.Name
        FROM Tax_Assessment__c
        WHERE Property__c IN :propertyIds 
          AND Status__c IN ('FINALIZED', 'PARTIALLY_PAID', 'OVERDUE')
        WITH SECURITY_ENFORCED
        ORDER BY Due_Date__c ASC
    ];
}
```

### 1.2 Aggregate Query with `GROUP BY` and `HAVING`
```apex
public static List<AggregateResult> getZonalRevenueAggregates() {
    return [
        SELECT Property__r.Municipal_Zone__r.Name zoneName, 
               SUM(Amount_Paid__c) totalRevenue, 
               COUNT(Id) paymentCount
        FROM Tax_Payment__c
        WHERE Payment_Status__c = 'SUCCESS'
        WITH SECURITY_ENFORCED
        GROUP BY Property__r.Municipal_Zone__r.Name
        HAVING SUM(Amount_Paid__c) > 0
    ];
}
```

---

## 2. Global SOSL Search Implementation
```apex
public static List<List<SObject>> searchMunicipalDirectory(String searchTerm) {
    String queryTerm = String.escapeSingleQuotes(searchTerm) + '*';
    return [
        FIND :queryTerm IN ALL FIELDS
        RETURNING 
            Property__c(Id, Name, Property_Number__c, Property_Category__c LIMIT 10),
            Contact(Id, Name, Email, Phone LIMIT 10),
            Case(Id, CaseNumber, Subject, Status LIMIT 10)
        WITH SECURITY_ENFORCED
    ];
}
```

---

## 3. Transactional DML, Partial Success & Savepoints

```apex
Savepoint sp = Database.setSavepoint();
try {
    List<Database.SaveResult> results = Database.insert(paymentsList, false);
    for (Database.SaveResult sr : results) {
        if (!sr.isSuccess()) {
            // Log specific record error without aborting entire batch
            System.debug(LoggingLevel.ERROR, 'Payment Insert Failure: ' + sr.getErrors()[0].getMessage());
        }
    }
} catch (Exception ex) {
    Database.rollback(sp);
    throw ex;
}
```
