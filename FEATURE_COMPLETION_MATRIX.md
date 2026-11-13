# CIVICTAX 6.0 — Feature Completion Matrix & Traceability

| Module | Feature Name | Permitted Roles | Expected Behavior | Implementation File | Verification Test | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Auth** | Multi-Role Login | All | Authenticate citizen, officer, or admin | `src/pages/public/LoginPage.tsx` | Vitest / Manual | ✅ Verified |
| **Auth** | Route Guards | All | Restrict portals based on user role | `src/routes/ProtectedRoute.tsx` | Manual / Route | ✅ Verified |
| **Citizen** | Property Registration | Citizen | Register parcel with deed validation | `src/pages/citizen/RegisterPropertyPage.tsx` | Vitest / E2E | ✅ Verified |
| **Citizen** | My Properties | Citizen | View owned holdings with verification status | `src/pages/citizen/MyPropertiesPage.tsx` | Vitest / E2E | ✅ Verified |
| **Citizen** | Tax Assessments | Citizen | View year-wise tax bills and balance dues | `src/pages/citizen/CitizenAssessmentsPage.tsx`| Vitest / E2E | ✅ Verified |
| **Citizen** | Payment Portal | Citizen | Process full/partial simulated payment | `src/pages/citizen/CitizenPaymentPortalPage.tsx`| Vitest / E2E | ✅ Verified |
| **Citizen** | Receipt Viewer | Citizen | View and print official municipal receipt | `src/components/common/ReceiptViewer.tsx` | Vitest / Manual | ✅ Verified |
| **Citizen** | Grievance Filing | Citizen | Lodge complaint with 5-stage tracking | `src/pages/citizen/CitizenGrievancesPage.tsx` | Vitest / E2E | ✅ Verified |
| **Citizen** | Reassessment Request | Citizen | Dispute tax calculation with claimed area | `src/pages/citizen/CitizenReassessmentsPage.tsx`| Vitest / E2E | ✅ Verified |
| **Officer** | Assigned Properties | Officer | View zone queue of registered properties | `src/pages/officer/AssignedPropertiesPage.tsx` | Vitest / E2E | ✅ Verified |
| **Officer** | Property Verification | Officer | Inspect title deed and approve/reject | `src/pages/officer/PropertyVerificationPage.tsx`| Vitest / E2E | ✅ Verified |
| **Officer** | Assessment Generation | Officer | Compute tax bill using gazette rates | `src/pages/officer/OfficerAssessmentsPage.tsx` | Vitest / E2E | ✅ Verified |
| **Officer** | Grievance Triage | Officer | Assign inspector and resolve case | `src/pages/officer/OfficerGrievancesPage.tsx` | Vitest / E2E | ✅ Verified |
| **Officer** | Reassessment Review | Officer | Adjudicate dispute; issue revised bill | `src/pages/officer/OfficerReassessmentsPage.tsx`| Vitest / E2E | ✅ Verified |
| **Admin** | Command Center | Admin | Filter KPIs across year, zone, and category | `src/pages/admin/MunicipalCommandCenter.tsx` | Vitest / E2E | ✅ Verified |
| **Admin** | User Directory | Admin | Manage demo users and officer zones | `src/pages/admin/UserManagementPage.tsx` | Vitest / Manual | ✅ Verified |
| **Admin** | Zone Governance | Admin | Demarcate wards and revenue targets | `src/pages/admin/ZoneManagementPage.tsx` | Vitest / Manual | ✅ Verified |
| **Admin** | Tax Rate Config | Admin | Update gazette rates (`₹/sq ft`) | `src/pages/admin/TaxRateConfigPage.tsx` | Vitest / E2E | ✅ Verified |
| **Admin** | Audit Ledger | Admin | View immutable logs & export sanitized CSV | `src/pages/admin/AuditTrailPage.tsx` | Vitest / E2E | ✅ Verified |
| **Admin** | System Maintenance | Admin | Factory database reset to seed state | `src/pages/admin/SystemSettingsPage.tsx` | Vitest / Manual | ✅ Verified |
| **Global** | Global Search | All | Scoped debounced search across records | `src/components/common/GlobalSearchModal.tsx` | Vitest / E2E | ✅ Verified |
| **Global** | CiviAssist | All | Local rule-based municipal guidance assistant | `src/components/common/CiviAssist.tsx` | Manual / Rule | ✅ Verified |
| **Global** | Faculty Demo Mode | All | Guided 8-step evaluation walkthrough | `src/components/common/FacultyDemoMode.tsx` | Manual / E2E | ✅ Verified |
