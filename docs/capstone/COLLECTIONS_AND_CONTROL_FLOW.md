# CivicTax Apex Collections, Control Flow & Data Structures

## 1. Apex Collections in CivicTax

CivicTax utilizes standard Apex collection types (`List`, `Set`, `Map`) to achieve governor-limit safety and $O(1)$ bulk processing.

---

## 2. Practical Examples from CivicTax Codebase

### 2.1 `List<Property__c>` (Ordered Bulk Ingestion)
```apex
List<Property__c> propertiesToInsert = new List<Property__c>();
for (PropertyDTO dto : incomingRegistrations) {
    Property__c prop = new Property__c(
        Property_Number__c = dto.propertyNumber,
        Built_Up_Area__c = dto.builtUpArea,
        Plot_Area__c = dto.plotArea,
        Property_Category__c = dto.category,
        Municipal_Zone__c = dto.zoneId
    );
    propertiesToInsert.add(prop);
}
insert propertiesToInsert; // Single DML for entire batch
```

### 2.2 `Set<String>` (Duplicate Reference Detection)
```apex
Set<String> propertyNumbers = new Set<String>();
for (Property__c prop : triggerNew) {
    if (prop.Property_Number__c != null) {
        propertyNumbers.add(prop.Property_Number__c);
    }
}

// Single SOQL to find all existing duplicates
List<Property__c> duplicates = [
    SELECT Property_Number__c 
    FROM Property__c 
    WHERE Property_Number__c IN :propertyNumbers
];
```

### 2.3 `Map<Id, Tax_Assessment__c>` (Pessimistic Locking & Balance Lookups)
```apex
Set<Id> assessmentIds = new Set<Id>();
for (Tax_Payment__c pmt : triggerNew) {
    assessmentIds.add(pmt.Assessment__c);
}

Map<Id, Tax_Assessment__c> assessmentMap = new Map<Id, Tax_Assessment__c>([
    SELECT Id, Total_Amount__c, Status__c 
    FROM Tax_Assessment__c 
    WHERE Id IN :assessmentIds
    FOR UPDATE
]);
```

---

## 3. Control Flow Constructs

- **`enhanced for` loops**: Iterating over `List<SObject>` without index bounds errors.
- **`switch on` expressions**: Handling picklist status transitions cleanly:
  ```apex
  switch on newStatus {
      when 'PAID' { handleFullPayment(assessment); }
      when 'PARTIALLY_PAID' { handlePartialPayment(assessment); }
      when 'OVERDUE' { triggerDelinquencyNotice(assessment); }
      when else { logStatusChange(assessment); }
  }
  ```
- **`try / catch / finally`**: Controlled exception management with transaction rollback.
