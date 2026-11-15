# CivicTax — Enterprise Vercel Deployment Guide

This guide provides end-to-end instructions for deploying the **CivicTax Municipal Property Tax System** as two independent, specialized Vercel projects from a single unified GitHub repository:

1. **CivicTax Frontend**: React 19 + Vite + TypeScript (Single Page Application)
2. **CivicTax Backend**: Express + Node.js + TypeScript (Vercel Serverless Functions Gateway)

---

## 1. Architectural Architecture & Vercel Mapping

```
                                GitHub Repository
           https://github.com/DileepKumarPallapu/CIVICTAX-Municipal-Property-Tax-System
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      Vercel Project 1 (Frontend)               Vercel Project 2 (Backend)
      Root Directory: ./                        Root Directory: server
      Runtime: Static Edge CDN (Vite)           Runtime: Node.js Vercel Functions
      URL: https://<frontend>.vercel.app        URL: https://<backend>.vercel.app
                 │                                         │
                 │────── REST / HTTPS (credentials) ───────│
                 │      (via VITE_API_BASE_URL)            │
                 │                                         ▼
                 │                              Salesforce Developer Org
                 └─────────────────────────◄─── (civictax-dev-new / NA232)
```

---

## 2. Prerequisites

1. **GitHub Account & Repository**:
   - Repository: `https://github.com/DileepKumarPallapu/CIVICTAX-Municipal-Property-Tax-System`
   - Ensure the latest changes are committed to your branch (`master` or `main`).
