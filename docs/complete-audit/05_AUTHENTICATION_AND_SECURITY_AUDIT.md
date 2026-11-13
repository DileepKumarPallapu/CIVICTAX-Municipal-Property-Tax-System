# 05 — CivicTax Authentication, User Management & Security Audit

## 1. Authentication Architecture

CivicTax implements a secure, role-based access control (RBAC) architecture separating public visitors, registered citizens, municipal field officers, and administrators.

```
+-------------------------------------------------------------------------------+
|                       AUTHENTICATION & SESSION ARCHITECTURE                   |
+-------------------------------------------------------------------------------+

 [ Public Visitor ] ---> Access Public Landing, About, Services, Public Transparency
                                 |
                                 v
                         [ Login Gateway ]
                                 |
                 +---------------+---------------+
                 |                               |
                 v                               v
    [ Local Demonstration Mode ]      [ Enterprise Salesforce Mode ]
    - Scoped LocalStorage / Cookie     - OAuth 2.0 PKCE Handshake
    - Role Context: Citizen/Off/Admin  - Server-Side Token Storage (Port 3001)
    - Instant Credential Selectors     - HttpOnly Signed Session Cookie
```

---

## 2. Role-Based Access Control (RBAC) Audit

| Role | Permitted Routes | Prohibited Actions / Enforcement |
| :--- | :--- | :--- |
| **`CITIZEN`** | `/citizen/*`, `/transparency`, Public Pages | Cannot view or modify peer properties; cannot access `/officer/*` or `/admin/*`; cannot alter municipal tax rates or issue demand notices. |
| **`OFFICER`** | `/officer/*`, `/transparency`, Public Pages | Scoped to assigned municipal zone; cannot delete tax rates; cannot modify system administrative settings. |
| **`ADMIN`** | `/admin/*`, `/officer/*`, `/citizen/*` | Full municipal governance, rate configuration, user administration, and system persistence controls. |

---

## 3. Security Checkpoint Results

1. **Token Secrecy**: Salesforce OAuth tokens are strictly confined to server-side memory on the Express gateway (`server/src/routes/salesforceRoutes.ts`). No client-side code has access to client secrets or raw tokens.
2. **Session Persistence**: Sessions survive page reloads and browser restarts via structured local serialization (`AuthContext.tsx`).
3. **Broken Object-Level Authorization (BOLA)**: Services enforce record ownership checks—citizen property queries are filtered by `ownerId === currentUser.id`.
4. **Credential Security**: Demonstration passwords in local mode are clearly disclosed for academic evaluation; production deployments require bcrypt-hashed credentials on the Express server.
