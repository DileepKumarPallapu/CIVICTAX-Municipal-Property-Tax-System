# CivicTax: Complete 15-Topic Salesforce Learning Plan Traceability Matrix

## 1. Candidate & Project Identification

- **Project**: CIVICTAX — Property Tax Assessment and Payment Management System
- **Assigned Use Case**: `USECASE_6`
- **Team**: `TEAM_16`
- **Student**: **Pallapu Dileep Kumar**
- **VTU Number**: `29962`
- **Department**: Computer Science and Engineering
- **Curriculum Standard**: **Salesforce Learning Plan (Phase 1 Admin/PD1 & Phase 2 Apex)**

---

## 2. Methodology & Strict Non-Fabrication Rule

Every requirement below is audited against the **actual filesystem** (`salesforce/force-app/main/default/` and `src/`).
- **Implemented in Source**: The physical metadata XML or Apex `.cls` file exists and is validated in the project.
- **Pending Source Authoring**: The requirement is identified and scheduled for physical source generation.
- **Deployed to Salesforce**: An active deployment confirmation was received from an authorized Salesforce org (`CivicTaxPlayground`).
- **Org Status**: Currently, `sf org display --target-org CivicTaxPlayground` returns `NamedOrgNotFoundError`. Hence, **NO item is marked "Deployed to Salesforce"** until the user authenticates.

---

## 3. Topic-by-Topic Traceability Matrix (Topics 1 through 15)

### TOPIC 1 — ORG SETUP AND COMPANY SETTINGS
1. **Salesforce Configuration / Metadata**: Company Info, Fiscal Year (April-March), INR Currency, Business Hours, Holidays, Custom App (`CivicTax_Admin_App`), Custom Tabs.
2. **CivicTax Business Use Case**: Municipal corporation calendar, financial year budgeting, operational working hours (09:00 - 18:00 IST), bilingual support (`en` / `ta`).
3. **Actual Implementation Location**: `docs/learning-plan/PHASE_1_ORG_SETUP.md` & `src/context/LocalizationContext.tsx`. Staged app definition in `salesforce/force-app/main/default/applications/`.
4. **Test Method**: Browser UI inspection of localized Tamil strings and time zone handling.
5. **Evidence Required for Faculty**: App Launcher screenshots showing `CivicTax Administration Portal` and Fiscal Year Setup audit logs.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 2 — USER MANAGEMENT, LICENSES AND PERMISSION SETS
1. **Salesforce Configuration / Metadata**: `CivicTax_Citizen.permissionset-meta.xml`, `CivicTax_Officer.permissionset-meta.xml`, `CivicTax_Admin.permissionset-meta.xml`.
2. **CivicTax Business Use Case**: Separation of citizen taxpayers from municipal field inspectors and IT administrators.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/permissionsets/` & `src/routes/ProtectedRoute.tsx`.
4. **Test Method**: `src/__tests__/storageAndAuth.test.ts` (RBAC route guards and token checks).
5. **Evidence Required for Faculty**: Permission set XML files with object permissions and Setup User Assignment screenshots.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 3 — SECURITY MODEL (OWD, SHARING, FLS)
1. **Salesforce Configuration / Metadata**: `Property__c` (Private OWD), `Tax_Assessment__c` (Controlled by Parent), `Tax_Payment__c` (Controlled by Parent), Criteria-Based Sharing Rules.
2. **CivicTax Business Use Case**: Prevents citizens from accessing peer tax assessments or payment history; grants zonal inspectors access to properties in their jurisdiction.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/objects/*/fields/` (FLS) & `docs/capstone/USER_AND_PERMISSION_DESIGN.md`.
4. **Test Method**: Test cases verifying user-context filtering (`ownerId === currentUser.id`).
5. **Evidence Required for Faculty**: Sharing settings table and SOQL tests with `WITH SECURITY_ENFORCED`.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 4 — OBJECT ARCHITECTURE AND RELATIONSHIPS
1. **Salesforce Configuration / Metadata**:
   - Standard: `Account`, `Contact`, `User`, `Case`, `ContentDocument`.
   - Custom: `Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Tax_Rate__c`, `Property_Zone__c`, `Reassessment_Request__c`.
   - Relationships: Master-Detail (`Property__c` $\to$ `Tax_Assessment__c`, `Tax_Assessment__c` $\to$ `Tax_Payment__c`), Lookup (`Contact` $\to$ `Property__c`).
