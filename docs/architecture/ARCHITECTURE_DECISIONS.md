# CIVICTAX Architecture Decision Records (ADRs)

## ADR-001: Dual-Mode Architecture (Local vs. Salesforce Connected)
- **Status**: Accepted
- **Context**: The application must support academic demonstrations and offline campus reviews without requiring constant internet access or live Salesforce licenses for evaluators, while simultaneously providing real enterprise cloud connectivity.
- **Decision**: Introduce a `ServiceFactory` pattern with a configuration switch (`VITE_DATA_PROVIDER=local|salesforce`). UI components consume generic TypeScript interfaces, completely decoupling presentation logic from the underlying storage mechanism.
- **Consequences**: Zero UI refactoring required when switching between local offline persistence and live Salesforce API execution.

---

## ADR-002: Backend Gateway with OAuth 2.0 PKCE & Zero Token Leakage
- **Status**: Accepted
- **Context**: Directly storing Salesforce consumer secrets, access tokens, or refresh tokens in the React client or browser LocalStorage exposes credentials to extraction via malicious browser extensions or XSS.
- **Decision**: Implement a dedicated Express Gateway on port 3001 that initiates OAuth 2.0 Authorization Code Flow with PKCE. Tokens are held exclusively in server-side session memory. The client receives only an `HttpOnly`, `SameSite=Lax` encrypted cookie (`civictax.sid`).
- **Consequences**: Complete elimination of token leakage to the client; enhanced security posture conforming to enterprise standards.

---

## ADR-003: Authoritative Financial Calculations in Apex
- **Status**: Accepted
- **Context**: Property tax calculation involves legal gazette rates, penalties, and early-bird rebates. Trusting calculations performed in client-side JavaScript risks financial tampering.
- **Decision**: All financial assessments and payment balance rollups execute strictly in Apex (`TaxCalculationService.cls` and `PaymentService.cls`) using the `Decimal` primitive type with exact precision (`precision 14, scale 2`) and pessimistic database row locking (`FOR UPDATE`).
- **Consequences**: Guarantees legal mathematical accuracy and prevents floating-point rounding errors.

---

## ADR-004: In-Memory Translation Dictionaries for Localization
- **Status**: Accepted
- **Context**: The platform requires bilingual support (English and Tamil) that works instantly without network latency or external translation API costs.
- **Decision**: Implement a type-safe `LocalizationContext` backed by structured in-memory dictionaries (`TRANSLATIONS.en`, `TRANSLATIONS.ta`) and persistent localStorage preference.
- **Consequences**: Instantaneous language switching with zero runtime latency and full offline readiness.
