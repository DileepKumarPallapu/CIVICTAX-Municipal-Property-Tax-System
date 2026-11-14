# CivicTax 6.0: Apex Trigger Architecture, Execution Order & Recursion Control

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Trigger Design Principles

CivicTax follows the **One-Trigger-Per-Object** pattern. Business logic is strictly separated into dedicated handler service classes:

```
[ sObject DML Event (Insert / Update) ]
                  │
                  ▼
       [ Object Trigger Entry ]
       (PropertyTrigger / TaxPaymentTrigger / TaxAssessmentTrigger)
                  │
                  ▼
       [ Context Verification ]
       (isBefore / isAfter / isInsert / isUpdate)
                  │
                  ▼
       [ Static Recursion Guard ]
       (CivicTaxRecursionControl.isTriggerRunning)
                  │
                  ▼
       [ Dedicated Handler Invocation ]
       (CivicTaxPropertyTriggerHandler / CivicTaxPaymentTriggerHandler)
                  │
                  ▼
       [ Bulkified DML / Downstream Events ]
```

---

## 2. Trigger Inventory

| Trigger Name | Target Object | Events Monitored | Delegated Handler Class | Primary Responsibility |
|---|---|---|---|---|
| `PropertyTrigger` | `Property__c` | `before insert`, `before update`, `after update` | `CivicTaxPropertyTriggerHandler` | Initial defaults (`Registration_Date__c`, `Verification_Status__c = 'Pending'`), illegal state transition guards. |
| `TaxPaymentTrigger` | `Tax_Payment__c` | `before insert`, `after insert` | `CivicTaxPaymentTriggerHandler` | Timestamp defaults, receipt reference generation, balance reconciliation triggers. |
| `TaxAssessmentTrigger` | `Tax_Assessment__c` | `before insert`, `before update` | `CivicTaxAssessmentTriggerHandler` | Default status initialization, total amount synchronization, anti-reversion rules. |

---

## 3. Recursion Control (`CivicTaxRecursionControl.cls`)

To prevent circular trigger loops during cascaded record updates:

```apex
public class CivicTaxRecursionControl {
    public static Boolean isPropertyTriggerRunning = false;
    public static Boolean isPaymentTriggerRunning = false;
    public static Boolean isAssessmentTriggerRunning = false;

    public static void resetAll() {
        isPropertyTriggerRunning = false;
        isPaymentTriggerRunning = false;
        isAssessmentTriggerRunning = false;
    }
}
```

- Each handler checks the static flag upon entry.
- The flag is reset in a `finally` block to guarantee state integrity even if unhandled exceptions occur.
