# CIVICTAX Security Architecture

## 1. Multi-Tier Security Model

CivicTax implements defense-in-depth security spanning the React frontend, Express Gateway, and Salesforce Platform.

```mermaid
flowchart TD
    subgraph BrowserSecurity["Browser Tier"]
        NoTokens["Zero Token Storage\n(No tokens in LocalStorage/React)"]
        JSX_Escape["JSX Contextual Auto-Escaping\n(Prevents XSS Injection)"]
        SameSite["SameSite=Lax Cookie Enforcement\n(Protects against CSRF)"]
    end

    subgraph GatewaySecurity["Express Gateway Tier"]
        PKCE["PKCE Code Challenge (SHA-256)\n(Prevents Authorization Code Interception)"]
        HttpOnly["HttpOnly Session Cookie (civictax.sid)\n(Prevents Script Extraction)"]
        CORS["Strict CORS Allowlist\n(Configured strictly to FRONTEND_URL)"]
    end

    subgraph SalesforceSecurity["Salesforce Platform Tier"]
        OWD["Organization-Wide Defaults (OWD)\n(Default Private Records)"]
        PermSets["Permission Sets\n(CivicTax_Officer, CivicTax_Admin)"]
        UserMode["User-Mode DML & SOQL\n(WITH USER_MODE & insert as user)"]
        Locking["Pessimistic Concurrency Locking\n(SELECT ... FOR UPDATE)"]
    end

    BrowserSecurity --> GatewaySecurity
    GatewaySecurity --> SalesforceSecurity
```

---

## 2. Core Security Controls

### A. Zero Token Leakage Policy
- Under no circumstances are Salesforce `access_token` or `refresh_token` returned to the React frontend.
- Tokens reside strictly in server-side session memory on port 3001.

### B. Authorization Code Flow with PKCE
- Uses cryptographically generated 64-byte random code verifiers.
- Generates base64url-encoded SHA-256 code challenges for authorization calls.
- Validates random 32-byte CSRF `state` tokens upon callback.

### C. Citizen Privacy & Open Data Protection
- The Public Transparency module uses strict filtering algorithms in `LocalTransparencyService.ts` to ensure zero Personal Identifiable Information (PII) is published.
- Names, mobile numbers, email addresses, and specific street-level plot addresses are completely omitted from public aggregate responses.
