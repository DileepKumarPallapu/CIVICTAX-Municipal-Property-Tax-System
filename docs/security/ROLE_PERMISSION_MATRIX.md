# CIVICTAX Role-Based Access Control & Permission Matrix

## 1. Deep Permission Matrix

| Resource / Action | Citizen (`CITIZEN`) | Municipal Officer (`OFFICER`) | Municipal Administrator (`ADMIN`) | Public Visitor (`PUBLIC`) |
| :--- | :---: | :---: | :---: | :---: |
| **View Landing & About** | Allowed | Allowed | Allowed | Allowed |
| **View Transparency Portal** | Allowed (PII-Safe) | Allowed (PII-Safe) | Allowed (PII-Safe) | Allowed (PII-Safe) |
| **Register Property** | Allowed (Self) | Allowed (Assigned Ward) | Allowed (City-Wide) | Denied (Requires Auth) |
| **View Property Details** | Own Records Only | Assigned Zone Only | All Municipal Records | Denied |
| **Approve / Verify Property** | **DENIED** | Allowed (Assigned Zone) | Allowed (City-Wide) | Denied |
| **View Tax Assessments** | Own Records Only | Assigned Zone Only | All Municipal Records | Denied |
| **Generate Annual Assessment** | **DENIED** | Allowed (Assigned Zone) | Allowed (City-Wide) | Denied |
| **Simulate Tax Payment** | Own Records Only | Denied | Allowed (Demo) | Denied |
| **Download Tax Receipt** | Own Records Only | Assigned Zone Only | All Municipal Records | Denied |
| **Submit Grievance Ticket** | Allowed (Self) | Allowed | Allowed | Denied |
| **Resolve Grievance** | **DENIED** | Allowed (Assigned Zone) | Allowed (City-Wide) | Denied |
| **Submit Reassessment** | Allowed (Self) | Denied | Allowed (Demo) | Denied |
| **Review Reassessment** | **DENIED** | Allowed (Assigned Zone) | Allowed (City-Wide) | Denied |
| **Delinquent Recovery Triage** | **DENIED** | Allowed (Assigned Zone) | Allowed (City-Wide) | Denied |
| **Risk & Compliance Audit** | **DENIED** | View / Triage | Full Management | Denied |
| **Municipal GIS Map** | **DENIED** | View / Filter | View / Filter | Denied |
| **Revenue Forecasting Lab** | **DENIED** | **DENIED** | Full Management | Denied |
| **Tax Rate Gazette Config** | **DENIED** | **DENIED** | Full Management | Denied |
| **Municipal Zone Management** | **DENIED** | **DENIED** | Full Management | Denied |
| **Audit Trail Ledger** | **DENIED** | **DENIED** | Full Management | Denied |
| **Salesforce Gateway Settings** | **DENIED** | **DENIED** | Full Management | Denied |
| **Academic Evidence Center** | **DENIED** | **DENIED** | Full Management | Denied |

---

## 2. Record-Level Ownership Isolation Rules

1. **Citizen Isolation Rule**:
   - `LocalPropertyService.getPropertiesByOwner(userId)` enforces that citizens can only retrieve records where `ownerId === currentUser.id`.
   - Direct URL manipulation (e.g. attempting to open an unowned assessment) is trapped and blocked.
2. **Officer Zone Restriction Rule**:
   - Officers are assigned to specific municipal zones (e.g. `Zone 1 - Central Urban Core`).
   - In operational queues, pending verifications and delinquent accounts default to the officer's assigned zone jurisdiction.
