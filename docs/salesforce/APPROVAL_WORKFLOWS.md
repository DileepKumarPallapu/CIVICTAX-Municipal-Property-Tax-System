# CivicTax 6.0: Statutory Approval Processes & Governance Workflows

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Approval Workflow Matrix

CivicTax enforces multi-step statutory approval gates across three critical municipal operations:

```
+---------------------------------------------------------------------------------------------------+
|                                CIVICTAX STATUTORY APPROVAL PIPELINES                              |
+---------------------------------------------------------------------------------------------------+
| 1. Property Verification Approval : Physical survey review for large commercial/industrial plots   |
| 2. High-Value Assessment Approval : Multi-step review for annual tax bills exceeding INR 50,000    |
| 3. Reassessment Revision Approval : Two-step approval (Surveyor Recommendation -> Commissioner)  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. High-Value Tax Assessment Approval Process Specification

```
[ Officer Drafts Assessment ]
               │
               ▼
   [ Total_Tax__c > 50,000? ] ──────► NO ──► Auto-Approve & Publish
               │ YES
               ▼
[ Entry Criteria: Submit for Approval ]
- Status changes to: "Pending Approval"
- Record Locked against modification
               │
               ▼
  [ Step 1: Revenue Supervisor Review ]
  - Assigned Approver: Zonal Revenue Supervisor
  - Actions:
      * Approve: Forwards to Municipal Commissioner
      * Reject : Status updated to "Draft", mandatory rejection comments logged
               │
               ▼
[ Step 2: Municipal Commissioner Final Statutory Approval ]
- Assigned Approver: Municipal Commissioner
- Actions:
    * Approve: Status updated to "Approved", record unlocked, citizen notified
    * Reject : Status updated to "Rejected"
```

---

## 3. Reassessment Approval Process Specification

1. **Initial Submission Actions**:
   - `Approval_Status__c` updated to `Submitted`.
   - Record locked from editing by citizen or desk clerk.
2. **Approval Step 1 (Technical Verification)**:
   - Approver: Senior Municipal Surveyor.
   - Criteria: Physical ground verification confirms dimensional change.
   - Outcome: Advances `Approval_Status__c` to `Recommended`.
3. **Approval Step 2 (Statutory Sanction)**:
   - Approver: Assistant Revenue Commissioner / Municipal Commissioner.
   - Criteria: Concurrence with financial recalculation delta.
   - Outcome: `Approval_Status__c` updated to `Approved`; triggers automated generation of Version 2 tax bill and credit/arrears adjustment note.
4. **Rejection Actions**:
   - `Approval_Status__c` updated to `Rejected`; approver remarks mandatory; record unlocked for citizen appeal.
