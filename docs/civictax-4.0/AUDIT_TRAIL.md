# CivicTax 4.0: Immutable Audit Trail & Financial Governance

## 1. Audit Trail Schema

CivicTax 4.0 enforces an immutable system event log capturing eight statutory audit attributes for every significant mutation:

```typescript
export interface ApplicationAuditRecord {
  id: string;               // Unique audit log UUID
  actorId: string;          // User ID or System Agent who initiated the event
  actorName: string;        // Human-readable actor display name and role
  action: string;           // CREATE, UPDATE, VERIFY, APPROVE, REJECT, PAYMENT, EXPORT
  recordType: string;       // Property, TaxAssessment, Payment, Grievance, TaxRate
  recordId: string;         // Unique reference of the target entity
  previousValue: string;    // JSON stringified previous state or snapshot
  newValue: string;         // JSON stringified new state
  timestamp: string;        // ISO 8601 UTC timestamp
  reason: string;           // Mandatory justification note (for approvals, rejections, or rate edits)
  source: string;           // Web Portal, Mobile Inspector App, REST Gateway, Batch Job
  clientIp?: string;        // Client IP address (captured by Express Gateway)
}
```

---

## 2. Protected Audit Log Categories

1. **Financial Ledger Invariance**:
   - Every recorded tax payment generates an unalterable audit record.
   - Deletion of `Tax_Payment__c` or manual overrides of `Amount_Paid__c` are prohibited.
2. **Approval History Invariance**:
   - Officer verifications and reassessment decisions record the officer's exact timestamped notes.
   - Rejections must provide a non-empty `reason` string to commit.
3. **Tax Rate Amendment History**:
   - Any modification to base unit rates per square foot logs the approving authority and previous active tariffs.
