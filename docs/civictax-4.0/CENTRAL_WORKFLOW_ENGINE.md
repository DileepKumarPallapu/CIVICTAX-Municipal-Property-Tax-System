# CivicTax 4.0: Central Workflow State Machine Engine

## 1. Centralized State Machine Governance

CivicTax 4.0 strictly forbids arbitrary status updates in the UI. All lifecycle transitions must follow validated state transition paths enforced by backend validators and Apex triggers.

---

## 2. Defined Domain State Machines

### 2.1 Property Cadastral Lifecycle
```
[ DRAFT ] ──( Citizen Submits )──> [ SUBMITTED ] ──( Assigned to Field Officer )──> [ UNDER_VERIFICATION ]
                                                                                             │
                                            ┌────────────────────────────────────────────────┴──────────────────┐
                                            ▼                                                                   ▼
                                      [ VERIFIED ]                                                        [ REJECTED ]
                                            │                                                                   │
                                  (Sanction by Officer)                                               (Citizen Resubmission)
                                            ▼                                                                   ▼
                                       [ ACTIVE ]                                                         [ SUBMITTED ]
```

### 2.2 Tax Assessment Lifecycle
```
[ DRAFT ] ──( Officer / Batch Computes )──> [ CALCULATED ] ──( Submitted for Review )──> [ PENDING_APPROVAL ]
                                                                                                │
                                            ┌───────────────────────────────────────────────────┴───────────────────┐
                                            ▼                                                                       ▼
                                      [ APPROVED ]                                                            [ REJECTED ]
                                            │                                                                       │
                                  (Final Bill Published)                                                    (Tariff Correction)
                                            ▼                                                                       ▼
                                      [ PUBLISHED ] ──( Fully Paid )──> [ PAID ]                                 [ DRAFT ]
```

### 2.3 Tax Payment Transaction Lifecycle
```
[ INITIATED ] ──( Gateway Handshake )──> [ PENDING_CONFIRMATION ]
                                                    │
                         ┌──────────────────────────┴──────────────────────────┐
                         ▼                                                     ▼
                  [ SUCCESSFUL ]                                           [ FAILED ]
                         │                                                     │
               (Receipt & Balance Updated)                               (Retry Permitted)
```

### 2.4 Citizen Grievance Lifecycle
```
[ SUBMITTED ] ──( Zonal Routing )──> [ ASSIGNED ] ──( Inspector Review )──> [ IN_PROGRESS ]
                                                                                   │
                                                                                   ▼
                                                                             [ RESOLVED ]
                                                                                   │
                                                      (Citizen Feedback / Formal Sign-off)
                                                                                   ▼
                                                                               [ CLOSED ]
```

### 2.5 Reassessment Appeal Lifecycle
```
[ SUBMITTED ] ──( Case Ingestion )──> [ UNDER_REVIEW ] ──( Surveyor Check )──> [ RECOMMENDED ]
                                                                                       │
                                                                                       ▼
                                                                             [ PENDING_APPROVAL ]
                                                                                       │
                                                     ┌─────────────────────────────────┴──────────────────┐
                                                     ▼                                                    ▼
                                               [ APPROVED ]                                         [ REJECTED ]
                                                     │                                                    │
                                            (Revised Bill Issued)                                (Notice of Dismissal)
```

---

## 3. Enforcement Invariants
- Direct status jumps (e.g. `DRAFT` $\to$ `ACTIVE` without `VERIFIED`) are strictly rejected with HTTP 400 (`ILLEGAL_STATE_TRANSITION`).
- Status rollbacks are only permitted through audited administrative exception workflows.
