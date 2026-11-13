# CivicTax 10.0 Cloud & Vercel Deployment Guide

## 1. Deploying the React Frontend to Vercel

The CivicTax frontend is pre-configured for one-click deployment on **Vercel** (`https://vercel.com`):

### Step 1: Push Project to GitHub
Ensure the project is committed to your GitHub repository:
```powershell
git add .
git commit -m "feat: CivicTax 10.0 Final Release"
git push origin main
```

### Step 2: Import into Vercel
1. Log into your Vercel Dashboard.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select your GitHub repository.
4. Framework Preset: **Vite** (auto-detected).
5. Root Directory: `./` (or leave default root).
6. Build Command: `npm run build`
7. Output Directory: `dist`

### Step 3: Configure Environment Variables in Vercel
In the Vercel project settings, set:
- `VITE_DATA_PROVIDER`: `local` (or `salesforce` if backend URL is provided)
- `VITE_BACKEND_URL`: URL of your deployed Express backend (e.g. on Railway/Render)
- `VITE_DEFAULT_LANGUAGE`: `en`

### Step 4: Verification of SPA Rewrites
The project includes `vercel.json` configured with:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This guarantees that sub-routes like `/admin/evidence`, `/transparency`, and `/citizen/properties` load correctly on direct refresh.

---

## 2. Deploying the Express Backend Gateway (Optional for Salesforce Mode)

When deploying the optional Salesforce Gateway:
- **Recommended Host**: Render, Railway, or Heroku (Node.js runtime).
- **Environment Variables**:
  ```ini
  PORT=3001
  NODE_ENV=production
  FRONTEND_URL=https://your-civictax-frontend.vercel.app
  SF_LOGIN_URL=https://login.salesforce.com
  SF_CLIENT_ID=<Your_Consumer_Key>
  SF_CLIENT_SECRET=<Your_Consumer_Secret>
  SF_REDIRECT_URI=https://your-backend.railway.app/auth/salesforce/callback
  SESSION_SECRET=<32_Char_Random_Secret>
  ```
- **Cookie Security**: Set `cookie.secure = true` in `server.ts` for HTTPS production environments.
