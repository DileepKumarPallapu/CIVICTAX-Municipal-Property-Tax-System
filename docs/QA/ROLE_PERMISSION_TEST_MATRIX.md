# CivicTax 7.0: Role Permission Test Matrix & Security Audit

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Date**: November 14, 2026 | **Auditor**: Application Security Specialist & Salesforce Architect  

---

## 1. Role-Based Access Control (RBAC) Matrix

CivicTax enforces permissions across 12 distinct roles. Access is enforced at both the client routing boundary (`ProtectedRoute.tsx`) and the server API gateway (`server.ts`):

| Role Identifier | Property Reg | Property Verify | Assess Tax | Collect Payment | Grievance Resolve | Reassessment Approve | System Settings | Audit Logs |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **System Administrator** | Full | Full | Full | Full | Full | Full | Full | Full |
| **Municipal Commissioner** | Read | Read | Final Sign | Read | Oversee | Final Sign | Read | Full |
| **Department Head** | Read | Approve | Approve | Supervise | Supervise | Recommend | Read | Full |
| **Registration Officer** | Intake | Review | Read | — | — | — | — | Read |
| **Verification Officer** | Read | Inspect/Verify| — | — | — | Field Survey | — | Read |
| **Assessment Officer** | Read | Read | Calculate/Draft| — | Read | Review | — | Read |
| **Revenue Officer** | Read | Read | Read | Settle/Reconcile| — | — | — | Read |
| **Grievance Officer** | Read | Read | Read | Read | Investigate/Resolve| — | — | Read |
| **Reassessment Officer** | Read | Read | Review | Read | — | Adjudicate | — | Read |
| **Zone Supervisor** | Read | Reassign | Reassign | Read | Reassign | Review | — | Read |
| **Auditor** | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only |
| **Citizen** | Own Only | — | Own Only | Own Only | Own Only | Own Only | — | — |

*(Legend: Full = Create/Read/Update, Read = Read-Only, — = Access Denied)*

---

## 2. Core Security Boundary Verification Results

### 2.1 Route Guarding & Protected Page Access
- **Test**: Attempting to navigate directly to `/admin/settings` or `/officer/verification` while unauthenticated or logged in as `CITIZEN`.
- **Result**: **PASS**. `ProtectedRoute` intercepts request and automatically redirects to `/login` with an unauthorized alert notice.

### 2.2 Server-Side API Authorization Enforcement
- **Test**: Direct `PATCH /api/properties/:id/verify` or `POST /api/assessments` without administrative/officer context.
- **Result**: **PASS**. Server validates session identity; unauthorized mutations are rejected.

### 2.3 Citizen Data Isolation & PII Protection
- **Test**: Citizen `usr-citizen-01` attempts to query or retrieve assessments/properties belonging to another citizen ID.
- **Result**: **PASS**. Data service filters strictly on authenticated `ownerId`. Citizen cannot enumerate or view other citizens' properties or payment receipts.

### 2.4 Browser Log Sanitization
- **Test**: Full browser DevTools console trace during property registration, tax calculation, and payment transactions.
- **Result**: **PASS**. Zero plaintext passwords, credit card numbers, CVVs, or bearer tokens emitted in `console.log`.

### 2.5 Secret Key & Credential Isolation
- **Test**: Inspection of git repository and frontend client bundle.
- **Result**: **PASS**. `server/.env` contains server-side variables only. No `SF_CLIENT_SECRET` or private keys are bundled into frontend `dist/assets/index-*.js`.

### 2.6 Input Sanitization & Injection Defense
- **Test**: Injecting SQL/SOQL meta-characters (`' OR '1'='1`) and script tags (`<script>alert(1)</script>`) into property address and grievance subject fields.
- **Result**: **PASS**. React JSX escapes script strings automatically; server SOQL services use parameterized bind variables (`:propId`, `:zone`).

### 2.7 Document Upload Security
- **Test**: Uploading executable binary (`.exe`, `.sh`) and oversized files (> 5MB).
- **Result**: **PASS**. Digital vault gatekeeper strictly enforces MIME allowlist (`application/pdf`, `image/png`, `image/jpeg`) and 5MB size ceiling.
