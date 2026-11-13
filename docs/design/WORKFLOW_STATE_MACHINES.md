# CIVICTAX Workflow State Machines

## 1. Property Verification State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Citizen Submits Registration
    PENDING --> VERIFIED: Officer Approves Deed & Site Inspection
    PENDING --> RESUBMISSION_REQUIRED: Officer Finds Discrepancy
    RESUBMISSION_REQUIRED --> PENDING: Citizen Uploads Revised Deed
    PENDING --> REJECTED: Title Dispute / Demarcation Violation
    VERIFIED --> [*]: Eligible for Assessment Billing
    REJECTED --> [*]: Case Closed (Disputed)
```

- **Allowed Transitions**:
  - `PENDING` $\rightarrow$ `VERIFIED`, `RESUBMISSION_REQUIRED`, `REJECTED`
  - `RESUBMISSION_REQUIRED` $\rightarrow$ `PENDING`
- **Forbidden Transitions**:
  - `REJECTED` $\rightarrow$ `VERIFIED` (Requires new registration)
  - Direct transition to `VERIFIED` without officer review

---

## 2. Tax Assessment & Payment State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Assessment Generated
    DRAFT --> APPROVED: Municipal Officer Confirms Gazette Rate
    APPROVED --> PARTIALLY_PAID: Partial Payment Settled (Outstanding > 0)
    APPROVED --> PAID: Full Payment Settled (Outstanding = 0)
    PARTIALLY_PAID --> PAID: Remaining Balance Settled (Outstanding = 0)
    APPROVED --> OVERDUE: Due Date Elapsed Without Settlement
    PARTIALLY_PAID --> OVERDUE: Due Date Elapsed on Remaining Balance
    OVERDUE --> PAID: Arrears Settled with Penalty Surcharge
    PAID --> [*]: Municipal Tax Clearance Achieved
```

- **Allowed Transitions**:
  - `DRAFT` $\rightarrow$ `APPROVED`
  - `APPROVED` $\rightarrow$ `PARTIALLY_PAID`, `PAID`, `OVERDUE`
  - `PARTIALLY_PAID` $\rightarrow$ `PAID`, `OVERDUE`
  - `OVERDUE` $\rightarrow$ `PAID`
- **Forbidden Transitions**:
  - `PAID` $\rightarrow$ `APPROVED` or `DRAFT` (Financial settlement is immutable)
  - `DRAFT` $\rightarrow$ `PAID` (Cannot pay unapproved bill)

---

## 3. Citizen Grievance State Machine

```mermaid
stateDiagram-v2
    [*] --> OPEN: Citizen Lodges Complaint Ticket
    OPEN --> IN_PROGRESS: Assigned Officer Begins Field Investigation
    IN_PROGRESS --> RESOLVED: Officer Enters Resolution Comments
    RESOLVED --> CLOSED: Citizen Acknowledges or 14-Day Inactivity
    CLOSED --> [*]: Ticket Archived
```

- **Mandatory Guard**: Transition to `RESOLVED` requires non-blank `resolutionComments`.
