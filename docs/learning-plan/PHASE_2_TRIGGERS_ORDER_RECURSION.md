# Topic 14: Apex Triggers, Order of Execution & Recursion Governance

## 1. Trigger Framework Architecture

CivicTax mandates the **Single Trigger Per Object** pattern and routes execution to dedicated handlers:

```
salesforce/force-app/main/default/triggers/
├── PropertyTrigger.trigger           (Delegates to PropertyTriggerHandler.cls)
└── TaxPaymentTrigger.trigger         (Delegates to TaxPaymentTriggerHandler.cls)
```

---

## 2. Trigger Context Variables & Handling

| Event | Handler Method | Business Responsibility |
| :--- | :--- | :--- |
| `beforeInsert` | `onBeforeInsert(List<SObject> newList)` | Input sanitization, default status assignment, duplicate reference checks. |
| `afterInsert` | `onAfterInsert(List<SObject> newList, Map<Id, SObject> newMap)` | Roll-up calculations to parent assessment, enqueuing asynchronous receipt dispatch. |
| `beforeUpdate` | `onBeforeUpdate(Map<Id, SObject> oldMap, Map<Id, SObject> newMap)` | Validating state transition legality (e.g. preventing unverified assessment generation). |
| `afterUpdate` | `onAfterUpdate(Map<Id, SObject> oldMap, Map<Id, SObject> newMap)` | Syncing balance status updates, triggering delinquent recovery cases. |

---

## 3. Order of Execution & Set-Based Recursion Control

- **Statutory 20-Step Pipeline**: Triggers before-save validation $\to$ custom validation rules $\to$ after-save triggers $\to$ roll-up summary fields $\to$ commit.
- **Idempotent Set-Based Recursion Control**:
  ```apex
  public class CivicTaxRecursionControl {
      private static Set<Id> processedPayments = new Set<Id>();
      public static Boolean hasProcessed(Id paymentId) {
          return processedPayments.contains(paymentId);
      }
      public static void markProcessed(Id paymentId) {
          processedPayments.add(paymentId);
      }
  }
  ```
  *Prevents infinite recursion loops while safely processing all 200 records in a bulk batch.*
