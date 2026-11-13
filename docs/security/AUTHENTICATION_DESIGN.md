# CIVICTAX Authentication Architecture & Design

## 1. Dual-Tier Authentication Architecture

CivicTax features two distinct, strictly isolated authentication tiers tailored to its operational modes:

```mermaid
flowchart TD
    subgraph Client["Client Entrypoint"]
        LoginUI["LoginPage.tsx\n(/login)"]
        Credentials["Email & Password Form\n(Demo Personas or Salesforce)"]
    end

    subgraph ModeSwitch{"Operating Mode Selector"}
        LocalMode["Local Demonstration Mode"]
        SFMode["Salesforce Connected Mode"]
    end

    subgraph LocalAuth["Tier 1: Local Session Engine"]
        Context["AuthContext.tsx\n(Reactive Role State)"]
        LocalStorage["Indexed civictax_current_user\n(Session Token & Persona)"]
        Guards["ProtectedRoute.tsx\n(Client-Side Route Guard)"]
    end

    subgraph SalesforceAuth["Tier 2: Enterprise Cloud Gateway"]
        Gateway["Express Gateway (Port 3001)"]
        PKCE["OAuth 2.0 PKCE Handshake"]
        Cookie["HttpOnly Session Cookie (civictax.sid)"]
        Apex["Salesforce Platform Authorization"]
    end

    Client --> ModeSwitch
    ModeSwitch -->|local| LocalAuth
    ModeSwitch -->|salesforce| SalesforceAuth
    LocalAuth --> Context --> Guards
    SalesforceAuth --> Gateway --> PKCE --> Cookie --> Apex
```

---

## 2. Authentication Tiers Explained

### Tier 1: Local Demonstration Mode
- **Design Intent**: Zero-dependency academic demonstrations, campus evaluations, and offline functionality.
- **Pre-Seeded Personas**:
  - `citizen@civictax.demo` (`CITIZEN` role, ID `usr-citizen-01`)
  - `officer@civictax.demo` (`OFFICER` role, ID `usr-officer-01`, assigned Zone 1)
  - `admin@civictax.demo` (`ADMIN` role, ID `usr-admin-01`, full governance access)
- **Session Lifecycle**:
  - `login(email, password)`: Validates credentials, sets user in `AuthContext`, and synchronizes state to `civictax_current_user`.
  - `logout()`: Clears active session token and redirects to `/login`.
  - `ProtectedRoute`: Evaluates `user.role` against `allowedRoles`. Unauthorized access redirects immediately to login.

---

### Tier 2: Salesforce Connected Mode
- **Design Intent**: Authoritative enterprise multi-tenant integration with Salesforce.
- **Protocol**: OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636).
- **Identity Model**: Single Integration Principal for initial academic demonstration; maps directly to future Salesforce Experience Cloud citizen users.
- **Cookie & Session Guard**: The Express Gateway manages encrypted `civictax.sid` cookies with `HttpOnly` and `SameSite=Lax`. Tokens are never exposed to browser storage.
