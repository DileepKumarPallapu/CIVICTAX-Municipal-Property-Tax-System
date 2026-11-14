# CIVICTAX 8.0: SALESFORCE PLAYGROUND CONNECTION GUIDE

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Assigned Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Version**: CivicTax 8.0 — Phase 1 Connection Specification  

---

## 1. Integration Architecture & Data Flow

CivicTax 8.0 connects the external React web application to your Salesforce Trailhead Playground / Developer Edition org using a secure, zero-client-leakage reverse-proxy architecture:

```
+---------------------------------------------------------------------------------------------------+
|                         CIVICTAX 8.0 ENTERPRISE INTEGRATION PIPELINE                              |
+---------------------------------------------------------------------------------------------------+

   [ Browser / React 18 Client ]
        (http://localhost:5173)
                   │
                   │ 1. Click "Connect Salesforce Playground"
                   ▼
   [ Express Backend Gateway ]
        (http://localhost:3001)
                   │
                   │ 2. Generates PKCE Code Verifier & SHA-256 Code Challenge
                   │ 3. Redirects to Salesforce OAuth Authorize endpoint
                   ▼
   [ Salesforce Login / Trailhead Playground ]
        (https://login.salesforce.com/services/oauth2/authorize)
                   │
                   │ 4. Citizen/Admin logs in and clicks "Allow"
                   │ 5. Salesforce redirects back with single-use Authorization Code
                   ▼
   [ Express Callback Handler ]
        (http://localhost:3001/auth/salesforce/callback)
                   │
                   │ 6. Server exchanges Code + Code Verifier for Access & Refresh Tokens
                   │ 7. Stores tokens exclusively in encrypted server-side session
                   │ 8. Sets HttpOnly, SameSite=Lax cookie ('civictax.sid')
                   │ 9. Redirects browser back to '/admin/salesforce?status=success'
                   ▼
   [ Authenticated Session Active ]
        - React calls '/api/salesforce/status' -> Displays CONNECTED with Org ID
        - React calls Apex REST via '/api/salesforce/proxy/*'
        - ZERO access tokens or client secrets are ever transmitted to the browser
```

---

## 2. Step-by-Step Salesforce Playground Configuration

Perform the following configuration steps in your Salesforce Trailhead Playground:

### Step 2.1: Open App Manager in Salesforce Setup
1. Log in to your Trailhead Playground (or Developer Edition org).
2. Click the **Gear Icon (⚙️)** in the upper right header and select **Setup**.
3. In the left navigation panel **Quick Find** box, type `App Manager`.
4. Click on **App Manager** under **Apps**.

### Step 2.2: Create a New Connected App
1. In the upper right corner of the Lightning Experience App Manager table, click the **New Connected App** button.
2. In the **Basic Information** section, enter:
   - **Connected App Name**: `CivicTax Gateway`
   - **API Name**: `CivicTax_Gateway` *(auto-populates)*
   - **Contact Email**: Enter your email address.
3. In the **API (Enable OAuth Settings)** section:
   - Check the box for **Enable OAuth Settings**.
   - In the **Callback URL** field, enter the exact URI:
     ```
     http://localhost:3001/auth/salesforce/callback
     ```
   - In **Selected OAuth Scopes**, select and move each of these four scopes from **Available OAuth Scopes** to **Selected OAuth Scopes**:
     - `Manage user data via APIs (api)`
     - `Perform requests at any time (refresh_token, offline_access)`
     - `Access unique user identifiers (id, openid)`
     - `Manage user data via Web browsers (web)`
   - Check the box for **Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows**.
   - Ensure the box for **Require Secret for Web Server Flow** is checked.
4. Scroll to the bottom and click the **Save** button.
5. On the confirmation screen, click **Continue**.
   > *Note: Salesforce globally propagates new Connected Apps within 2 to 10 minutes.*

### Step 2.3: Retrieve Consumer Key & Consumer Secret
1. On the detail page for **CivicTax Gateway**, locate the **API (Enable OAuth Settings)** section.
2. Click the button labeled **Manage Consumer Details**.
3. If prompted, enter the verification code sent to your email.
4. Copy the two generated keys:
   - **Consumer Key**
   - **Consumer Secret**

### Step 2.4: Save Credentials in Local Backend Environment
1. Open the file `server/.env` located in:
   `C:\Users\dilee\.gemini\antigravity\scratch\civictax\server\.env`
2. Paste your keys into the respective variables:
   ```env
   SF_CLIENT_ID=<Paste_Your_Consumer_Key_Here>
   SF_CLIENT_SECRET=<Paste_Your_Consumer_Secret_Here>
   SF_LOGIN_URL=https://login.salesforce.com
   SF_REDIRECT_URI=http://localhost:3001/auth/salesforce/callback
   SF_API_VERSION=v60.0
   ```
3. Save the file. The Express development server (`tsx watch`) will automatically reload with the new credentials.

---

## 3. Authenticating the Salesforce CLI (For DX Source Deployment)

To deploy the staged Apex classes, custom objects, triggers, and flows into your Playground:

1. Open PowerShell and run:
   ```powershell
   cd C:\Users\dilee\.gemini\antigravity\scratch\civictax\salesforce
   sf org login web --alias CivicTaxPlayground --set-default
   ```
2. Your default web browser will open to the Salesforce login screen.
3. Log in with your Trailhead Playground username and password.
4. Click **Allow** on the OAuth authorization prompt.
5. In PowerShell, verify that the org is authenticated:
   ```powershell
   sf org list
   ```
   You will see `CivicTaxPlayground` listed with status `Connected`.

---

## 4. Initiating the Live Web Connection

1. Open your browser and navigate to the CivicTax web interface:
   `http://localhost:5173/admin/salesforce`
2. You will see the **Salesforce Integration Gateway** page showing:
   - Status badge: `Disconnected (Local Mode)`
   - Target API Version: `v60.0`
   - Callback URI: `http://localhost:3001/auth/salesforce/callback`
3. Click the blue button labeled **Connect Salesforce Playground**.
4. You will be redirected to Salesforce login. Log in and click **Allow**.
5. You will be automatically redirected back to `http://localhost:5173/admin/salesforce?status=success`.
6. The status badge will transition to an emerald-green **Connected (Authorized Org)** displaying your authenticated Salesforce username, Org ID, and instance URL.
7. Click the green button **Verify Live Connection** to execute an end-to-end identity API verification against your live Playground.
