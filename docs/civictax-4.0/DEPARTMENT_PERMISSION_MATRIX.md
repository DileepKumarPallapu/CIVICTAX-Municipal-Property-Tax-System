# CivicTax 4.0: Comprehensive Department Permission Matrix

## 1. Authorization Overview

CivicTax 4.0 enforces granular action-level permissions across all roles and municipal departments:
- **View**: Read record attributes and inspection history.
- **Create**: Ingest new records or applications.
- **Edit**: Modify permitted field attributes.
- **Delete**: Soft or hard record deletion (strictly restricted).
- **Approve**: Formal sanctioning of verification, assessment, or appeal.
- **Reject**: Formal rejection with mandatory audit justification.
- **Export**: Generation of sanitized CSV/PDF statutory filings.
- **Assign**: Workload routing of tasks and field inspections.
- **Configure**: Modification of system masters, tax rates, and zones.

---

## 2. Master Permission Matrix

| Role Title | View | Create | Edit | Delete | Approve | Reject | Export | Assign | Configure |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Administrator** | Yes | Yes | Yes | Yes (Restricted)| Yes | Yes | Yes | Yes | Yes |
| **Municipal Commissioner** | Yes | No | No | No | Yes | Yes | Yes | Yes | No |
| **Zonal Revenue Officer** | Yes (Zone)| Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| **Property Registration Officer**| Yes | Yes | Yes (Draft)| No | No | No | Yes | No | No |
| **Field Verification Inspector** | Yes (Zone)| No | Yes (Survey)| No | Yes (Recommend)| Yes | No | No | No |
| **Tax Assessment Officer** | Yes | Yes | Yes (Draft)| No | Yes | Yes | Yes | No | No |
| **Revenue & Treasury Officer** | Yes | Yes (Payment)| No | No | No | No | Yes | No | No |
| **Grievance Redressal Officer** | Yes | Yes (Note)| Yes (Case)| No | Yes (Resolve)| No | Yes | Yes | No |
| **Reassessment Appeals Officer**| Yes | No | Yes (Review)| No | Yes | Yes | Yes | No | No |
| **Zone Supervisor** | Yes (Zone)| No | No | No | Yes | Yes | Yes | Yes | No |
| **Municipal Auditor** | Yes (All)| No | No | No | No | No | Yes | No | No |
| **Registered Citizen** | Yes (Own)| Yes | Yes (Draft)| No | No | No | Yes (Receipt)| No | No |
