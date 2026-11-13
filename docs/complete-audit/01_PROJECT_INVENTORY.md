# 01 — CivicTax Complete Project Inventory & Architecture Map

## 1. Executive Summary

This inventory catalogues the complete physical source, configuration, documentation, backend, and Salesforce metadata assets of the **CIVICTAX** Smart Property Tax Assessment and Municipal Governance Platform.

---

## 2. Directory & Component Inventory

### 2.1 Configuration & Tooling
- `package.json`: Main frontend workspace dependencies (`react@^18.2.0`, `react-router-dom@^6.22.3`, `lucide-react@^0.359.0`, `recharts@^2.12.3`, `leaflet@^1.9.4`, `react-leaflet@^4.2.1`, `framer-motion@^11.0.14`, `canvas-confetti@^1.9.4`).
- `vite.config.ts`: Vite 8 bundler with React plugin, production chunking, and port 5173.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: Strict TypeScript compiler configuration.
- `tailwind.config.js`: Institutional municipal design tokens (Midnight Navy `#101D32`, Deep Slate `#19283D`, Royal Indigo `#405CF5`, Emerald Teal `#13A58B`, Soft Canvas `#F5F7FB`).
- `.oxlintrc.json`: Oxlint configuration for high-performance static analysis.

### 2.2 Frontend Routes & Presentation (`src/`)
- **Public Website (`src/pages/public/`)**:
  - `LandingPage.tsx` (30.8 KB): Hero banner, feature highlights, municipal statistics ticker, interactive tax estimator widget, faculty demo mode launcher.
  - `AboutPage.tsx`: Municipal governance mission, institutional governance council, compliance standards.
  - `ServicesPage.tsx`: Comprehensive citizen services directory with deep links into citizen portal.
  - `ContactPage.tsx`: Municipal headquarters contact, zonal office telephone directory, grievance helpline, emergency contacts.
  - `LoginPage.tsx`: Role-based authentication gateway (Citizen, Officer, Administrator) with instant demo credentials injection.
  - `DemoRegistrationPage.tsx`: Interactive demo scenario generator for rapid academic evaluation.
- **Citizen Portal (`src/pages/citizen/`)**:
  - `CitizenDashboard.tsx` (19.4 KB): Quick action shortcuts, active property cards, tax dues breakdown, recent payment receipts.
  - `MyPropertiesPage.tsx` (17.4 KB): List of permitted citizen properties, verification badges, property card inspection.
  - `RegisterPropertyPage.tsx` (15.9 KB): Comprehensive property registration wizard with plot dimension validation and deed proof attachment.
  - `CitizenAssessmentsPage.tsx` (15.3 KB): Detailed tax assessment statements, base tax breakdown, early-bird rebates, and overdue penalty math.
  - `CitizenPaymentPortalPage.tsx` (24.9 KB): Full payment & partial payment modes, UPI/Net Banking/Card simulation, instant QR-code receipt generator.
  - `CitizenGrievancesPage.tsx` (17.3 KB): Grievance filing, category routing, priority tagging, status timeline, and reopening workflow.
  - `CitizenReassessmentsPage.tsx` (17.8 KB): Reassessment request wizard with area/classification comparison and architectural deed attachment.
  - `CitizenNotificationsPage.tsx` (4.4 KB): Real-time citizen alert center with unread counters and notification dismiss.
  - `CitizenProfilePage.tsx` (5.7 KB): Citizen identity, registered phone/email, household account mapping, and security settings.
- **Municipal Officer Portal (`src/pages/officer/`)**:
  - `OfficerDashboard.tsx` (17.9 KB): Daily inspection queue, pending verifications, assigned recovery tasks, grievance resolution SLA meters.
  - `AssignedPropertiesPage.tsx` (11.8 KB): Zonal property inventory filtered by officer jurisdiction.
  - `PropertyVerificationPage.tsx` (11.6 KB): Field survey inspection tool, document preview, approve/reject decisions with mandatory inspector notes.
  - `OfficerAssessmentsPage.tsx` (16.0 KB): Assessment statement review, manual assessment generation for verified properties.
  - `OfficerReassessmentsPage.tsx` (10.0 KB): Reassessment application adjudication, site survey comparison, sanction/rejection.
  - `OfficerGrievancesPage.tsx` (12.1 KB): Zonal grievance docket, inquiry logging, citizen notification dispatch, resolution closure.
  - `OfficerPaymentsPage.tsx` (6.7 KB): Zonal payment collection ledger, daily reconciliation reports.
  - `OfficerZoneAnalyticsPage.tsx` (5.1 KB): Micro-level ward and zone collection metrics.
  - `OfficerProfilePage.tsx` (5.8 KB): Municipal officer credentials, jurisdictional zone assignments, employee ID.
- **Administrator Portal (`src/pages/admin/`)**:
  - `AdminDashboard.tsx` (12.8 KB): Macro executive metrics, total registrations, net assessed revenue, collection efficiency.
  - `MunicipalCommandCenter.tsx` (11.3 KB): Live municipal telemetry, zonal collection gauges, officer productivity scores.
  - `UserManagementPage.tsx` (13.5 KB): System user CRUD, role assignments (`CITIZEN`, `OFFICER`, `ADMIN`), account status toggling.
  - `PropertyManagementPage.tsx` (9.5 KB): Master property database, zonal search, status overrides, audit log inspection.
  - `ZoneManagementPage.tsx` (11.5 KB): Municipal zone & ward configuration, geographical bounds, contact info.
  - `TaxRateConfigPage.tsx` (14.3 KB): Tax rate matrix by category (Residential, Commercial, Industrial), effective date intervals, overlap protection.
  - `AdminAssessmentsPage.tsx` (11.9 KB): City-wide assessment oversight, bulk assessment generator.
  - `AdminPaymentsPage.tsx` (8.0 KB): Master payment transaction ledger, gateway reconciliation status.
  - `AdminGrievancesPage.tsx` (10.8 KB): City-wide grievance escalation monitor, SLA breach alerts.
  - `AdminAnalyticsPage.tsx` (8.5 KB): Historical revenue graphs, collection trends, property category distribution.
  - `AdminReportsPage.tsx` (23.6 KB): Exportable municipal reports (Collections, Arrears, Verifications, Grievances) with CSV export.
  - `AuditTrailPage.tsx` (8.0 KB): Immutable system event log, user actions, financial transaction modifications.
  - `SystemSettingsPage.tsx` (19.2 KB): System mode toggles (Local vs Salesforce), data seeding controls, database backup/restore.
