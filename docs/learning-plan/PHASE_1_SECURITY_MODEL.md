# Topic 3: Security Model, Sharing & Record-Level Access

## 1. Curriculum Objectives & Data Governance
- **Organization-Wide Defaults (OWD)**:
  - `Property__c`: **Private** (Citizens cannot view peer properties).
  - `Tax_Assessment__c`: **Controlled by Parent** (`Property__c`).
  - `Tax_Payment__c`: **Controlled by Parent** (`Tax_Assessment__c`).
  - `Tax_Rate__c`: **Public Read Only** (Municipal rates are public records).
  - `Case` (Grievances): **Private**.
- **Role Hierarchy**: Municipal Commissioner $\to$ Zonal Joint Commissioner $\to$ Zonal Revenue Officer $\to$ Field Tax Inspector.
- **Criteria-Based Sharing Rules**: Automatically share properties in `Zone 1` with the `Zone 1 Revenue Officers` public group.
- **Field-Level Security (FLS)**: Internal assessment calculation overrides and officer inspection audit logs are hidden from external citizen users.

---

## 2. Sharing & Security Architecture

```
+-------------------------------------------------------------------------------+
|                       CIVICTAX RECORD ACCESS PIPELINE                         |
+-------------------------------------------------------------------------------+

 [ Citizen Context ] ───> OWD Private ───> Access ONLY records where ContactId = User.ContactId
                                                    |
 [ Officer Context ] ───> Role Hierarchy + Criteria Sharing (Zone Match) ───> Zone Records
                                                    |
 [ Admin Context ]   ───> "View All" on Municipal Objects ───> City-Wide Access
```

---

## 3. Status & Evidence

- **Status**: Implemented Locally / Staged in DX Metadata (`salesforce/force-app/main/default/permissionsets/` and object definitions).
- **Security Checkpoint**: Validated against BOLA / Unauthorized peer-record access.
