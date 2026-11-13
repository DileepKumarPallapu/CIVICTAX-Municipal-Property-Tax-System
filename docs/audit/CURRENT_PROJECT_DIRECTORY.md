# CIVICTAX Current Project Directory & Inventory

## 1. Directory Structure

```
civictax/
├── .env.example
├── .oxlintrc.json
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
├── vite.config.ts
├── docs/
│   ├── architecture/          # 14 Master Architecture Documents (ADRs, ERD, Security, etc.)
│   ├── audit/                 # Baseline audit deliverables (Layer 0 inspection)
│   ├── DEPLOYMENT_GUIDE.md
│   ├── PROJECT_DEMONSTRATION.md
│   └── SECURITY_REVIEW.md
├── salesforce/
│   ├── sfdx-project.json
│   └── force-app/main/default/
│       ├── classes/           # PropertyService, TaxCalculationService, PaymentService, etc.
│       ├── triggers/          # PropertyTrigger, TaxPaymentTrigger
│       ├── objects/           # Property__c, Tax_Assessment__c, Tax_Payment__c, Grievance__c
│       ├── permissionsets/    # CivicTax_Officer, CivicTax_Admin
│       └── lwc/               # civicTaxDashboard
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── server.ts
└── src/
    ├── components/
    │   ├── common/            # AppHeader, AppSidebar, PageHeader, ReceiptViewer, WorkflowTimeline
    │   ├── dashboard/         # Metric cards, charts, activity feeds
    │   ├── forms/
    │   ├── modals/
    │   └── tables/
    ├── context/               # AuthContext, ThemeContext, LocalizationContext
    ├── data/                  # seedData.ts (Demo users, properties, assessments)
    ├── features/
    │   ├── compliance/        # LocalComplianceService, ComplianceCenterPage
    │   ├── evidence/          # AcademicEvidenceCenter, traceabilityData
    │   ├── forecasting/       # LocalForecastingService, RevenueForecastingPage
    │   ├── gis/               # MunicipalGISPage (Leaflet mapping)
    │   ├── recovery/          # LocalRecoveryService, RevenueRecoveryPage
    │   ├── salesforce/        # SalesforceSettingsPage
    │   └── transparency/      # LocalTransparencyService, PublicTransparencyPage
    ├── layouts/               # DashboardLayout, PublicLayout
    ├── pages/
    │   ├── admin/             # 13 Admin Portal pages
    │   ├── citizen/           # 9 Citizen Portal pages
    │   ├── officer/           # 9 Officer Portal pages
    │   └── public/            # 6 Public Landing & Auth pages
    ├── routes/                # AppRoutes, ProtectedRoute
    ├── services/              # ServiceFactory, businessRules, storageService, local adapters
    ├── types/                 # index.ts (Domain models)
    ├── utils/                 # animations.ts, index.ts (currency, dates)
    └── __tests__/             # 5 Vitest test suites (20 tests)
```

---

## 2. Inventory Metrics
- **Total Frontend Pages**: 37 distinct view routes
- **Automated Test Files**: 5 test files (`businessRules`, `smartCity7`, `taxCalculation`, `storageAndAuth`, `integrationLifecycle`)
- **Total Custom Objects Defined in DX**: 4 core custom objects (`Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Grievance__c`) + 5 auxiliary object schemas.
- **Apex Source Files**: 5 Apex Classes + 2 Apex Triggers + 1 Apex Test Class.
