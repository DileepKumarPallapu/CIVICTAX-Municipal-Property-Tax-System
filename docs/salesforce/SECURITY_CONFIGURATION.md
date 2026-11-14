# CivicTax 6.0: User Management, Roles & Multi-Layer Security Configuration

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Organization-Wide Defaults (OWD)

To satisfy municipal confidentiality and statutory auditability requirements:

| Object | Organization-Wide Default (Internal) | Organization-Wide Default (External) | Architectural Justification |
|---|---|---|---|
| `Property__c` | **Public Read-Only** | **Private** | Officers can view across zones; citizens see only their owned properties. |
| `Tax_Assessment__c` | **Controlled by Parent** | **Controlled by Parent** | Inherits security posture from master `Property__c`. |
| `Tax_Payment__c` | **Controlled by Parent** | **Controlled by Parent** | Inherits security posture from master `Tax_Assessment__c`. |
| `Reassessment_Request__c`| **Private** | **Private** | Sensitive revision dockets visible only to owner and adjudicating officers. |
| `Case` (Grievances) | **Private** | **Private** | Citizen complaints restricted to filing citizen and assigned queue. |

---

## 2. Municipal Role Hierarchy

```
                            [ Municipal Commissioner ]
                                        │
                         [ Deputy Revenue Commissioner ]
                                        │
            ┌───────────────────────────┴───────────────────────────┐
            ▼                                                       ▼
   [ Zonal Revenue Officer ]                              [ Grievance Ombudsman ]
   (Zone 01 / North Sector)                                         │
            │                                                       │
   [ Revenue Inspector ]                                  [ Grievance Officer ]
            │
   [ Field Survey Officer ]
```

- **Grant Access Using Hierarchies**: Enabled on all custom objects. Senior officers automatically inherit read/edit visibility over records owned by subordinate zonal personnel.

---

## 3. Department Permission Sets & Access Matrix

| Object | Registration | Verification | Assessment | Revenue | Grievance | Reassessment | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `Property__c` | C / R / U | R / U | R | R | R | R | R |
| `Tax_Assessment__c` | — | — | C / R / U | R / U | R | R | R |
| `Tax_Payment__c` | — | — | — | C / R | — | — | R |
| `Reassessment_Request__c`| — | — | — | — | — | C / R / U | R |
| `Case` / `Grievance__c` | — | — | — | — | C / R / U | — | R |

*(Legend: C = Create, R = Read, U = Update, D = Delete prohibited across all operational roles)*

---

## 4. Sharing Rules & Ownership Restrictions

1. **Citizen Owner Sharing Rule**:
   - Criteria: `Property__c.Owner__c = $User.ContactId`
   - Access: Read-Only for registered citizen portal users.
2. **Zonal Officer Criteria-Based Sharing**:
   - Criteria: `Property__c.Zone__c = 'Zone 01'`
   - Shared With: Public Group `Zone_01_Officers`
   - Access: Read/Write.
3. **Audit Trail Invariance**:
   - Delete permissions are explicitly stripped across all Profiles and Permission Sets to guarantee regulatory compliance with the Municipal Act.
