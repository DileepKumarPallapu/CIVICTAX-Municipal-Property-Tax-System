# CivicTax 6.0: Salesforce Trailhead Playground Connection Guide

## 1. Overview & Architecture

CivicTax 6.0 integrates with Salesforce using enterprise-grade **OAuth 2.0 Authorization Code Flow with Proof Key for Code Exchange (PKCE)** (RFC 7636).

```
[ React 18 Frontend ] (Port 5173)
        │
        │ 1. Click "Connect to Salesforce"
        ▼
[ Express Gateway ] (Port 3001)
        │
        │ 2. Generate cryptographically secure Code Verifier & SHA-256 Challenge
        │ 3. Redirect user with Client ID + Code Challenge + Scopes
        ▼
[ Salesforce Login / Trailhead Playground ]
        │
        │ 4. Citizen/Officer enters credentials & approves OAuth permissions
        │ 5. Salesforce redirects to Callback URL with Authorization Code
        ▼
[ Express Callback Handler ] (`/auth/salesforce/callback`)
        │
        │ 6. Exchange Code + Code Verifier for Access Token & Refresh Token
        │ 7. Store Access Token & Refresh Token in server-side HttpOnly session
        │ 8. Redirect back to React frontend: `/admin/salesforce?status=success`
        ▼
[ Secure Session Established ]
        - Frontend calls `/api/salesforce/status` -> Reports CONNECTED
        - Zero tokens or secrets exposed to browser
```

---

## 2. Step-by-Step Salesforce Setup Instructions

To establish a live connection to your Trailhead Playground, perform the following setup steps once inside your Salesforce Org:

### Step 2.1: Open App Manager
1. Log in to your Trailhead Playground (or Developer Edition org).
2. Click the **Gear Icon** in the top right corner and select **Setup**.
3. In the Quick Find box on the left, type **App Manager** and click on **App Manager**.

### Step 2.2: Create a New Connected App
1. Click the **New Connected App** button (top right).
2. Enter the Basic Information:
   - **Connected App Name**: `CivicTax Gateway`
   - **API Name**: `CivicTax_Gateway`
   - **Contact Email**: Enter your email address.
3. Check the box for **Enable OAuth Settings**.
4. In the **Callback URL** field, enter:
   ```
   http://localhost:3001/auth/salesforce/callback
   ```
5. In **Selected OAuth Scopes**, select and add the following four scopes:
   - `Manage user data via APIs (api)`
   - `Perform requests at any time (refresh_token, offline_access)`
   - `Access unique user identifiers (id, openid)`
   - `Manage user data via Web browsers (web)`
6. Check **Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows**.
7. Ensure **Require Secret for Web Server Flow** is checked.
8. Click **Save** and then click **Continue** (allow 2–10 minutes for Salesforce global propagation).

### Step 2.3: Retrieve Consumer Key & Secret
1. On the Connected App detail page, click **Manage Consumer Details** (you may be prompted to enter a verification code sent to your email).
2. Copy the **Consumer Key** and **Consumer Secret**.
3. Open `server/.env` in your project and paste them:
   ```env
   SF_CLIENT_ID=<Your_Consumer_Key>
   SF_CLIENT_SECRET=<Your_Consumer_Secret>
   SF_LOGIN_URL=https://login.salesforce.com
   SF_REDIRECT_URI=http://localhost:3001/auth/salesforce/callback
   SF_API_VERSION=v60.0
   ```

---

## 3. Authenticating the Salesforce CLI (For Metadata Deployment)

To deploy the metadata (Objects, Apex classes, Triggers, Flows, Approvals) to your Trailhead Playground:

1. Open a terminal in the project directory:
   ```bash
   sf org login web --alias CivicTaxPlayground --set-default
   ```
2. Your default web browser will open with the Salesforce login page.
3. Log in with your Trailhead Playground credentials.
4. Click **Allow** when prompted.
5. In your terminal, verify the authenticated org:
   ```bash
   sf org list
   ```
   You will now see `CivicTaxPlayground` marked with `(U)` and `(D)` as your Default Org.

---

## 4. Token Refresh & Expiration Lifecycle

- **Automatic Token Rotation**: When an API call receives an `HTTP 401 Unauthorized` status from Salesforce, the `SalesforceClient.callApexRest()` service automatically intercepts the response.
- **Background Refresh**: It initiates a `grant_type=refresh_token` request using the server-stored refresh token.
- **Transparent Retry**: Upon receiving a fresh access token, it updates the session and re-executes the original API request without disrupting the user.
- **Teardown**: Clicking **Disconnect** in `/admin/salesforce` invalidates the server session, revokes the refresh token via `/auth/salesforce/logout`, and clears the cookie.
