# 10 — CivicTax Municipal Workflow Audit & State Machine Verification

## 1. Municipal Lifecycle State Machines

CivicTax models three mission-critical administrative state machines: Property Lifecycle, Grievance Redressal, and Assessment Lifecycle.

---

## 2. State Machine Transition Verification

### 2.1 Property Lifecycle
```
[ REGISTERED ] ──( Officer Inspects )──> [ PENDING_VERIFICATION ]
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
                  [ VERIFIED ]                                      [ REJECTED ]
                        │                                                 │
                        ▼                                                 ▼
             (Ready for Assessment)                           (Citizen Resubmission)
```

### 2.2 Assessment Billing Lifecycle
```
[ DRAFT ] ──> [ FINALIZED ] ──( Due Date Breached )──> [ OVERDUE ]
                     │                                      │
                     ├──────────( Partial Payment )─────────┤
                     ▼                                      ▼
             [ PARTIALLY_PAID ]                     [ PARTIALLY_PAID ]
                     │                                      │
                     └────────────( Full Payment )──────────┘
                                      │
                                      ▼
                                   [ PAID ]
```

### 2.3 Grievance Redressal Lifecycle
```
[ SUBMITTED ] ──> [ ASSIGNED ] ──> [ UNDER_INVESTIGATION ] ──> [ RESOLVED ]
                                                                     │
                                                     (Citizen Unsatisfied)
                                                                     ▼
                                                                [ REOPENED ]
```

---

## 3. Workflow Audit Findings

1. **State Protection**: Rejection of transitions that violate sequential logic (e.g. marking an unverified property as `VERIFIED` without officer credentials).
2. **Reopening Safety**: Citizens can reopen a resolved grievance within statutory limits while preserving previous investigation notes.
