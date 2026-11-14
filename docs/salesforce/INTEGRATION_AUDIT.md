# CivicTax 6.0: Salesforce Integration Architecture & Environment Audit

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Date**: November 14, 2026 | **Version**: CivicTax 6.0  

---

## 1. Executive Summary & Audit Objectives

This audit establishes the empirical baseline of the CivicTax system prior to real Salesforce Trailhead Playground integration. In accordance with strict architectural governance:
- **No false claims of cloud deployment**: The Salesforce CLI currently reports `No Orgs found`.
- **Zero code degradation**: All existing working UI, routes, calculations, and local mock/demo data are fully preserved.
- **Enterprise Dual-Mode Architecture**: The application operates seamlessly in **Local Demonstration Mode** while providing secure, production-grade endpoints for **Salesforce Cloud Mode**.

---

## 2. Component-by-Component Architectural Audit

### 2.1 Frontend Architecture (React 18 + Vite + TypeScript)
- **Framework & Bundler**: React 18.3.1 with Vite 8.3.8 and TypeScript 5.8 (`tsc -b && vite build` compiles cleanly in 2.00s).
- **Service Layer Pattern**: Implements an enterprise `ServiceFactory` pattern (`src/services/serviceFactory.ts`), isolating React UI components from direct data transport implementations.
- **Salesforce Client Bridge**: `src/services/salesforceApiClient.ts` acts as the single-point HTTP communication channel connecting the browser to the backend Express gateway (`http://localhost:3001`), ensuring no Salesforce client secrets or bearer tokens are ever exposed to the client.
- **Admin UI Console**: `src/features/salesforce/SalesforceSettingsPage.tsx` provides live connection status, one-click OAuth authorization trigger, API verification, and session teardown.

### 2.2 Backend Architecture (Node.js + Express + TypeScript)
- **Server Runtime**: Express 4 running under `tsx watch` on `http://localhost:3001` with CORS configured for `http://localhost:5173` with credentials.
- **Session & Security**: `express-session` with encrypted HttpOnly, SameSite=Lax cookies (`civictax.sid`).
- **OAuth 2.0 Engine**: Implements the RFC 7636 Authorization Code Flow with Proof Key for Code Exchange (PKCE) utilizing SHA-256 code challenge generation and validation.
- **Token Management**: `SalesforceClient.ts` handles code exchange, token refresh (`refresh_token` grant), identity endpoint queries, and Apex REST proxy calls.

### 2.3 API Endpoints & Routes Audit
- `GET /health`: Gateway service heartbeat.
- `GET /auth/salesforce`: Initiates PKCE OAuth authorization redirect to Salesforce login domain.
- `GET /auth/salesforce/callback`: Exchanges authorization code and securely stores tokens in session.
- `POST /auth/salesforce/logout`: Terminates session and clears cookies.
- `GET /api/salesforce/status`: Returns current connection metadata without exposing secrets.
- `GET /api/salesforce/verify`: Executes live identity verification against the Salesforce Org.
- `ALL /api/salesforce/proxy/*`: Secure authenticated reverse-proxy to custom Apex REST endpoints (`/services/apexrest/civictax/v1/*`).
- `CRUD /api/properties`: Property registration, listing, and status updates.
- `CRUD /api/assessments`: Assessment calculations and listings.
- `CRUD /api/payments`: Payment recording and receipt generation.
- `CRUD /api/grievances`: Citizen dispute intake and resolution tracking.

### 2.4 Environment Variables Audit
- `.env.example` in `server/` specifies:
  - `SF_LOGIN_URL` (Default: `https://login.salesforce.com`)
  - `SF_CLIENT_ID` (External Client App / Connected App Consumer Key)
  - `SF_CLIENT_SECRET` (External Client App / Connected App Consumer Secret)
  - `SF_REDIRECT_URI` (`http://localhost:3001/auth/salesforce/callback`)
  - `SF_API_VERSION` (`v60.0`)
  - `SESSION_SECRET` (Cryptographic cookie secret)
  - `FRONTEND_URL` (`http://localhost:5173`)
  - `PORT` (`3001`)
- **Status**: `server/.env` is staged from `.env.example`. Actual credentials must be provisioned in the user's Trailhead Playground.

### 2.5 Salesforce CLI & Environment Audit
- Command executed: `sf org list`
- Output: `No Orgs found.`
- Audit Finding: No Salesforce Org is currently authenticated in the local environment. Deployment to the cloud requires authenticating the Playground via `sf org login web`.

---

## 3. Gap Analysis & Next Implementation Actions

| Area | Current State | Required State for CivicTax 6.0 | Action Required |
|---|---|---|---|
| **Data Model** | `Property__c`, `Tax_Assessment__c`, `Tax_Payment__c` fields partial | Full 4 Custom Objects with all specified fields + Record Types | Expand XML field metadata in `force-app/main/default/objects/` |
| **Reassessment** | Custom object folder exists, fields empty | Complete `Reassessment_Request__c` schema with 7 custom fields | Create field metadata XML files |
| **Apex Services** | 4 services implemented | 8 modular Apex services covering full lifecycle | Author `CivicTax*Service.cls` suite |
| **Apex Triggers** | 2 triggers (`Property`, `Payment`) | 5 triggers with recursion-safe handlers | Add `Assessment`, `Reassessment`, `Grievance` triggers & handlers |
| **Flows** | Empty directory | 7 Declarative Record-Triggered & Screen Flows | Author flow metadata XML |
| **Approvals** | Empty directory | Verification, Assessment & Reassessment Approval Processes | Author approval process XML |
| **Async Apex** | Basic Queueable/Batch | Queueable, Batch & Schedulable suite with error logging | Refine async Apex classes |
| **Test Classes** | 3 test classes | Comprehensive test suite with `System.runAs` & bulk tests | Author full test coverage suite |
| **Express Routes** | Reassessments & Dashboard missing from `municipalRoutes.ts` | All 13 required endpoints present | Update `municipalRoutes.ts` |
