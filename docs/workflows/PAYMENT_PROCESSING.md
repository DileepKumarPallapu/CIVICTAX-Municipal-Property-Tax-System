# CivicTax 5.0: Payment Automation & Treasury Reconciliation

## 1. End-to-End Payment Lifecycle

```
[ Citizen Assessment Statement ]
          │  1. Citizen selects assessment and chooses payment mode (Full / Partial)
          │  2. System verifies current outstanding balance (> 0)
          ▼
[ Payment Initiation ]
          │  3. Generates unique external payment reference (e.g. "TXN-2026-00984")
          │  4. Enters status: 'PENDING_CONFIRMATION'
          ▼
[ Gateway Handshake ] (Sandbox / Simulated Mode Clearly Disclosed)
          │  5. Evaluates payment webhook response
          │  6. Prevents duplicate submission via idempotency token check
          ▼
[ Transaction Recording & Settlement ]
          │  7. Creates immutable Tax_Payment__c receipt record
          │  8. Recalculates assessment outstanding balance atomically
          │  9. Generates official digital payment receipt with verification QR code
          ▼
[ Treasury Ledger Reconciliation ]
          │ 10. Automatically updates daily and zonal treasury collection ledgers
```

---

## 2. Invariants & Financial Safeguards

1. **Anti-Overpayment Guard**: Payment amount cannot exceed the assessment's current outstanding balance.
2. **Double Payment Prevention**: Assessments with status `PAID` reject subsequent checkout attempts.
3. **Sandbox Disclosure**: All demo payments are clearly tagged with `isSimulated: true`.
