# CIVICTAX Financial Integrity & Concurrency Controls

## 1. Core Financial Invariants

CivicTax maintains strict database and ledger invariants across all storage providers:

1. **Overpayment Prevention Invariant**:
   $$\forall \text{ transaction } t, \quad t.\text{amount} \le \text{Assessment}.\text{outstandingBalance}$$
   Any payment payload with an amount exceeding the current unpaid balance is immediately rejected with HTTP 400 / `BusinessRuleError`.
2. **Double-Spend & Duplicate Transaction Protection**:
   - Every payment payload carries a unique `transactionId`.
   - In localStorage, `LocalPaymentService` checks:
     ```typescript
     if (payments.some(p => p.transactionId === transactionId)) {
       throw new BusinessRuleError('Duplicate transaction reference detected.');
     }
     ```
   - In Salesforce Apex, `Transaction_ID__c` is an external ID with a database-level unique constraint.
3. **Pessimistic Concurrency (Row-Level Locking)**:
   In multi-user Salesforce environments, `PaymentService.cls` acquires an exclusive row lock prior to reading and updating the parent assessment:
   ```apex
   List<Tax_Assessment__c> asms = [
       SELECT Id, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c 
       FROM Tax_Assessment__c 
       WHERE Id = :assessmentId 
       WITH USER_MODE 
       FOR UPDATE
   ];
   ```
   This prevents concurrent partial payments from resulting in race conditions or negative balances.
4. **Failed Payment Isolation**:
   Payment attempts that fail (e.g. simulated network timeout or bank rejection) are flagged as `FAILED` and are excluded from all municipal collection aggregates.
