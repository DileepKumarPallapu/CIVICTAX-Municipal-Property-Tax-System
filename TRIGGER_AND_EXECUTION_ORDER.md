# Salesforce Trigger Architecture & Order of Execution Guide

## 1. Authoritative Order of Execution

In Salesforce, whenever a CivicTax record is saved (e.g. a Property registration or Tax Payment), the platform executes the following documented sequence:

```mermaid
flowchart TD
    A["1. Load Record / Initialize DML"] --> B["2. System Validation (Required, Field Formats)"]
    B --> C["3. Before-Save Record-Triggered Flows"]
    C --> D["4. Before Triggers (e.g. PropertyTrigger before insert)"]
    D --> E["5. Custom Validation Rules (e.g. Built_Up_Area_Must_Be_Positive)"]
    E --> F["6. Duplicate Rules Evaluation"]
    F --> G["7. Record Saved (Not yet committed to DB)"]
    G --> H["8. After Triggers (e.g. TaxPaymentTrigger after insert)"]
    H --> I["9. Assignment / Auto-Response Rules"]
    I --> J["10. Workflow Rules / Process Builder"]
    J --> K["11. After-Save Record-Triggered Flows"]
    K --> L["12. Roll-Up Summary Calculations"]
    L --> M["13. Database Commit (Transaction Finalized)"]
    M --> N["14. Post-Commit Actions (Outbound Messages, Async Enqueuing)"]
```

---

## 2. CivicTax Trigger Architecture

### One Trigger Per Object Design
- `PropertyTrigger.trigger`: Handles timestamp stamping and initial default status assignments.
- `TaxPaymentTrigger.trigger`: Handles after-insert rollup into `Tax_Assessment__c` (`Amount_Paid__c`, `Outstanding_Amount__c`, `Assessment_Status__c`).

### Robust Recursion Control
To avoid infinite recursion without skipping legitimate bulk records:
1. Logic is placed inside dedicated service classes rather than raw trigger scripts.
2. Idempotent check ensures parent balances are only recalculated when payment delta $\neq 0$.
3. Bulkified collections (`Set<Id>`, `Map<Id, sObject>`) process hundreds of payments in a single transaction without hitting governor limits.
