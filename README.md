# CIVICTAX — Smart Property Tax Assessment and Municipal Governance Platform

![CivicTax 10.0](https://img.shields.io/badge/CivicTax-10.0%20Final%20Release-blue)
![Build Status](https://img.shields.io/badge/Build-Passing%20(1.54s)-success)
![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passed-emerald)
![Salesforce](https://img.shields.io/badge/Salesforce-DX%20v60.0%20Ready-indigo)
![Deployment](https://img.shields.io/badge/Vercel-Production%20Ready-black)

> "Smarter Property Management. Transparent Taxation. Better Cities."

CivicTax is an enterprise-grade digital governance and municipal property tax administration platform designed to modernize property registration, tax assessment, revenue recovery, risk compliance, and citizen engagement.

Built as a comprehensive academic milestone project, CivicTax features a modern React 19 frontend coupled with an authoritative Salesforce multi-tenant cloud backend and dual-mode execution (offline demonstration mode and live Salesforce connected mode).

---

## 🌟 Key Platform Capabilities

1. **Multi-Role Municipal Portals**:
   - **Citizen Portal**: Register properties, view annual tax assessments, simulate full/partial payments, download official receipts, submit grievances, and track reassessments.
   - **Officer Portal**: Verify property submissions, conduct digital deed audits, schedule site visits, manage overdue accounts, and triage citizen grievances.
   - **Administrator Command Center**: Real-time municipal revenue oversight, collection efficiency analytics, municipal zone administration, and tax gazette rate configuration.
2. **Municipal Geospatial (GIS) Intelligence**:
   - Interactive spatial map powered by Leaflet displaying parcel boundaries, zoning classifications (Residential, Commercial, Industrial), and verification statuses.
3. **Revenue Recovery & Aging Center**:
   - Automated 4-tier delinquent tax aging analysis (`1-30`, `31-60`, `61-90`, and `> 90` days) with demand notice workflows and CSV exports for field revenue teams.
4. **Data Integrity & Risk Compliance Center**:
   - Explainable rule-based audit engine detecting deed reference lapses (`RULE_PROP_DEED_CHECK`), rate arithmetic deviations (`RULE_BASE_TAX_CONSISTENCY`), and payment-to-assessment mismatches.
5. **Statistical Revenue Forecasting Lab**:
   - Mathematical revenue projection models (Weighted Moving Average, Simple Moving Average, Linear Trend) with $\pm 12\%$ confidence bounds and transparent assumptions.
6. **Citizen Public Transparency Portal**:
   - Public open data dashboard publishing city-wide collections, zone efficiency ratios, and category breakdowns with zero Personal Identifiable Information (PII) exposure.
7. **Bilingual Localization (English & தமிழ்)**:
   - Instantaneous in-app language switching between English and Tamil across all navigation routes and metrics.
8. **Salesforce Milestone 1 & 2 Academic Evidence Center**:
   - Dedicated requirement traceability matrix linking academic concepts directly to Salesforce DX metadata, Apex classes, triggers, and viva defense guidelines.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### 1. Installation
Clone the repository and install frontend dependencies:
```powershell
cd civictax
npm install
```

### 2. Running in Local Demonstration Mode (Default)
Start the local Vite development server:
```powershell
npm run dev
```
Open your browser to `http://localhost:5173`.

### 3. Pre-Seeded Demonstration Accounts

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civictax.demo` | `demo123` | Properties, Assessments, Payment Portal, Grievances |
| **Officer** | `officer@civictax.demo` | `demo123` | Property Verification, Assessment Review, Arrears Recovery |
| **Administrator** | `admin@civictax.demo` | `demo123` | Command Center, GIS, Forecasting, Compliance, Evidence |

---

## ☁️ Salesforce Integration Architecture

CivicTax features a full Salesforce DX project located in `salesforce/` and an optional Express Gateway in `server/`:

### OAuth 2.0 PKCE Security Protocol
- Tokens (`access_token`, `refresh_token`) and client secrets are **never sent to or stored in React**.
- React communicates with the backend gateway via `HttpOnly`, `SameSite=Lax` cookies (`civictax.sid`).
- Authoritative financial calculations and ledger balances execute strictly in Apex.

### Deploying to Your Salesforce Org
1. Authorize your Playground:
   ```powershell
   sf org login web --browser edge --alias CivicTaxPlayground --instance-url https://login.salesforce.com
   ```
2. Deploy metadata:
   ```powershell
   cd salesforce
   sf project deploy start --target-org CivicTaxPlayground
   ```
3. Start the Express Gateway:
   ```powershell
   cd server
   npm run dev
   ```

---

## 🧪 Testing & Verification

Run the full automated test suite:
```powershell
npm test -- --run
```
All 20 unit and integration tests across 5 test files pass with 100% success rate:
- `src/__tests__/smartCity7.test.ts` (GIS, Recovery aging, Compliance, Privacy)
- `src/__tests__/taxCalculation.test.ts` (Base tax, rates, penalties, rebates)
- `src/__tests__/businessRules.test.ts` (Validations, status flows)
- `src/__tests__/storageAndAuth.test.ts` (Persistence, authentication)
- `src/__tests__/integrationLifecycle.test.ts` (End-to-end municipal lifecycle)

To build the production bundle:
```powershell
npm run build
```

---

## 📚 Complete Project Documentation

Detailed technical and academic guides are available in the [`docs/`](./docs) folder:
- [System Architecture](./docs/SYSTEM_ARCHITECTURE.md)
- [Security Review](./docs/SECURITY_REVIEW.md)
- [Project Demonstration Script](./docs/PROJECT_DEMONSTRATION.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Release Report](./CIVICTAX_RELEASE_REPORT.md)
- [Milestone 1 & 2 Implementation Report](./MILESTONE_1_IMPLEMENTATION_REPORT.md)
- [Salesforce Requirement Traceability Matrix](./REQUIREMENT_TRACEABILITY_MATRIX.md)
- [Faculty Viva Defense Guide](./FACULTY_VIVA_GUIDE.md)

---

## ⚖️ License & Academic Notice
This project is developed for academic evaluation, municipal property taxation modeling, and enterprise Salesforce cloud architecture demonstrations.
