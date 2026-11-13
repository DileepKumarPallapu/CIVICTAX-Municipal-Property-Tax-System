# CIVICTAX Project Directory Structure & Codebase Inventory

## 1. Complete Repository Tree (Top-Level & Major Subdirectories)

```
civictax/
├── .env.example                               # Frontend environment template
├── .oxlintrc.json                             # Linter configuration
├── index.html                                 # Single Page Application HTML entrypoint
├── package.json                               # Frontend dependencies and npm scripts
├── postcss.config.js                          # PostCSS Tailwind plugins
├── tailwind.config.js                         # Design system theme extensions & colors
├── tsconfig.json                              # TypeScript root project references
├── tsconfig.app.json                          # Vite application TypeScript config
├── tsconfig.node.json                         # Node build scripts TypeScript config
├── vercel.json                                # Vercel SPA rewrites and security headers
├── vite.config.ts                             # Vite Rollup build settings
├── docs/                                      # Master documentation directory
│   ├── architecture/                          # Comprehensive architectural blueprints
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   ├── FRONTEND_ARCHITECTURE.md
│   │   ├── BACKEND_ARCHITECTURE.md
│   │   ├── SALESFORCE_ARCHITECTURE.md
│   │   ├── DATABASE_ARCHITECTURE.md
│   │   ├── API_ARCHITECTURE.md
│   │   ├── SECURITY_ARCHITECTURE.md
│   │   ├── DEPLOYMENT_ARCHITECTURE.md
│   │   ├── MODULE_ARCHITECTURE.md
│   │   ├── WORKFLOW_ARCHITECTURE.md
│   │   ├── INTEGRATION_ARCHITECTURE.md
│   │   ├── PROJECT_DIRECTORY_STRUCTURE.md
│   │   ├── SALESFORCE_MILESTONE_MAPPING.md
│   │   └── ARCHITECTURE_DECISIONS.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── PROJECT_DEMONSTRATION.md
│   └── SECURITY_REVIEW.md
├── salesforce/                                # Salesforce DX Project (v60.0)
│   ├── sfdx-project.json
│   └── force-app/main/default/
│       ├── classes/                           # Apex services, controllers, async jobs, tests
│       ├── triggers/                          # Single-trigger per object implementations
│       ├── objects/                           # Custom objects, fields, and validation rules
│       ├── permissionsets/                    # Role-based permission sets (FLS)
│       └── lwc/                               # Lightning Web Components
├── server/                                    # Express OAuth 2.0 PKCE Gateway
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
└── src/                                       # React 19 Frontend Application
    ├── components/                            # Common UI, headers, sidebars, modals
    ├── context/                               # Auth, Theme, and Localization contexts
    ├── data/                                  # Seed databases and demonstration accounts
    ├── features/                              # GIS, Recovery, Compliance, Forecasting, Evidence
    ├── layouts/                               # Public and Dashboard layout wrappers
    ├── pages/                                 # Citizen, Officer, Admin, and Public pages
    ├── routes/                                # AppRoutes and ProtectedRoute guards
    ├── services/                              # ServiceFactory, adapters, and API clients
    ├── types/                                 # Domain models and TypeScript contracts
    └── __tests__/                             # 20 automated Vitest unit and integration tests
```

---

## 2. Codebase Inventory & File Categorization

| Category | Count | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Active Frontend Source Files (`src/`)** | 68 files | **Active & Verified** | All pages, features, and components compile cleanly with zero errors. |
| **Salesforce DX Metadata Files (`salesforce/`)** | 38 files | **Active & Ready** | Formatted for Salesforce CLI deployment to `CivicTaxPlayground`. |
| **Backend Gateway Source Files (`server/`)** | 8 files | **Active & Verified** | TypeScript Express gateway handling PKCE and proxying. |
| **Test Suites (`src/__tests__/`)** | 5 files | **100% Passing** | 20 unit and integration tests verifying business logic. |
| **Duplicate / Obsolete Files** | 0 files | **Clean** | All legacy workflows migrated to current modules. |