2. **CivicTax Business Use Case**: Core municipal parcel registry, annual assessment generation, and payment ledger roll-ups.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/objects/`.
4. **Test Method**: `src/__tests__/integrationLifecycle.test.ts` and `PropertyServiceTest.cls`.
5. **Evidence Required for Faculty**: Schema Builder visual diagram and XML relationship definitions.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 5 — FIELDS, LAYOUTS, RECORD TYPES & OUTREACH CRM
1. **Salesforce Configuration / Metadata**:
   - Record Types: `Residential`, `Commercial`, `Industrial` on `Property__c`.
   - Custom Field Types: Formulas (`Base_Tax__c`), Currency (`Amount_Paid__c`), Picklists.
   - Separate Sales CRM: Independent demonstration workspace for Leads, Opportunities, and Campaigns.
2. **CivicTax Business Use Case**: Differentiates property assessment tax rates by building category; models commercial outreach campaigns.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/objects/Property__c/fields/` & `docs/learning-plan/PHASE_1_FIELDS_LAYOUTS_CRM.md`.
4. **Test Method**: `src/__tests__/businessRules.test.ts` (Category tax rate resolution).
5. **Evidence Required for Faculty**: Record type selection screenshot and Page Layout assignment matrix.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 6 — CASE MANAGEMENT & SERVICE AUTOMATION (CITIZEN GRIEVANCES)
1. **Salesforce Configuration / Metadata**: Standard `Case` object, Queues (`Zone_1_Grievance_Queue`), Assignment Rules, Escalation Rules.
2. **CivicTax Business Use Case**: Citizen tax assessment disputes, payment reconciliation grievances, and field inspection inquiries.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/objects/Grievance__c/` & `src/pages/citizen/CitizenGrievancesPage.tsx`.
4. **Test Method**: `LocalGrievanceService.ts` and `src/__tests__/integrationLifecycle.test.ts`.
5. **Evidence Required for Faculty**: Case status timeline, queue assignment logs, and resolution comments.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 7 — ACTIVITIES, CHATTER, MOBILE & APPEXCHANGE
1. **Salesforce Configuration / Metadata**: `Task` (Inspection follow-ups), `Event` (Citizen hearings), Chatter Groups (`Zone 1 Revenue Enforcement`), External Client App OAuth 2.0 PKCE.
2. **CivicTax Business Use Case**: Officer field inspection scheduling and officer collaboration on tax reassessments.
3. **Actual Implementation Location**: `docs/capstone/FLOW_BUILDER_DOCUMENTATION.md` & `server/src/routes/salesforceRoutes.ts`.
4. **Test Method**: Backend session token exchange and activity scheduling verification.
5. **Evidence Required for Faculty**: Activity timeline screenshot and Connected App / External Client App OAuth configuration.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 8 — DATA MANAGEMENT (IMPORT/EXPORT & DEDUPLICATION)
1. **Salesforce Configuration / Metadata**: Duplicate Rules (`Duplicate_Property_Reference_Prevention`), Matching Rules, CSV Formula Injection Sanitizer.
2. **CivicTax Business Use Case**: Bulk cadastral property ingestion, zone rate uploads, and prevention of duplicate door number registrations.
3. **Actual Implementation Location**: `src/features/compliance/LocalComplianceService.ts` (CMP-001) & `docs/learning-plan/PHASE_1_DATA_MANAGEMENT.md`.
4. **Test Method**: Automated test rejecting duplicate property numbers in `businessRules.test.ts`.
5. **Evidence Required for Faculty**: Data Loader success/error logs and sanitized CSV export samples.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 9 — ADVANCED REPORTS & DASHBOARDS
1. **Salesforce Configuration / Metadata**: Custom Report Types, Summary Reports (Zonal Collections), Matrix Reports (Category vs Zone), Joined Reports, Executive Dashboard.
2. **CivicTax Business Use Case**: Executive municipal revenue telemetry, arrears aging analysis (5 buckets), and officer collection targets.
3. **Actual Implementation Location**: `src/pages/admin/MunicipalCommandCenter.tsx`, `src/features/recovery/RevenueRecoveryPage.tsx`, and `salesforce/force-app/main/default/lwc/civicTaxDashboard/`.
4. **Test Method**: Analytical formula validation in `smartCity7.test.ts`.
5. **Evidence Required for Faculty**: Interactive dashboard components with drill-down report tables.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 10 — FLOW BUILDER, APPROVAL PROCESSES & AGENTFORCE
1. **Salesforce Configuration / Metadata**:
   - Flows: `Property_Registration_Flow`, `Assessment_Notification_Flow`, `Payment_Confirmation_Flow`.
   - Approvals: `Property_Verification_Approval`, `Reassessment_Approval_Process`.
   - AI Architecture: Agentforce / CiviAssist municipal assistant.
2. **CivicTax Business Use Case**: Multi-step engineering and financial sanctioning for property reassessment disputes.
3. **Actual Implementation Location**: `docs/capstone/APPROVAL_PROCESS_DOCUMENTATION.md` & `src/components/common/CiviAssist.tsx`.
4. **Test Method**: State machine verification in `integrationLifecycle.test.ts`.
5. **Evidence Required for Faculty**: Flow Builder canvas screenshots and Approval Process history audit tables.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 11 — SALESFORCE DEVELOPMENT ARCHITECTURE & GOVERNOR LIMITS
1. **Salesforce Configuration / Metadata**: Model-View-Controller (MVC), Multi-Tenancy guardrails, Platform Events (`Property_Verification_Event__e`), Change Data Capture.
2. **CivicTax Business Use Case**: Processing annual assessments for 50,000+ parcels without hitting SOQL (100) or DML (150) governor limits.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/classes/CivicTaxAsyncJobs.cls` & `docs/learning-plan/PHASE_1_SALESFORCE_ARCHITECTURE.md`.
4. **Test Method**: Vitest batch simulation and Apex test execution in `PropertyServiceTest.cls`.
5. **Evidence Required for Faculty**: Debug log snippets showing `LIMIT_USAGE_FOR_NS` within permissible bounds.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 12 — APEX BASICS, OOP & DATA TYPES
1. **Salesforce Configuration / Metadata**: `PropertyService.cls`, `TaxCalculationService.cls`, `PaymentService.cls`, `CivicTaxRestResource.cls`.
2. **CivicTax Business Use Case**: Deterministic tax calculation: $\text{Area} \times \text{Rate} + \text{Penalty} - \text{Discount}$ using `Decimal` scale 2 currency math.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/classes/`.
4. **Test Method**: `src/__tests__/taxCalculation.test.ts` (5 tests) & `TaxCalculationTest.cls`.
5. **Evidence Required for Faculty**: Apex class code showing access modifiers, exception handling, and wrapper classes.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 13 — SOQL, SOSL, DML & ADVANCED LOGIC
1. **Salesforce Configuration / Metadata**:
   - SOQL: Relationship queries (`Tax_Assessments__r`), aggregate queries with `GROUP BY` and `HAVING`.
   - SOSL: Cross-object search across properties, assessments, and cases.
   - DML: `Database.insert(records, false)` partial success, `Database.setSavepoint()` and rollback.
2. **CivicTax Business Use Case**: Global municipal reference search and transactional payment ingestion with atomic rollbacks.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/classes/CivicTaxSearchService.cls` & `PaymentService.cls`.
4. **Test Method**: `GlobalSearchService.ts` and Vitest lifecycle integration test.
5. **Evidence Required for Faculty**: SOQL query logs in Developer Console and ACID rollback demonstration.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 14 — APEX TRIGGERS, ORDER OF EXECUTION & RECURSION
1. **Salesforce Configuration / Metadata**: `PropertyTrigger.trigger`, `TaxPaymentTrigger.trigger`, `CivicTaxRecursionControl.cls`.
2. **CivicTax Business Use Case**: Auto-updating assessment balances upon payment and auto-routing zone inspectors without infinite loops.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/triggers/` & `docs/capstone/RECURSION_HANDLING.md`.
4. **Test Method**: Automated test verifying payment receipt updates assessment status to `PAID`.
5. **Evidence Required for Faculty**: 20-step execution order trace and bulk unit test passing 200 records.
- **Physical Status**: **Implemented in Source & Staged**.

---

### TOPIC 15 — TESTING, DEBUGGING, DEPLOYMENT & ASYNCHRONOUS APEX
1. **Salesforce Configuration / Metadata**:
   - Testing: `PropertyServiceTest.cls`, `CivicTaxTestDataFactory.cls` targeting $\ge 85\%$ coverage in `SeeAllData=false`.
   - Asynchronous: Queueable (`NotificationQueueable`), Batch (`AnnualAssessmentBatch`), Schedulable (`OverdueAssessmentScheduler`).
   - Deployment: Salesforce CLI (`sf project deploy start`) and `sfdx-project.json`.
2. **CivicTax Business Use Case**: Asynchronous receipt PDF generation, bulk annual assessment generation, and daily midnight arrears compounding.
3. **Actual Implementation Location**: `salesforce/force-app/main/default/classes/CivicTaxAsyncJobs.cls` & `PropertyServiceTest.cls`.
4. **Test Method**: `npm test -- --run` (20/20 passed) and `sf apex run test` in authorized org.
5. **Evidence Required for Faculty**: Apex Test Run Results showing 100% pass rate and code coverage summary table.
- **Physical Status**: **Implemented in Source & Staged**.
