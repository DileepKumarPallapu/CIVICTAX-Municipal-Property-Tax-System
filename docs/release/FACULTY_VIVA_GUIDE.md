# CivicTax Faculty Viva & Academic Defense Guide

## 1. Project High-Level Pitch

**CivicTax** is an enterprise-grade Smart Property Tax Assessment, Municipal Recovery, and Citizen Governance Platform. It addresses systemic municipal tax evasion, billing opacity, and service delays by combining:
1. **Mathematical Billing Precision**: Deterministic tax formulas with automated early-rebate discounts and statutory arrears penalties.
2. **Dual-Tier Data Architecture**: High-speed, zero-dependency local demonstration mode coupled with an enterprise Salesforce REST/Apex integration.
3. **Citizen Empowerment**: Progressive Web App (PWA) with Tamil localization, digital document vault, instant QR-verifiable payment receipts, and CiviAssist AI guidance.
4. **Administrative Telemetry**: GIS parcel intelligence, arrears aging analysis, explainable compliance rules, and statistical revenue forecasting.

---

## 2. Top Anticipated Viva Questions & Defenses

### Q1: Why did you choose a dual-mode data persistence architecture (Local vs Salesforce)?
**Defense**: In municipal software deployments, regional offices often face intermittent network connectivity, and academic evaluators require a frictionless, zero-setup local demonstration without cloud credentials. Our `ICivicTaxRepository` and `ServiceFactory` pattern completely decouples UI presentation from backend storage, allowing instantaneous switching between local SQLite/LocalStorage and enterprise Salesforce Apex REST with zero code rewrites.

### Q2: How do you prevent financial floating-point rounding errors?
**Defense**: JavaScript standard numbers are 64-bit IEEE 754 floating-point values, which can introduce precision artifacts (e.g. $0.1 + 0.2 = 0.30000000000000004$). CivicTax enforces integer-based calculations (working in cents/paise) or strict two-decimal mathematical quantization on the frontend, and binds calculations to Salesforce `Decimal(14, 2)` in Apex, guaranteeing that assessments, receipts, and ledger rollups always reconcile to the exact rupee.

### Q3: How do you safeguard citizen data privacy on the Public Transparency Portal?
**Defense**: The Public Transparency portal follows a strict **Zero-PII invariant**. Data feeds are pre-aggregated at the Municipal Zone and Ward level. Citizen names, contact numbers, email addresses, national IDs, and raw bank transaction IDs are completely stripped before reaching transparency endpoints.

### Q4: How is OAuth 2.0 secured between the React frontend and Salesforce?
**Defense**: CivicTax implements OAuth 2.0 Authorization Code Grant with **Proof Key for Code Exchange (PKCE)**. Crucially, the React frontend **never touches or stores Salesforce access or refresh tokens**. The token exchange occurs strictly server-side on the Express gateway (port 3001), and client sessions are maintained using an `HttpOnly`, `SameSite=Strict`, signed session cookie.
