# CivicTax 8.0 Salesforce Integration Architecture

## 1. Overview & Security Topology

CivicTax 8.0 introduces an enterprise backend gateway connecting the existing CivicTax React frontend with a real Salesforce Trailhead Playground.

```mermaid
flowchart TD
    subgraph Frontend["React 19 Frontend (http://localhost:5173)"]
        UI["CivicTax Portal Views\n(Citizen, Officer, Admin)"]
        SF_Settings["Salesforce Gateway Screen\n(/admin/salesforce)"]
        Client["SalesforceApiClient\n(credentials: 'include')"]
    end

    subgraph Backend["CivicTax Express Backend (http://localhost:3001)"]
        OAuthHandler["OAuth 2.0 PKCE Controller\n(/auth/salesforce)"]
        SessionStore["Server Session Store\n(HttpOnly civictax.sid cookie)"]
        ApexProxy["Apex REST Reverse Proxy\n(/api/salesforce/proxy/*)"]
        SFClient["SalesforceClient\n(Token Refresh, PKCE, Apex HTTP)"]
    end

    subgraph Salesforce["Salesforce Trailhead Playground (External Client App)"]
        OAuthEndpoint["OAuth 2.0 Authorization Server\n(/services/oauth2/token)"]
        ApexREST["CivicTaxRestResource\n(/services/apexrest/civictax/v1/*)"]
        ApexServices["Authoritative Services\n(PropertyService, TaxCalculationService, PaymentService)"]
        CustomObjects["Authoritative Database\n(Property__c, Tax_Assessment__c, Tax_Payment__c)"]
    end

    UI --> Client
    SF_Settings --> Client
    Client -->|Cookie Authenticated| Backend
    OAuthHandler --> OAuthEndpoint
    ApexProxy --> ApexREST
    ApexREST --> ApexServices
    ApexServices --> CustomObjects
```

## 2. Zero-Leakage Security Protocol

1. **Tokens Never Reach the Browser**:
   - `access_token` and `refresh_token` are held exclusively inside server-side session memory on port `3001`.
   - The React client only communicates with the backend via `HttpOnly`, `SameSite=Lax` session cookies.
2. **PKCE (Proof Key for Code Exchange)**:
   - High-entropy code verifier is cryptographically generated using SHA-256 challenges on the backend.
3. **Authoritative Financial Calculations**:
   - Tax assessments and payment balance recalculations are executed strictly in Apex, preventing client-side price tampering.
4. **User-Mode DML & SOQL**:
   - All Apex queries and operations use `WITH USER_MODE` and `insert as user` to enforce Field-Level Security (FLS) and object permissions.
