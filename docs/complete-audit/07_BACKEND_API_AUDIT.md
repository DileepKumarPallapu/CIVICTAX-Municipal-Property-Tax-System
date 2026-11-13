# 07 — CivicTax Node.js Backend & REST API Gateway Audit

## 1. Backend Gateway Architecture

The CivicTax backend is an Express TypeScript application running on port 3001, providing an enterprise API gateway, authentication router, and proxy to Salesforce.

```
server/
├── src/
│   ├── config/          (Environment variables & server constants)
│   ├── middleware/      (Helmet security, CORS whitelist, cookie parser)
│   ├── modules/         (municipalRoutes.ts - Domain REST endpoints)
│   ├── repositories/    (ICivicTaxRepository.ts, LocalRepository.ts)
│   ├── routes/          (authRoutes.ts, salesforceRoutes.ts)
│   └── server.ts        (Application entry point)
```

---

## 2. API Endpoint Verification

| HTTP Method | Route | Purpose | Security / Auth | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Local authentication & session issuance | Rate limited, credential check | **VERIFIED** |
| `POST` | `/api/auth/logout` | Clears session cookie | Session context cleared | **VERIFIED** |
| `GET` | `/api/auth/me` | Current authenticated session identity | HttpOnly cookie verification | **VERIFIED** |
| `GET` | `/api/municipal/properties` | List properties (filtered by role/zone) | Session authenticated | **VERIFIED** |
| `POST` | `/api/municipal/properties` | Register new municipal property parcel | Body validation, unique check | **VERIFIED** |
| `GET` | `/api/municipal/assessments`| List tax assessment statements | Scoped to owner/zone | **VERIFIED** |
| `POST` | `/api/municipal/payments` | Ingest successful payment receipt | Idempotency token check | **VERIFIED** |
| `POST` | `/api/municipal/grievances`| Submit citizen grievance ticket | Input sanitization | **VERIFIED** |
| `GET` | `/api/salesforce/status` | Salesforce connection health check | Reports actual org status | **VERIFIED** |
| `POST` | `/api/salesforce/login` | Initiates OAuth 2.0 PKCE flow | Generates S256 code verifier | **VERIFIED** |

---

## 3. Resilience & Security Checkpoints

- **CORS Configuration**: Restricts origins strictly to `http://localhost:5173` (Vite dev) and production domains.
- **Helmet Headers**: Injects Content-Security-Policy (CSP), X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
- **Error Handling**: Standardized JSON error envelopes; raw internal database stack traces are suppressed in API responses.
