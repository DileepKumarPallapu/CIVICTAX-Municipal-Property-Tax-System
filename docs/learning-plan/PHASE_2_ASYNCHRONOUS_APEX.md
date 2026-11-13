# Topic 15 (Part 2): Asynchronous Apex Patterns & Governor Limits

## 1. Asynchronous Architecture Comparison

| Asynchronous Pattern | Interface / Annotation | Governor Limit (SOQL / Heap) | Primary CivicTax Use Case |
| :--- | :--- | :--- | :--- |
| **Queueable Apex** | `System.Queueable` | 200 SOQL / 12 MB Heap | Payment confirmation & receipt generation; supports chaining. |
| **Batch Apex** | `Database.Batchable<SObject>`| 50 Million Records Query / 200 scope | City-wide annual assessment generation ($500,000+$ properties). |
| **Scheduled Apex** | `System.Schedulable` | Normal Async Limits | Daily midnight execution for overdue interest compounding. |
| **Future Methods** | `@future(callout=true)` | 200 SOQL / Primitive params only | Legacy external bank webhook verification. |

---

## 2. Asynchronous Execution Code Samples

```apex
// 1. Enqueue Receipt Processing
Id queueableJobId = System.enqueueJob(new NotificationQueueable(paymentIdList));

// 2. Schedule Midnight Delinquency Evaluation
String cronExp = '0 0 0 * * ?'; // Every day at midnight
System.schedule('CivicTax Daily Overdue Evaluator', cronExp, new OverdueAssessmentScheduler());
```
