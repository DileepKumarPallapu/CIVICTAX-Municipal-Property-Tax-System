# Topic 15: Testing, Debugging, Deployment & Asynchronous Apex

## 1. Testing Standards & Test Data Factory

- **Coverage Target**: $\ge 85\%$ across all Apex classes, handlers, and asynchronous jobs.
- **Test Isolation**: All test classes enforce `@isTest(SeeAllData=false)`.
- **Test Data Factory (`CivicTaxTestDataFactory.cls`)**:
  - `createMunicipalZone(String zoneName)`
  - `createTaxRate(String category, Decimal rate)`
  - `createVerifiedProperty(Id contactId, Id zoneId)`
  - `createAssessment(Id propertyId, Decimal total)`

---

## 2. Asynchronous Apex Implementations

### 2.1 Queueable Apex: `ReceiptDispatchQueueable`
- Generates digital payment receipt hashes and dispatches outbound notifications asynchronously without blocking checkout DML.

### 2.2 Batch Apex: `AnnualTaxAssessmentBatch`
- Implements `Database.Batchable<SObject>`, `Database.Stateful`.
- Iterates over verified properties in chunks of 200 to generate annual assessment demand statements.

### 2.3 Scheduled Apex: `DailyOverduePenaltyScheduler`
- Runs daily at 00:00 IST; compounds statutory late penalties for delinquent assessments past due date.

---

## 3. Debugging & Deployment Protocols
- **Debug Logs**: Configured via Developer Console for tracing `USER_DEBUG` and `LIMIT_USAGE`.
- **Salesforce CLI**: Deployment executed via `sf project deploy start --target-org CivicTaxPlayground`.
