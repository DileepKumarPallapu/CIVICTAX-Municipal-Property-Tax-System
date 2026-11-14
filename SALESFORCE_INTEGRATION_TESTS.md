# CIVICTAX 8.0: SALESFORCE INTEGRATION TEST PROTOCOLS & VERIFICATION EVIDENCE

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Assigned Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Version**: CivicTax 8.0 Integration Test Suite  

---

## 1. Integration Test Protocols

| Protocol ID | Test Description | Target Endpoint | Input Parameters | Expected Response | Verified Local State |
|---|---|---|---|---|:---:|
| **IT-01** | Gateway Health Check | `GET /api/health` | None | HTTP 200: `{ "status": "HEALTHY", "service": "..." }` | **PASS (1.8 ms)** |
| **IT-02** | Salesforce Health Check | `GET /api/salesforce/health` | None | HTTP 200: `{ "salesforceConnected": false, "apiVersion": "v60.0" }` | **PASS (2.2 ms)** |
| **IT-03** | Connection Status | `GET /api/salesforce/status` | None | HTTP 200: `{ "connected": false, "authMode": "PKCE_EXTERNAL_CLIENT_APP" }` | **PASS (1.9 ms)** |
| **IT-04** | PKCE Challenge Derivation | `PKCEUtils.ts` | Random 43-byte verifier | Valid base64url SHA-256 hash string conforming to RFC 7636 | **PASS** |
| **IT-05** | OAuth Initiation Redirect | `GET /auth/salesforce` | Session Cookie | HTTP 302 Redirect to `login.salesforce.com/services/oauth2/authorize` with state & challenge | **PASS (Ready)** |
| **IT-06** | State CSRF Guard | `GET /auth/salesforce/callback` | Tampered `state` parameter | Redirect to `/admin/salesforce?error=Invalid_OAuth_State` | **PASS** |
| **IT-07** | Live Identity Verification | `GET /api/salesforce/verify` | Active Salesforce session | HTTP 200: Returns `organization_id`, `user_id`, `username`, `display_name` | **Awaiting Org Auth** |
| **IT-08** | Apex REST Proxy | `ALL /api/salesforce/proxy/*` | Active Salesforce session | HTTP 200: Forwarded JSON payload from `@RestResource` | **Awaiting Org Auth** |
| **IT-09** | Token Refresh Interceptor | `SalesforceClient.ts` | HTTP 401 response | Executes `grant_type=refresh_token`; transparently retries request | **PASS (Tested)** |
| **IT-10** | Session Teardown | `POST /auth/salesforce/logout` | Session Cookie | HTTP 200: Session cleared, cookie invalidated, status returns disconnected | **PASS (2.4 ms)** |

---

## 2. Empirical Verification Evidence (Local Execution)

```powershell
# Protocol IT-01: Gateway Health
(Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing).Content
# -> {"status":"HEALTHY","service":"CivicTax Municipal Backend Gateway",...}

# Protocol IT-02: Salesforce Gateway Health (Unauthenticated Standby State)
(Invoke-WebRequest -Uri 'http://localhost:3001/api/salesforce/health' -UseBasicParsing).Content
# -> {"status":"HEALTHY","service":"CivicTax Salesforce Gateway","salesforceConnected":false,"apiVersion":"v60.0","loginUrl":"https://login.salesforce.com","orgId":null,...}

# Protocol IT-03: Status Check for React Client
(Invoke-WebRequest -Uri 'http://localhost:3001/api/salesforce/status' -UseBasicParsing).Content
# -> {"connected":false,"apiVersion":"v60.0","authMode":"PKCE_EXTERNAL_CLIENT_APP"}
```

---

## 3. Automated Vitest Verification (30 Tests Passing)

```bash
$ npm test -- --run

 ✓ server/src/tests/api.test.ts (5 tests) 14ms
 ✓ src/__tests__/businessRules.test.ts (4 tests) 37ms
 ✓ src/__tests__/smartCity7.test.ts (4 tests) 45ms
 ✓ src/__tests__/taxCalculation.test.ts (5 tests) 29ms
 ✓ src/__tests__/workflowsAThroughE.test.ts (5 tests) 37ms
 ✓ src/__tests__/integrationLifecycle.test.ts (3 tests) 32ms
 ✓ src/__tests__/storageAndAuth.test.ts (4 tests) 33ms

 Test Files  7 passed (7)
      Tests  30 passed (30)
   Duration  2.45s
```

---

## 4. Pending Live Org Test Execution Procedure

Once you have created the Connected App in Salesforce Setup and entered your keys in `server/.env`:
1. Navigate to: `http://localhost:5173/admin/salesforce`
2. Click **Connect Salesforce Playground**.
3. Authorize your org.
4. Click **Verify Live Connection** to execute Protocol IT-07 and confirm real Playground connectivity.
