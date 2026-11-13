# CivicTax Single Trigger Architecture & Recursion Governance

## 1. Single Trigger Rule

Every custom object in CivicTax follows the **Single Trigger Per Object** pattern. Business logic is strictly delegated to dedicated trigger handler classes.

```
+-------------------------------------------------------------------------+
|                        TRIGGER EXECUTION PIPELINE                       |
+-------------------------------------------------------------------------+

   [ SObject DML Event ]
            |
            v
   [ Single Trigger (e.g. TaxPaymentTrigger.trigger) ]
            |
            v
   [ Trigger Handler Class (TaxPaymentTriggerHandler.cls) ]
            |
            +---> beforeInsert() / beforeUpdate() (Validation, Sanitization)
            |
            +---> afterInsert() / afterUpdate()   (Rollup, Status, Async Jobs)
```

---

## 2. Recursion Governance (Bulk-Safe)

To prevent infinite trigger recursion without prematurely aborting valid bulk batches, CivicTax maintains record-level processed ID sets rather than simplistic static boolean flags:

```apex
public class TriggerRecursionControl {
    private static Set<Id> processedAssessmentIds = new Set<Id>();

    public static Boolean isAlreadyProcessed(Id recordId) {
        return processedAssessmentIds.contains(recordId);
    }

    public static void markAsProcessed(Id recordId) {
        processedAssessmentIds.add(recordId);
    }

    public static void clear() {
        processedAssessmentIds.clear();
    }
}
```

---

## 3. Implemented Triggers

1. **`PropertyTrigger.trigger`**:
   - `beforeInsert`: Validates property numbers, checks for duplicates, and auto-assigns municipal zone inspectors.
   - `afterInsert`: Dispatches welcome notification event via Queueable Apex.
2. **`TaxPaymentTrigger.trigger`**:
   - `beforeInsert`: Verifies positive payment amounts and checks external transaction ID uniqueness.
   - `afterInsert`: Updates parent `Tax_Assessment__c` paid balance and marks status as `PAID` or `PARTIALLY_PAID`.
