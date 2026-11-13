# CivicTax Asynchronous Apex Architecture & Execution

## 1. Asynchronous Design Overview

CivicTax utilizes Asynchronous Apex to execute resource-intensive tasks off the main synchronous execution thread, preventing governor limit exhaustion.

---

## 2. Asynchronous Patterns Implemented (`CivicTaxAsyncJobs.cls`)

### 2.1 Queueable Apex: `NotificationQueueable`
- **Interface**: `System.Queueable`, `Database.AllowsCallouts`
- **Use Case**: Asynchronous generation of citizen tax payment receipts and external SMS/email dispatch.
- **Benefits**: Can chain jobs and supports complex objects/collections in parameters (unlike `@future`).
```apex
public class NotificationQueueable implements Queueable, Database.AllowsCallouts {
    private List<Id> paymentIds;
    public NotificationQueueable(List<Id> paymentIds) {
        this.paymentIds = paymentIds;
    }
    public void execute(QueueableContext context) {
        // Dispatches payment notifications without blocking payment DML
        CivicTaxNotificationService.dispatchReceiptNotifications(paymentIds);
    }
}
```

### 2.2 Batch Apex: `AnnualAssessmentBatch`
- **Interface**: `Database.Batchable<SObject>`, `Database.Stateful`
- **Use Case**: Generates annual tax demand statements for $500,000+$ registered properties at the start of each fiscal year.
- **Batch Size**: 200 records per execution.
```apex
public class AnnualAssessmentBatch implements Database.Batchable<SObject>, Database.Stateful {
    public Integer totalProcessed = 0;
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Built_Up_Area__c, Property_Category__c, Municipal_Zone__c 
            FROM Property__c 
            WHERE Verification_Status__c = 'VERIFIED'
        ]);
    }
    public void execute(Database.BatchableContext bc, List<Property__c> scope) {
        List<Tax_Assessment__c> assessments = TaxAssessmentService.generateBulkAssessments(scope);
        insert assessments;
        totalProcessed += scope.size();
    }
    public void finish(Database.BatchableContext bc) {
        // Log batch summary to Application_Audit__c
    }
}
```

### 2.3 Schedulable Apex: `OverdueAssessmentScheduler`
- **Interface**: `System.Schedulable`
- **Use Case**: Runs daily at midnight to inspect assessments whose `Due_Date__c < TODAY()`, marking status as `OVERDUE` and applying statutory arrears penalties.
```apex
public class OverdueAssessmentScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Id batchJobId = Database.executeBatch(new OverduePenaltyBatch(), 200);
    }
}
```
