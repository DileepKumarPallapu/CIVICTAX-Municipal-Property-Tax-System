# CIVICTAX Data Integrity, Concurrency & Migration Design

## 1. Data Integrity & Invariants

CivicTax maintains strict mathematical and referential invariants:

1. **Financial Ledger Invariant**:
   $$\text{Outstanding Balance} = \text{Total Assessed Tax} - \sum \text{Successful Payments}$$
   - Any transaction attempting to reduce the outstanding balance below zero is rejected.
2. **Pessimistic Concurrency (Row-Level Locking)**:
   - In Salesforce Apex, `PaymentService.cls` queries target assessments using `FOR UPDATE`, acquiring an exclusive row lock to prevent race conditions during concurrent payments.
3. **Idempotency Protection**:
   - Every payment submission includes a unique client-generated or gateway `transactionId`.
   - The database enforces uniqueness on `Transaction_ID__c`. Duplicate submissions return the existing receipt without duplicate balance deductions.

---

## 2. Versioned Local Storage Migration Strategy

For local demonstration mode, the storage engine includes versioned schema initialization in `src/services/storageService.ts`:

- **Version Key**: `civictax_is_initialized_v4`
- **Migration Logic**:
  ```typescript
  if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    // Clean migration: seed default demonstration properties and accounts
    this.resetToSeedData();
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
  ```
- **Safety Rule**: Existing user-created properties and payments are preserved during session reloads. The admin "Reset Demo Data" action requires explicit confirmation before re-seeding.
