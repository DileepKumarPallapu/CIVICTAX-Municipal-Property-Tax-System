# Topic 6: Case Management & Service Automation for Citizen Grievances

## 1. Curriculum Objectives & Municipal Alignment
Demonstrates standard Salesforce Service Cloud concepts using the standard `Case` object for **Citizen Grievance Redressal**:
- **Case Queues**: `Zone 1 Grievance Queue`, `Zone 2 Grievance Queue`, `Tax Assessment Dispute Queue`.
- **Case Assignment Rules**: Routes new grievances automatically based on `Property__c.Municipal_Zone__c`.
- **Escalation Rules**: If a high-priority tax dispute remains unresolved for $>5$ working days, escalate to Zonal Joint Commissioner.
- **Service Console**: Three-panel console view displaying citizen contact details, property assessment history, and grievance case timeline.
- **Knowledge Articles**: Pre-authored FAQ solutions on *"How to calculate commercial property tax rebates"*, *"How to apply for property mutation"*.

---

## 2. Citizen Grievance Types Mapped to `Case`

| Grievance Category | Case Priority | SLA Milestone | Assigned Queue |
| :--- | :--- | :--- | :--- |
| **Tax Calculation Dispute** | `HIGH` | 7 Working Days | Tax Assessment Dispute Queue |
| **Payment Not Credited** | `CRITICAL` | 3 Working Days | Revenue Reconciliation Lead |
| **Property Information Error**| `MEDIUM` | 10 Working Days | Zonal Field Inspector Queue |
| **Ownership Mutation Delay** | `HIGH` | 14 Working Days | Zonal Revenue Officer |

---

## 3. Status & Evidence

- **Status**: Implemented Locally / Staged in DX Metadata (`salesforce/force-app/main/default/objects/Case/` & Flow mappings).
- **Service API**: Integrated via `CivicTaxCaseService.cls` and React citizen grievance page.
