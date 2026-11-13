# Salesforce External Client App & OAuth 2.0 PKCE Setup Guide

## 1. Why External Client Apps?

In modern Salesforce releases (API v60.0+), **External Client Apps** have officially superseded legacy Connected Apps, providing enhanced packaging, security policies, and granular OAuth credential management.

## 2. Step-by-Step Setup in your Trailhead Playground

### Step 1: Open External Client App Manager
1. Log into your Salesforce Trailhead Playground.
2. Click the **Gear Icon** (top right) $\rightarrow$ **Setup**.
3. In Quick Find, search for `External Client App Manager`.
4. Click **New External Client App**.

### Step 2: Configure Basic Information
- **External Client App Name**: `CivicTax Gateway`
- **API Name**: `CivicTax_Gateway`
- **Contact Email**: your email address.

### Step 3: Enable OAuth Settings
1. Check the box **Enable OAuth**.
2. **Callback URL**: Enter exact URL:
   ```
   http://localhost:3001/auth/salesforce/callback
   ```
3. **OAuth Scopes**: Select and add:
   - `Manage user data via APIs (api)`
   - `Perform requests at any time (refresh_token, offline_access)`
   - `Access unique user identifiers (id)`
   - `Provide access to custom applications (web)`
4. **Require Proof Key for Code Exchange (PKCE)**: Check this box.
5. Save the External Client App.

### Step 4: Retrieve Consumer Details
1. Under **OAuth Consumer Credentials**, copy the **Consumer Key** (`SF_CLIENT_ID`).
2. Copy the **Consumer Secret** (`SF_CLIENT_SECRET`).

### Step 5: Configure Server Environment
Create `server/.env` based on `server/.env.example`:
```ini
SF_LOGIN_URL=https://login.salesforce.com
SF_CLIENT_ID=<Paste_Your_Consumer_Key>
SF_CLIENT_SECRET=<Paste_Your_Consumer_Secret>
SF_REDIRECT_URI=http://localhost:3001/auth/salesforce/callback
SF_API_VERSION=v60.0
SESSION_SECRET=civictax_super_secure_random_session_secret_key_2026_dev
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```
