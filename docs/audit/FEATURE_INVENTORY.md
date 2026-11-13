# CIVICTAX Feature Inventory & Verification State

This matrix inventories all 28 domain features of CivicTax and classifies their current verification status.

| Feature Identifier | Feature Name | Target Audience | Implementation Level | Verification Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | Landing Page & Brand Identity | Public | React JSX + Tailwind | **Implemented & Verified** | Responsive, dark/light mode, institutional styling |
| **FEAT-02** | Multi-Role Authentication | Citizen, Officer, Admin | React Context | **Implemented & Verified** | Demo persona switching with ProtectedRoute guards |
| **FEAT-03** | Citizen Dashboard | Citizen | React UI | **Implemented & Verified** | Live summary metrics from local storage |
| **FEAT-04** | Property Registration | Citizen | React Form + Validations | **Implemented & Verified** | Positive area, non-future year, deed checks |
| **FEAT-05** | My Properties Management | Citizen | React Table + Cards | **Implemented & Verified** | Filtering by status, category, and zone |
| **FEAT-06** | Tax Assessments Viewer | Citizen | React UI | **Implemented & Verified** | Annual bills, due dates, breakdown formulas |
| **FEAT-07** | Payment Portal Simulation | Citizen | React Modal + State | **Implemented & Verified** | Partial & full payments, pessimistic updates |
| **FEAT-08** | Payment Receipt Generation | Citizen | React Printable Viewer | **Implemented & Verified** | Formatted receipt with official seal & reference |
| **FEAT-09** | Citizen Grievance Submission | Citizen | React Form | **Implemented & Verified** | Ticket numbers, priority setting, history log |
| **FEAT-10** | Reassessment Appeals | Citizen | React Form | **Implemented & Verified** | Dispute grounds, valuation requests |
| **FEAT-11** | Officer Dashboard | Officer | React UI | **Implemented & Verified** | Pending verifications, assigned properties |
| **FEAT-12** | Property Verification Flow | Officer | React Workflow | **Implemented & Verified** | Deed approval, field remarks, status change |
| **FEAT-13** | Assessment Review | Officer | React UI | **Implemented & Verified** | Rate adjustments, bill approvals |
| **FEAT-14** | Grievance Triage | Officer | React UI | **Implemented & Verified** | Status progression (`IN_PROGRESS`, `RESOLVED`) |
| **FEAT-15** | Municipal Command Center | Admin | React Dashboard | **Implemented & Verified** | City-wide collections, zone efficiency ratios |
| **FEAT-16** | Zone Management | Admin | React Table + Form | **Implemented & Verified** | Ward coverage, target revenue configuration |
| **FEAT-17** | Tax Rate Gazette Config | Admin | React UI | **Implemented & Verified** | Category rates (Residential, Commercial, etc.) |
| **FEAT-18** | Municipal GIS Map | Officer, Admin | Leaflet + React-Leaflet | **Implemented & Verified** | Spatial markers, zone overlays, popups |
| **FEAT-19** | Revenue Recovery Center | Officer, Admin | React UI + Local Engine | **Implemented & Verified** | 4-tier aging buckets (`1-30`, `>90` days), CSV export |
| **FEAT-20** | Risk & Compliance Center | Officer, Admin | React UI + Rules Engine | **Implemented & Verified** | Rule-based data checks (`RULE_PROP_DEED_CHECK`) |
| **FEAT-21** | Revenue Forecasting Lab | Admin | Recharts + Math Models | **Implemented & Verified** | WMA, SMA, Linear Trend with $\pm 12\%$ bounds |
| **FEAT-22** | Public Transparency Portal | Public / Citizens | React Open Data UI | **Implemented & Verified** | Zero-PII published metrics verified by unit test |
| **FEAT-23** | Bilingual Localization | All Users | React Context (en / ta) | **Implemented & Verified** | Dynamic in-header toggle between English & Tamil |
| **FEAT-24** | Academic Evidence Center | Faculty, Admin | React Traceability UI | **Implemented & Verified** | Milestone 1 & 2 traceability matrix at `/admin/evidence` |
| **FEAT-25** | CiviAssist Help Assistant | All Users | Floating Dialog | **Implemented & Verified** | Quick actions, FAQs, contextual navigation |
| **FEAT-26** | Audit Trail Ledger | Admin | React Table | **Implemented & Verified** | Immutable chronological logs of all mutations |
| **FEAT-27** | Salesforce Express Gateway | Backend | Node.js + Express | **Implemented & Verified** | OAuth 2.0 PKCE, session cookies, Apex proxy |
| **FEAT-28** | Salesforce DX Platform Deploy | Salesforce | DX Metadata + Apex | **Blocked by Org Login** | CLI installed, DX files ready, login pending |
