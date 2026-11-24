# CIVICTAX 8.0: SALESFORCE ENVIRONMENT SETUP SPECIFICATION

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Assigned Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Version**: CivicTax 8.0 Environment Configuration  

---

## 1. System Runtime & Architecture Stack

| Layer | Technology | Runtime Version | Default Network Address |
|---|---|---|---|
| **Frontend Web Client** | React 18, Vite 8, Tailwind CSS | Node.js v24.14.1 | `http://localhost:5173` |
| **Backend Integration Gateway** | Express 4, TypeScript 5.8 | Node.js v24.14.1 (`tsx watch`) | `http://localhost:3001` |
| **Salesforce Metadata Source** | Salesforce DX (SFDX Source Format) | API Version `60.0` (Spring '24) | Staged in `salesforce/` |
| **Target Cloud Org** | Trailhead Playground / Developer Edition | Salesforce Platform | `https://login.salesforce.com` |

---

## 2. Server Environment Variables

The backend reads these variables from its runtime environment (`server/.env` for local development). Production credentials belong only in the backend deployment's secret configuration; never commit them or expose them through `VITE_*` variables.

| Variable | Production requirement | Purpose |
|---|---|---|
| `SF_LOGIN_URL` | HTTPS Salesforce login or sandbox origin | OAuth authority; default is `https://login.salesforce.com`. |
| `SF_CLIENT_ID` | Required | Salesforce External Client App / OAuth client ID. |
| `SF_CLIENT_SECRET` | Only if required by the configured OAuth client | Backend-only OAuth client secret. Authorization Code + PKCE is also required. |
| `SF_EXPECTED_ORG_ID` | Required, exact 15- or 18-character Salesforce org ID | Restricts sign-in to the approved CivicTax authentication org; do not use the Dev Hub ID unless it is also that org. |
| `SF_REDIRECT_URI` | Required HTTPS callback | Must exactly match the Salesforce OAuth callback, including `/auth/salesforce/callback`. |
| `SF_API_VERSION` | Optional; defaults to `v60.0` | Salesforce REST API version. |
| `SESSION_SECRET` | Required, at least 32 characters | Signs the `civictax.sid` session cookie. Use a unique random value. |
| `FRONTEND_URL` | Required HTTPS origin | Exact frontend origin for CORS and post-login redirects; do not include a path. |
| `REDIS_URL` or `KV_URL` | One Redis option is required | TCP Redis used for sessions, OAuth state, and encrypted central Salesforce credentials. |
| `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` | Alternative to TCP Redis; configure both | Upstash REST transport for the same Redis-backed data. |
| `CIVICTAX_GATEWAY_KEY_ID` | Required | Non-secret HMAC key identifier for backend-to-Apex requests. |
| `CIVICTAX_GATEWAY_SHARED_SECRET` | Required, at least 32 characters | Backend-only HMAC key; must match the protected gateway package configuration. Never log or expose it. |
| `PORT` | Supplied by Render; defaults to `3001` locally | Backend listener port. |
| `NODE_ENV` | Set to `production` in production | Enables strict production validation and disables demo authentication. |

The frontend API client accepts `VITE_API_BASE_URL` (preferred) or `VITE_BACKEND_URL`. Set it to the actual backend origin at build time; these variables are public and must never contain credentials.

## 3. Salesforce OAuth and Identity Setup

1. Configure the Salesforce External Client App (or supported OAuth client) for Authorization Code flow with PKCE (`S256`) and the exact callback in `SF_REDIRECT_URI`. User sign-in requests only the `api` and `id` scopes. The separate administrator service-connection flow also requests `refresh_token`; its credentials are not used as a CivicTax user's identity.
2. Set `SF_EXPECTED_ORG_ID` to the approved authentication org ID. The backend validates the Salesforce identity URL, returned user/org IDs, and this expected org before resolving a CivicTax mapping.
3. Deploy `CivicTaxIdentityRestResource` and assign the `CivicTax_Salesforce_Identity` permission set to eligible Salesforce users. Those users also need an appropriate Salesforce license and API access.
4. Link each eligible Salesforce user through their Salesforce Contact to exactly one `CivicTax_User__c` record. The mapping must have an allowed role (`CITIZEN`, `OFFICER`, or `ADMIN`) and `Account_Status__c = ACTIVE`. Email is not used as the identity key. Missing, duplicate, or inactive mappings are rejected; the optional Contact ID field is not itself unique, so duplicates require data-governance controls.
5. The identity REST resource derives the Contact from `UserInfo` and returns only the mapped CivicTax identity. Its narrow system-sharing query is pinned to that Contact because external-user sharing may hide mapping rows; callers cannot supply a user, Contact, or role.

## 4. Network and Session Security

- CORS allows the exact configured `FRONTEND_URL` with credentials. State-changing backend requests validate the browser origin and require the CivicTax request header when no origin is supplied.
- Session IDs remain in an `HttpOnly` cookie, are regenerated after login, and expire after 30 minutes idle or 8 hours absolute. Production cookies use `Secure` and `SameSite=None`; Redis is mandatory in production and there is no in-memory production fallback.
- The listed Vercel (`vercel.app`) and Render (`onrender.com`) hosts are cross-site. `SameSite=None` is necessary for credentialed browser requests, but browser third-party-cookie restrictions can still block sessions. Prefer frontend and API custom domains under the same site, or another verified same-site deployment arrangement, before production rollout.
- OAuth state is short-lived, single-use, stored in Redis, and bound to the initiating browser session. The Salesforce user token is used only for identity resolution and is not retained in the CivicTax session.
- Production authentication fails closed when required OAuth, expected-org, HMAC, session, or Redis configuration is missing. Demo credentials and demo registration are development-only.

These are configuration requirements, not evidence that the production Salesforce app, Render Redis, or Vercel/Render runtime has been configured or verified.