2. **Vercel Account**:
   - Sign up or log in at [vercel.com](https://vercel.com) using your GitHub account.
3. **Salesforce Developer Edition / Trailhead Playground**:
   - Active org alias: `civictax-dev-new` (`dileepkumarpallapu07.d8f36bbb93ff@agentforce.com`).
   - Consumer Key (`SF_CLIENT_ID`) and Consumer Secret (`SF_CLIENT_SECRET`) from Salesforce External Client App / Connected App.

---

## 3. Deployment Phase A — Backend Deployment (`civictax-backend`)

Deploy the backend first so its production URL can be provided to the frontend.

### Step A.1: Import Project in Vercel
1. In your Vercel Dashboard, click **Add New...** > **Project**.
2. Select your repository: `CIVICTAX-Municipal-Property-Tax-System`.
3. In the **Project Name** field, enter: `civictax-backend` (or your preferred name).

### Step A.2: Configure Root Directory
* Click **Edit** next to **Root Directory**.
* Select the `server` folder.
* Click **Continue**.

### Step A.3: Build and Output Settings
* **Framework Preset**: `Other` (or auto-detected Node.js).
* **Build Command**: Toggle Override ON and set: `npm run build`
* **Output Directory**: Leave empty / default (Vercel Functions deploy from `api/`).
* **Install Command**: `npm install` (default).

### Step A.4: Configure Backend Environment Variables
Under **Environment Variables**, add the following keys:

| Variable Name | Recommended Value / Placeholder | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production cookie security (`secure: true`, `sameSite: 'none'`). |
| `PORT` | `3001` | Server port (used for local fallback). |
| `SESSION_SECRET` | *(Generate a 32+ character random string)* | Secret for signing HTTP-only session cookies. |
| `REDIS_URL` | `rediss://default:...@...:6379` | **Essential for Production**: Upstash Redis, Vercel KV, or Redis Cloud connection URI for durable multi-instance serverless session clustering. Local dev can omit to use memory store. |
| `FRONTEND_URL` | `http://localhost:5173` *(Update in Phase C)* | Allowed origin for CORS & OAuth redirects. |
| `SF_LOGIN_URL` | `https://login.salesforce.com` | Target Salesforce login endpoint. |
| `SF_CLIENT_ID` | `YOUR_SALESFORCE_CONSUMER_KEY` | External Client App Consumer Key from Salesforce. |
| `SF_CLIENT_SECRET` | `YOUR_SALESFORCE_CONSUMER_SECRET` | External Client App Consumer Secret from Salesforce. |
| `SF_REDIRECT_URI` | `http://localhost:3001/auth/salesforce/callback` *(Update in Phase C)* | Authorized OAuth redirect URI. |
| `SF_API_VERSION` | `v60.0` | Salesforce REST API version. |

### Step A.5: Deploy Backend
1. Click **Deploy**.
2. Wait for Vercel build to complete (approx. 30–45 seconds).
3. Copy your assigned Backend URL from the dashboard:
   - Example: `https://civictax-backend.vercel.app`

### Step A.6: Verify Backend Health
Test the deployed backend endpoint in your browser or terminal:
```bash
curl -s https://<your-backend-project>.vercel.app/health
```
Expected Response:
```json
{"status":"HEALTHY","service":"CivicTax Salesforce Gateway","timestamp":"..."}
```

---

## 4. Deployment Phase B — Frontend Deployment (`civictax-frontend`)

### Step B.1: Import Project in Vercel
1. Return to the Vercel Dashboard, click **Add New...** > **Project**.
2. Select the **same** repository: `CIVICTAX-Municipal-Property-Tax-System`.
3. In the **Project Name** field, enter: `civictax-frontend`.

### Step B.2: Configure Root Directory
* **Root Directory**: `./` (leave default repository root).

### Step B.3: Build and Output Settings
* **Framework Preset**: `Vite` (auto-detected).
* **Build Command**: `npm run build` (`tsc -b && vite build`).
* **Output Directory**: `dist` (default).
* **Install Command**: `npm install` (default).

### Step B.4: Configure Frontend Environment Variables
Under **Environment Variables**, add the following keys:

| Variable Name | Production Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://<your-backend-project>.vercel.app` | **Your deployed backend URL from Step A.5**. |
| `VITE_BACKEND_URL` | `https://<your-backend-project>.vercel.app` | Fallback backend URL. |
| `VITE_DATA_PROVIDER` | `local` | Default data provider mode (`local` or `salesforce`). |
| `VITE_APP_NAME` | `CIVICTAX` | Platform title in header and navbar. |
| `VITE_DEFAULT_LANGUAGE` | `en` | Default UI language (`en` or `ta`). |

> [!IMPORTANT]
> Do NOT include a trailing slash in `VITE_API_BASE_URL` (e.g., use `https://civictax-backend.vercel.app`, not `https://civictax-backend.vercel.app/`).

### Step B.5: Deploy Frontend
1. Click **Deploy**.
2. Wait for the Vite build to complete (approx. 20–30 seconds).
3. Copy your assigned Frontend URL:
   - Example: `https://civictax-frontend.vercel.app`

---

## 5. Deployment Phase C — Two-Way Binding & Salesforce Alignment

Once both projects have their production URLs assigned, link them:

### Step C.1: Update Backend Environment Variables
1. Go to **Vercel Dashboard** > Project **civictax-backend** > **Settings** > **Environment Variables**.
2. Update `FRONTEND_URL`:
   - Set to: `https://<your-frontend-project>.vercel.app`
3. Update `SF_REDIRECT_URI`:
   - Set to: `https://<your-backend-project>.vercel.app/auth/salesforce/callback`
4. Go to the **Deployments** tab > click the latest deployment > **Redeploy** (select **Use existing Build Cache** = unchecked to pick up new env vars).

### Step C.2: Update Salesforce External Client App Callback URL
1. Log in to your Salesforce Developer Org: `https://login.salesforce.com`.
2. Go to **Setup** > **Apps** > **External Client Apps** > **External Client App Manager** (or **App Manager** > Connected Apps).
3. Open your CivicTax Connected/External Client App and edit OAuth Settings.
4. Add the production Callback URL to the **Callback URL** list:
   ```text
   https://<your-backend-project>.vercel.app/auth/salesforce/callback
   ```
   *(Keep `http://localhost:3001/auth/salesforce/callback` in the list for local development).*
5. Click **Save** (allow 2–5 minutes for Salesforce replication).

---

## 6. Verification & Smoke Test Checklist

| Component | Test Action | Expected Result |
| :--- | :--- | :--- |
| **Frontend SPA Routing** | Refresh page on `/properties`, `/assessments`, `/portal/dashboard` | Page renders cleanly without 404 (handled by `vercel.json` rewrite). |
| **Static Assets** | Verify brand logos, icons, and developer footer load | All icons, fonts, and assets display without broken image indicators. |
| **Backend Root** | Visit `https://<backend>.vercel.app/` | Returns JSON status `{ "status": "HEALTHY", "service": "..." }`. |
| **Municipal Health** | Visit `https://<backend>.vercel.app/api/health` | Returns municipal data provider status. |
| **CORS Policy** | Check browser console network requests from frontend to backend | Response contains `access-control-allow-origin: https://<frontend>.vercel.app` and `access-control-allow-credentials: true`. |
| **Session Security** | Inspect Network tab response headers on login | `set-cookie: civictax.sid=...; HttpOnly; Secure; SameSite=None`. |
| **Salesforce Auth** | In frontend, go to `/admin/salesforce` > click **Connect to Salesforce** | Redirects to Salesforce OAuth consent screen, then returns with `status=success`. |

---

## 7. Troubleshooting Common Deployment Issues

### Issue 1: 404 on Refreshing Nested Frontend Routes
* **Cause**: Vercel tries to find a static file matching the route path instead of serving `index.html`.
* **Fix**: Verified root [vercel.json](file:///C:/Users/dilee/.gemini/antigravity/scratch/civictax/vercel.json) rewrites all requests to `/index.html`. Ensure Root Directory is set to `./`.

### Issue 2: CORS Error (`Access to fetch at ... blocked by CORS policy`)
* **Cause**: `FRONTEND_URL` in the backend project's environment variables does not match the frontend Vercel URL.
* **Fix**: Ensure `FRONTEND_URL` in `civictax-backend` settings exactly matches `https://<your-frontend>.vercel.app` (including `https://` without a trailing slash).

### Issue 3: Session Cookie Not Retained Across Domains
* **Cause**: Browsers block cross-site cookies if `SameSite` is not `None` or if the connection is not `Secure` (HTTPS).
* **Fix**: `CivicTaxBackend` automatically sets `sameSite: 'none'` and `secure: true` when `NODE_ENV=production` or running under Vercel, and enables `trust proxy: 1`. Ensure `NODE_ENV=production` is set in Vercel backend environment variables.

### Issue 4: Salesforce OAuth `redirect_uri_mismatch`
* **Cause**: The `SF_REDIRECT_URI` configured in backend environment variables does not match the Callback URL in the Salesforce Connected App.
* **Fix**: Add `https://<your-backend>.vercel.app/auth/salesforce/callback` to the Callback URLs list in Salesforce Setup > App Manager.

---

## 8. Continuous Deployment & Redeployment

Whenever you push commits to GitHub:
* Vercel will automatically trigger atomic preview or production builds for both projects.
* Local development remains 100% functional:
  - Frontend: `npm run dev` (runs on `http://localhost:5173`)
  - Backend: `npm run dev` in `server` (runs on `http://localhost:3001`)