- **Smart City Features (`src/features/`)**:
  - `gis/MunicipalGISPage.tsx` (11.5 KB): Leaflet spatial parcel visualization, category & zone filters, synthetic marker disclosures.
  - `recovery/RevenueRecoveryPage.tsx` (10.4 KB): Arrears aging analysis (5 buckets), recovery case management, demand notice generation.
  - `compliance/ComplianceCenterPage.tsx` (8.4 KB): Explainable rule-based audit scanner (CMP-001 - CMP-008) with resolution justification logs.
  - `forecasting/RevenueForecastingPage.tsx` (6.5 KB): Statistical revenue forecasting (SMA, WMA, Linear Trend) over verified payment records.
  - `transparency/PublicTransparencyPage.tsx` (7.2 KB): Public open-data dashboard with zero-PII aggregation.
  - `salesforce/SalesforceSettingsPage.tsx` (11.5 KB): External Client App PKCE configuration, connection health checks, data sync preview.
  - `evidence/AcademicEvidenceCenter.tsx` (8.2 KB): Milestone 1 & 2 requirement traceability matrix, architectural evidence catalog.

### 2.3 Shared UI Components (`src/components/common/`)
- `AppHeader.tsx`: Responsive navigation bar, language switcher (`EN` / `TA`), theme switcher (Light / Dark), global search launcher, user profile pill.
- `AppSidebar.tsx`: Role-aware persistent sidebar navigation with active route highlights, badges, and collapsible drawer support.
- `CiviAssist.tsx` (12.7 KB): Intelligent municipal assistant widget with context-aware quick questions, navigation shortcuts, and tax calculation assistance.
- `FacultyDemoMode.tsx` (10.8 KB): Guided 12-stage interactive walkthrough for academic evaluators with auto-fill scenarios and progress tracking.
- `GlobalSearchModal.tsx` (5.7 KB): Universal modal search across properties, assessments, grievances, and pages with keyboard shortcut (`Ctrl+K`).
- `ReceiptViewer.tsx` (12.0 KB): High-fidelity official municipal payment receipt with printable layout, SVG corporation seal, and verification QR code.
- `DataTable.tsx` (7.8 KB): Reusable data table with multi-column sorting, pagination, search filter, and responsive row actions.
- `StatCard.tsx`, `StatusBadge.tsx`, `LoadingSpinner.tsx`, `EmptyState.tsx`, `ConfirmDialog.tsx`, `WorkflowTimeline.tsx`.

### 2.4 State & Service Architecture (`src/services/` & `src/context/`)
- `AuthContext.tsx`, `ThemeContext.tsx`, `LocalizationContext.tsx`, `ToastContext.tsx`, `NotificationContext.tsx`.
- `StorageService.ts`: Local persistence engine with schema versioning, seed data initializer, and atomic storage operations.
- `BusinessRules.ts`: Deterministic business logic rules and financial validators.
- `ServiceFactory.ts`: Factory routing requests to `Local*Service` or `SalesforceServiceAdapter` based on system configuration.
- `LocalPropertyService.ts`, `LocalAssessmentService.ts`, `LocalPaymentService.ts`, `LocalGrievanceService.ts`, `LocalReassessmentService.ts`, `LocalTaxRateService.ts`, `LocalZoneService.ts`, `LocalUserService.ts`, `LocalDashboardService.ts`.

### 2.5 Backend Gateway (`server/`)
- `server.ts`: Express TypeScript HTTP server running on port 3001 with Helmet, CORS whitelist, Cookie-Parser, and Session management.
- `routes/authRoutes.ts`: Secure local authentication endpoints with password hashing and session cookies.
- `routes/salesforceRoutes.ts`: OAuth 2.0 PKCE handshake, token exchange, and connection health status.
- `modules/municipalRoutes.ts`: RESTful endpoints for properties, assessments, payments, grievances, and dashboard aggregates.
- `repositories/LocalRepository.ts` & `repositories/ICivicTaxRepository.ts`: Abstracted repository pattern decoupling storage from API controllers.

### 2.6 Salesforce Platform Metadata (`salesforce/`)
- DX Project configuration (`sfdx-project.json`) targeting API v60.0.
- Custom Objects: `Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Tax_Rate__c`, `Property_Zone__c`, `Grievance__c`, etc.
- Apex Service Classes: `PropertyService.cls`, `TaxCalculationService.cls`, `PaymentService.cls`, `CivicTaxSearchService.cls`, `CivicTaxAsyncJobs.cls`.
- REST Resource: `CivicTaxRestResource.cls` (`/services/apexrest/civictax/v1/*`).
- Triggers: `PropertyTrigger.trigger`, `TaxPaymentTrigger.trigger`.
- Permission Sets: `CivicTax_Officer`, `CivicTax_Citizen`, `CivicTax_Admin`.
- Lightning Web Components: `civicTaxDashboard` for native Salesforce Lightning Experience.
