# CIVICTAX 6.0 — Application Security & Safeguards Review

## 1. Security Architecture (Local Demo Context)
CivicTax 6.0 is an academic municipal application running in a client-side environment using browser local persistence. While it does not connect to a remote backend in this phase, it implements enterprise-style safeguards:

---

## 2. Implemented Security Controls

### 1. Role-Based Access Control (RBAC) & Route Protection
- Route guarding is enforced via `ProtectedRoute.tsx`.
- Unauthorized attempts by Citizens to access `/admin` or `/officer` routes redirect immediately to `/citizen`.
- Protected routes require a valid session; unauthenticated requests redirect to `/login`.

### 2. Service-Level Access Control
- In addition to UI routing guards, service classes (`businessRules.ts`, `LocalPropertyService`, `LocalAssessmentService`) enforce role validation so that unauthorized users cannot execute mutations.

### 3. CSV Formula Injection Mitigation
- Exported spreadsheets (`exportToCSV` in `utils/index.ts`) neutralize formulas by sanitizing cell values starting with `= `, `+`, `-`, or `@` with a leading apostrophe (`'`), preventing formula injection in Microsoft Excel and LibreOffice Calc.

### 4. Banking & Credential Protection
- All payment operations are strictly simulated. No actual credit card numbers, CVVs, expiry dates, OTPs, or net banking passwords are ever requested, processed, or stored.

### 5. Input Validation & Escaping
- Forms use Zod validation schemas (`RegisterPropertyPage.tsx`, etc.) to sanitize inputs, enforce numeric limits, and prevent malformed data injection.

---

## 3. Production Roadmap: Salesforce Transition
In Phase 2, when connecting to Salesforce Lightning Platform:
- User authentication transitions to **Salesforce Identity (OAuth 2.0 / OpenID Connect)**.
- Data access security shifts to Salesforce **Profiles, Permission Sets, and Object/Field-Level Security (FLS)**.
- Record visibility across municipal wards will be enforced using **Role Hierarchies and Sharing Rules**.
