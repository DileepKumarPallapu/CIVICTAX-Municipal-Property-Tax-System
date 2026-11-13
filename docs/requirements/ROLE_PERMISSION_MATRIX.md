# CIVICTAX Role-Based Access Control (RBAC) & Permission Matrix

## 1. Role Permission Matrix

| Module / Operation | Citizen Persona | Municipal Officer | Municipal Administrator | Public Visitor |
| :--- | :---: | :---: | :---: | :---: |
| **Landing Page & Services** | View | View | View | View |
| **Public Transparency Portal** | View (PII-Safe) | View (PII-Safe) | View (PII-Safe) | View (PII-Safe) |
| **Register Property** | Create (Self) | Create (Assigned) | Create (Any) | Denied |
| **View Properties** | View (Owned) | View (Assigned Zone) | View (All City) | Denied |
| **Approve / Verify Property** | Denied | Execute (Assigned) | Execute (Any) | Denied |
| **View Tax Assessments** | View (Owned) | View (Assigned Zone) | View (All City) | Denied |
| **Generate Annual Assessment** | Denied | Create (Assigned) | Create (Any) | Denied |
| **Make Simulated Payment** | Execute (Owned) | Denied | Execute (Demo) | Denied |
| **Download Tax Receipt** | View / Print | View / Print | View / Print | Denied |
| **Submit Grievance** | Create (Self) | Create | Create | Denied |
| **Resolve Grievance** | Denied | Execute (Assigned) | Execute (Any) | Denied |
| **Request Reassessment** | Create (Self) | Denied | Create / Review | Denied |
| **Revenue Recovery Triage** | Denied | Execute (Assigned) | Execute (All City) | Denied |
| **Risk & Compliance Audit** | Denied | View / Triage | Full Management | Denied |
| **Municipal GIS Map** | Denied | View / Filter | View / Filter | Denied |
| **Revenue Forecasting Lab** | Denied | Denied | Full Management | Denied |
| **Configure Gazette Rates** | Denied | Denied | Full Management | Denied |
| **Administer Municipal Zones** | Denied | Denied | Full Management | Denied |
| **View Audit Trail Ledger** | Denied | Denied | Full Management | Denied |
| **Salesforce Gateway Settings** | Denied | Denied | Full Management | Denied |
| **Academic Evidence Center** | Denied | Denied | Full Management | Denied |

---

## 2. Enforcement Mechanisms

1. **Frontend Route Guards (`src/routes/ProtectedRoute.tsx`)**:
   - Inspects `user.role` from `AuthContext`.
   - Unauthorized attempts redirect to `/login` or home with notification feedback.
2. **Data Storage Filtering (`src/services/local/*`)**:
   - Citizen queries filter by `ownerId === currentUser.id`. Citizens cannot query properties belonging to other owners.
3. **Salesforce Platform Security**:
   - Enforced by `CivicTax_Officer`, `CivicTax_Admin`, and `CivicTax_Citizen` Permission Sets alongside User-Mode DML and SOQL (`WITH USER_MODE`).
