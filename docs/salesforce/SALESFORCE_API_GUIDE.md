# CivicTax Salesforce External Client App & REST API Integration Guide

## 1. OAuth 2.0 PKCE Flow Architecture

CivicTax integrates with Salesforce using an **External Client App** configured with OAuth 2.0 Authorization Code Grant and Proof Key for Code Exchange (PKCE).

```
+-------------------------------------------------------------------------------+
|                       OAUTH 2.0 PKCE AUTHORIZATION FLOW                       |
+-------------------------------------------------------------------------------+

 [ React Frontend ]        [ Express Gateway (Port 3001) ]       [ Salesforce Core ]
         |                                |                               |
         | 1. Click "Login with SF"       |                               |
         |------------------------------->|                               |
         |                                | 2. Generate code_verifier     |
         |                                |    & code_challenge (S256)    |
         | 3. Redirect to SF Auth URL     |                               |
         |<-------------------------------|                               |
         |                                |                               |
         | 4. User Authenticates in Salesforce -------------------------->|
         |                                                                |
         | 5. Callback with auth code                                     |
         |<---------------------------------------------------------------|
         |                                                                |
         | 6. Forward code to Express     |                               |
         |------------------------------->|                               |
         |                                | 7. Exchange code + verifier   |
         |                                |------------------------------>|
         |                                |                               |
         |                                | 8. Return Access/Refresh Token|
         |                                |<------------------------------|
         |                                |                               |
         | 9. Set HttpOnly Session Cookie | (Stores token server-side)    |
         |<-------------------------------|                               |
```

> [!CAUTION]
> **Zero Token Leakage Mandate**: Salesforce Access Tokens and Refresh Tokens are strictly stored in server-side session memory on the Express Gateway. Tokens are NEVER serialized, exposed, or transmitted to the React client application.

---

## 2. Apex REST Endpoints (`/services/apexrest/civictax/v1/*`)

| Endpoint | HTTP Method | Action | Auth Required |
| :--- | :--- | :--- | :--- |
| `/civictax/v1/properties` | `GET` | List permitted properties for authenticated contact | Yes |
| `/civictax/v1/properties` | `POST` | Register new municipal property parcel | Yes |
| `/civictax/v1/assessments` | `GET` | Retrieve assessments and current tax liability | Yes |
| `/civictax/v1/payments` | `POST` | Ingest and verify successful tax payment receipt | Yes |
| `/civictax/v1/grievances` | `POST` | Submit municipal grievance ticket | Yes |
| `/civictax/v1/dashboard` | `GET` | Retrieve aggregated zonal and collection KPIs | Yes (Admin/Officer) |
