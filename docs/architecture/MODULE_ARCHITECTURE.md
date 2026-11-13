# CIVICTAX Module Architecture

## 1. Module Inventory & Functional Directory

The following matrix documents every domain module across CivicTax, detailing target roles, frontend components, backend endpoints, data models, and Salesforce representations.

| Module | Purpose | Target Roles | Key Frontend Components | Backend Endpoints | Salesforce Metadata / Apex |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Dual-mode login & role routing | All Users | `LoginPage`, `DemoRegistrationPage`, `AuthContext` | `/auth/salesforce`, `/auth/salesforce/callback` | Salesforce OAuth 2.0 PKCE, `User` |
| **Citizen Services** | Citizen dashboard, profile, and overview | Citizen | `CitizenDashboard`, `CitizenProfilePage` | `/api/salesforce/proxy/dashboard` | `Contact`, `Account` |
| **Property Management** | Register, view, and inspect parcels | Citizen, Officer, Admin | `RegisterPropertyPage`, `MyPropertiesPage`, `AssignedPropertiesPage` | `/api/salesforce/proxy/properties` | `Property__c`, `PropertyService.cls`, `PropertyTrigger.trigger` |
| **Property Verification** | Municipal deed inspection & approval | Officer, Admin | `PropertyVerificationPage` | `/api/salesforce/proxy/properties/:id` | `Property__c.Verification_Status__c`, `PropertyValidationService` |
| **Tax Assessment** | Annual billing demand calculation | Citizen, Officer, Admin | `CitizenAssessmentsPage`, `OfficerAssessmentsPage` | `/api/salesforce/proxy/assessments` | `Tax_Assessment__c`, `TaxCalculationService.cls` |
| **Payments & Treasury** | Simulated payment & official receipts | Citizen, Officer, Admin | `CitizenPaymentPortalPage`, `AdminPaymentsPage`, `ReceiptModal` | `/api/salesforce/proxy/payments` | `Tax_Payment__c`, `PaymentService.cls`, `TaxPaymentTrigger.trigger` |
| **Grievance Triage** | Citizen complaints & resolutions | Citizen, Officer, Admin | `CitizenGrievancesPage`, `OfficerGrievancesPage` | `/api/salesforce/proxy/grievances` | `Grievance__c`, `Case` |
| **Reassessment Appeals** | Dispute assessment valuations | Citizen, Officer, Admin | `CitizenReassessmentsPage`, `OfficerReassessmentsPage` | `/api/salesforce/proxy/reassessments` | `Reassessment_Request__c`, Approval Processes |
| **Revenue Recovery** | Delinquent arrears aging & notices | Officer, Admin | `RevenueRecoveryPage` | Local / Apex Recovery REST | `Recovery_Case__c`, aging calculation engine |
| **Risk & Compliance** | Rule-based data integrity checks | Officer, Admin | `ComplianceCenterPage` | Local / Apex Compliance REST | `Compliance_Alert__c`, `LocalComplianceService.ts` |
| **Municipal GIS** | Interactive geospatial parcel map | Officer, Admin | `MunicipalGISPage` | `/api/salesforce/proxy/properties` | `Property__c.Latitude__c`, `Longitude__c`, Leaflet map |
| **Revenue Forecasting** | Statistical WMA/SMA revenue projections | Admin | `RevenueForecastingPage` | Local / Analytics Proxy | `LocalForecastingService.ts`, trend algorithms |
| **Public Transparency** | PII-safe open data municipal portal | Public / Citizens | `PublicTransparencyPage` | `/transparency` (Public Open Route) | `LocalTransparencyService.ts` |
| **Bilingual Localization** | Dynamic English $\leftrightarrow$ Tamil language toggle | All Users | `AppHeader`, `LocalizationContext` | Client-Side Context | `TRANSLATIONS.en`, `TRANSLATIONS.ta` |
| **Academic Evidence Center** | Milestone 1 & 2 traceability matrix | Faculty, Admin | `AcademicEvidenceCenter` | Route `/admin/evidence` | `TRACEABILITY_MATRIX`, viva defense cards |
| **Salesforce Gateway** | Connection health & OAuth verification | Admin | `SalesforceSettingsPage` | `/api/salesforce/status`, `/api/salesforce/verify` | `SalesforceClient.ts`, PKCE engine |
