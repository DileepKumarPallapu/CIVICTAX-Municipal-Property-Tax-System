# CIVICTAX System Architecture

## 1. Executive Architectural Blueprint

CivicTax is an enterprise municipal digital governance and property tax administration platform. It operates under a dual-mode service architecture that cleanly decouples client user interaction from backend and cloud storage systems:

1. **Local Demonstration Mode (`VITE_DATA_PROVIDER=local`)**:
   - Zero-dependency client-side execution designed for rapid evaluations, campus demonstrations, and offline operation.
   - Powered by reactive React Context, in-memory adapters, and typed indexed LocalStorage.
2. **Salesforce Connected Mode (`VITE_DATA_PROVIDER=salesforce`)**:
   - Enterprise cloud tier connecting the React frontend through an Express Gateway (`port 3001`) to Salesforce Trailhead Playground/Enterprise orgs via OAuth 2.0 PKCE.
   - Authoritative business logic, financial ledger calculations, validation rules, database triggers, and reports execute natively in Salesforce.

```mermaid
flowchart TD
    subgraph ClientTier["Client Experience Tier (Port 5173 / Vercel SPA)"]
        UI_Citizen["Citizen Portal\n(Registration, Assessments, Payments, Grievances)"]
        UI_Officer["Municipal Officer Portal\n(Verifications, Inspections, Arrears Recovery)"]
        UI_Admin["Municipal Command Center\n(Analytics, GIS, Rates, Forecasting, Compliance)"]
        UI_Academic["Academic Evidence Center\n(Milestone 1 & 2 Traceability Matrix)"]
        UI_Public["Public Transparency Portal\n(PII-Safe Open Data)"]
    end

    subgraph ServiceBridge["Service Abstraction Layer (ServiceFactory)"]
        Switch{"Data Provider Switch\n(VITE_DATA_PROVIDER)"}
        LocalAdapter["LocalDemoAdapter\n(LocalStorage + Seed Fallback)"]
        SFAdapter["SalesforceServiceAdapter\n(Express Proxy Client)"]
    end

    subgraph GatewayTier["Express Gateway Tier (Port 3001)"]
        OAuthPKCE["OAuth 2.0 PKCE Handler\n(/auth/salesforce)"]
        SessionStore["HttpOnly Session Cookie Store\n(civictax.sid)"]
        ApexProxy["Apex REST Reverse Proxy\n(/api/salesforce/proxy/*)"]
    end

    subgraph SalesforcePlatform["Salesforce Multi-Tenant Platform (v60.0)"]
        CustomObjects["Authoritative Custom Objects\n(Property__c, Tax_Assessment__c, Tax_Payment__c)"]
        ApexServices["Authoritative Apex Services\n(PropertyService, TaxCalculationService, PaymentService)"]
        Triggers["Single-Trigger Handlers\n(PropertyTrigger, TaxPaymentTrigger)"]
        AsyncApex["Queueable & Batchable Jobs\n(CivicTaxAsyncJobs)"]
        LWC["Native Lightning Web Components\n(civicTaxDashboard)"]
    end

    ClientTier --> Switch
    Switch -->|local| LocalAdapter
    Switch -->|salesforce| SFAdapter
    SFAdapter --> GatewayTier
    GatewayTier --> SalesforcePlatform
```

---

## 2. Core Architectural Pillars

### A. Separation of Concerns & Clean Architecture
- **Presentation Layer**: React 19, TypeScript 5.9, Tailwind CSS. Pure UI views consume standardized interfaces from `src/services/interfaces/index.ts`.
- **Service Factory**: `ServiceFactory.ts` provides dependency injection. UI views never make direct HTTP calls or raw localStorage queries.
- **Backend Security Boundary**: No Salesforce tokens or client secrets are accessible in the browser. All token storage and exchanges occur server-side.

### B. Scalability & Resilience
- **Offline Readiness**: Operates reliably in offline classrooms via the LocalDemoAdapter.
- **High-Volume Asynchronous Processing**: Large-scale annual tax assessments and overdue accounts are delegated to Batchable and Schedulable Apex, avoiding Salesforce governor limit exhaustion.
- **Micro-State Reactivity**: Local state changes propagate seamlessly via specialized React contexts (`AuthContext`, `ThemeContext`, `LocalizationContext`).

### C. PWA & Mobile Adaptation
- Responsive grid and flexbox layout across mobile (320px+), tablet, and desktop (1920px+).
- Touch-friendly tap targets ($\ge 44\text{px}$) and reduced-motion compliance.
