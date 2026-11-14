# CivicTax 3.0 Role & Permission Authorization Matrix

## 1. Enterprise Persona Model

CivicTax defines twelve operational roles mapped to functional municipal departments and authenticated security contexts.

---

## 2. Comprehensive Role-to-Workspace Permissions

| Role ID | Municipal Role Title | Primary Workspace | Permitted Workspaces | Access Tier | Salesforce Profile / Permset |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ROL-01** | System Administrator | Municipal Administration | All Workspaces (Full CRUD) | Super Admin | `CivicTax_Admin` |
| **ROL-02** | Municipal Commissioner | Administration / Command Center | Workspaces A, E, H, J (Read/Audit All) | Executive Read | `CivicTax_Admin` (Exec) |
| **ROL-03** | Zonal Revenue Officer | Zonal Management | Workspaces C, D, E, F, G, H | Zonal Supervisor | `CivicTax_Officer` |
| **ROL-04** | Property Registration Officer| Property Registration | Workspaces B, H | Department Specialist| `CivicTax_Officer` |
| **ROL-05** | Field Verification Inspector | Property Verification | Workspaces B, C (Assigned Zone Only) | Field Officer | `CivicTax_Officer` |
| **ROL-06** | Tax Assessment Officer | Tax Assessment | Workspaces D, H | Valuation Specialist | `CivicTax_Officer` |
| **ROL-07** | Treasury & Revenue Officer | Revenue & Payment | Workspaces E, H, J | Financial Cashier | `CivicTax_Officer` |
| **ROL-08** | Grievance Redressal Officer | Grievance Management | Workspaces F, H | Service Officer | `CivicTax_Officer` |
| **ROL-09** | Reassessment Appeals Officer | Reassessment & Appeals | Workspaces D, G | Appeals Specialist | `CivicTax_Officer` |
| **ROL-10** | Zone Supervisor | Zonal Management | Workspaces C, F, H | Regional Lead | `CivicTax_Officer` |
| **ROL-11** | Municipal Auditor | Audit & Analytics | Workspaces A, E, J (Read-Only) | Compliance Auditor | `CivicTax_Admin` (Read) |
| **ROL-12** | Registered Citizen | Citizen Self-Service | Workspace I (Own Permitted Records Only)| External Citizen | `CivicTax_Citizen` |

---

## 3. Defense-in-Depth Authorization Guardrails

1. **Frontend Route Guards**: `ProtectedRoute.tsx` enforces allowed role arrays per route group.
2. **Data Context Filtering**: Services query records matching `ownerId === currentUser.id` (Citizens) or `zone === currentUser.zone` (Officers).
3. **Backend Middleware**: Express gateway validates signed `HttpOnly` session cookies and rejects unauthorized HTTP verbs.
4. **Salesforce Core OWD**: Private Organization-Wide Defaults guarantee that external community users cannot access records owned by peers.
