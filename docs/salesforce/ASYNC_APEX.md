# CivicTax 6.0: Asynchronous Apex Architecture & Batch Operations

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Asynchronous Architecture & Use Cases

CivicTax utilizes Asynchronous Apex strictly where high-volume processing, callouts, or scheduled cron routines require isolation from synchronous Governor Limits:

```
+---------------------------------------------------------------------------------------------------+
|                              CIVICTAX ASYNCHRONOUS APEX SUITE                                     |
+---------------------------------------------------------------------------------------------------+
| 1. Queueable Apex   : NotificationQueueable (External SMS/Email Callouts & Post-Transaction Work)|
| 2. Batch Apex       : OverdueAssessmentBatch (High-volume processing of 50,000+ assessments)    |
| 3. Schedulable Apex : OverdueAssessmentScheduler (Daily 01:00 AM Cron Evaluation)                |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Technical Specifications

### A. Queueable Apex (`NotificationQueueable`)
- **Interface**: `Queueable, Database.AllowsCallouts`
- **Use Case**: Dispatches asynchronous SMS and Email notifications upon payment confirmation without delaying the immediate HTTP response to the citizen.
- **Governor Limit Benefits**: Allows up to 100 callouts per execution and runs in a separate thread with higher heap size limits (12 MB).

### B. Batch Apex (`OverdueAssessmentBatch`)
- **Interface**: `Database.Batchable<sObject>, Database.Stateful`
- **Scope Size**: 100 records per chunk.
- **Query Locator**:
  ```sql
  SELECT Id, Total_Amount__c, Outstanding_Amount__c, Due_Date__c, Assessment_Status__c 
  FROM Tax_Assessment__c 
  WHERE Due_Date__c < :Date.today() AND Assessment_Status__c != 'PAID'
  ```
- **Stateful Accumulator**: `recordsProcessed` tracks total overdue accounts flagged across batches.

### C. Schedulable Apex (`OverdueAssessmentScheduler`)
- **Cron Expression**: `0 0 1 * * ?` (Executes nightly at 01:00 AM IST).
- **Execution**: Instantiates `OverdueAssessmentBatch` with batch chunk size 100.
