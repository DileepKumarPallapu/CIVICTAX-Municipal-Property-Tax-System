# CivicTax Comprehensive Security Audit & Threat Modeling

## 1. Security Architecture & Threat Vectors

The CivicTax security framework enforces Defense-in-Depth across presentation, API gateway, local persistence, and enterprise CRM layers.

```
+-------------------------------------------------------------------------------+
|                        CIVICTAX MULTI-TIER SECURITY PERIMETER                 |
+-------------------------------------------------------------------------------+

 [ React Client ] ----( HTTPS / SameSite Strict Cookie )----> [ Express Gateway ]
        |                                                              |
        | - No Tokens in Storage                                       | - Rate Limiting & Helmet
        | - CSV Formula Neutralization                                 | - CSRF & CORS Whitelist
        | - Zero-PII Open Feeds                                        | - Input Validation Schemas
        |                                                              v
        |                                                     [ Server Session ]
        |                                                              |
        v                                                              v
 [ Local SQLite / Browser Cache ]                             [ Salesforce OAuth ]
   - Strict Origin Isolation                                    - PKCE S256 Handshake
   - Scoped Citizen Context                                     - OWD Private & FLS Enforced
```

---

## 2. Threat Mitigation & Verification Matrix

| Vulnerability Category | Threat Description | CivicTax Countermeasure | Audit Result |
| :--- | :--- | :--- | :--- |
| **Token Exposure (CWE-312)** | Storing OAuth tokens in `localStorage` or `sessionStorage` exposes tokens to XSS. | Salesforce tokens are strictly kept in server-side session memory on port 3001; client receives `HttpOnly` cookie. | **PASS** |
| **CSV Formula Injection (CWE-1236)** | Malicious cells starting with `=`, `+`, `-`, or `@` execute arbitrary commands in Excel. | Export engine automatically prepends `'` to force spreadsheets to parse values as literal strings. | **PASS** |
| **Broken Object Level Auth (BOLA / CWE-639)** | Citizen modifying URL parameters to view another citizen's property or payment receipt. | Services validate record ownership against authenticated citizen context (`contactId` match). | **PASS** |
| **Overpayment / Race Condition** | Concurrent payment submissions causing double collection or negative balances. | Pessimistic locking (`FOR UPDATE` in Apex / atomic balance checks in LocalRepository). | **PASS** |
| **PII Data Leakage (CWE-359)** | Public transparency feeds exposing citizen identities or payment hashes. | Transparency service aggregates data at Zone level; citizen names and transaction IDs are stripped. | **PASS** |
| **XSS via CiviAssist / Chat** | Prompt injection or unescaped HTML rendered in the assistant widget. | All assistant responses are rendered via sanitized React text nodes with markdown sanitization. | **PASS** |

---

## 3. Demo Mode Security Limitations & Disclosures

1. **Local Demonstration Authentication**: Pre-configured demo accounts (`citizen@civictax.org`, `officer@civictax.org`, `admin@civictax.org`) utilize simplified password verification for academic evaluation.
2. **Simulated Payment Gateways**: Payment operations in local mode simulate bank webhook success responses and do not connect to live Indian banking rails (NPCI/RBI).
3. **Synthetic Coordinates**: All map coordinates in demo mode are flagged as synthetic and must not be used for land-survey or cadastral legal proceedings.
