# CivicTax Trigger Architecture & Salesforce Order of Execution

## 1. Single Trigger Per Object Architecture

CivicTax strictly adheres to the **One Trigger Per Object** pattern, routing events to dedicated handler classes:

```
+-------------------------------------------------------------------------------+
|                        TRIGGER EVENT PROCESSING PIPELINE                      |
+-------------------------------------------------------------------------------+

   [ SObject DML Ingestion ]
               |
               v
   [ TaxPaymentTrigger.trigger ]
               |
               v
   [ TaxPaymentTriggerHandler.cls ]
               |
               +---> beforeInsert(): Validate positive amounts & unique Tx ID
               |
               +---> afterInsert(): Roll up paid amounts to parent Tax_Assessment__c
```

---

## 2. Salesforce Order of Execution (API v60.0 Alignment)

When a citizen makes a property tax payment, Salesforce executes the following statutory 20-step pipeline:

```
 1. System loads original record or initializes new Tax_Payment__c record.
 2. System overrides values from layout (field formats, etc.).
 3. Executes before-record-triggered Flows.
 4. Executes before-insert/before-update Apex Triggers (TaxPaymentTrigger: beforeInsert).
 5. Evaluates System Validation Rules and Custom Validation Rules (e.g. positive amount).
 6. Executes Duplicate Rules.
 7. Saves record to database (NOT yet committed).
 8. Executes after-insert/after-update Apex Triggers (TaxPaymentTrigger: afterInsert).
 9. Executes Assignment Rules.
10. Executes Auto-Response Rules.
11. Executes Workflow Rules.
12. Executes Escalation Rules.
13. Executes Processes and after-save Flows (Payment_Confirmation_Flow).
14. Executes Entitlement Rules.
15. Evaluates Approval Processes.
16. Evaluates Roll-Up Summary Fields on parent Tax_Assessment__c.
17. Executes Triggers on parent object (TaxAssessmentTrigger on updated parent).
18. Executes Criteria-Based Sharing Rules.
19. Commits DML to database.
20. Executes Post-Commit Logic (enqueues Queueable/Future jobs, outbound messages).
```
