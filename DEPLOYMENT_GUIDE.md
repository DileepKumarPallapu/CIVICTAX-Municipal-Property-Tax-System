# Salesforce CLI Authorization & Browser Troubleshooting Guide

## 1. Diagnostics Findings

During environment inspection, the following diagnostic tests were performed:
- **Salesforce CLI**: `@salesforce/cli/2.158.7 win32-x64 node-v26.13.0` (Installed at `C:\Program Files\sf\bin\sf.cmd`).
- **Network Connectivity**: TCP test to `login.salesforce.com:443` **Succeeded** (`RemoteAddress: 141.163.205.232`).
- **Google Chrome**: Verified installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- **Microsoft Edge**: Verified installed at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
- **Target Org Status**: No authorized org currently bound to alias `CivicTaxPlayground`.

---

## 2. Resolving Browser Redirection Issues in Windows

If standard `sf org login web` does not automatically open Chrome or fails to redirect the local OAuth callback:

### Option A: Force Microsoft Edge via CLI
In PowerShell:
```powershell
$env:SF_WEB_OAUTH_SERVER_TIMEOUT = "300000"
sf org login web --browser edge --alias CivicTaxPlayground --instance-url https://login.salesforce.com --set-default
```

### Option B: Device Login (Headless / Zero-Redirection)
If browser redirection remains blocked by Windows firewall or local port policies, use the device code grant:
```powershell
sf org login device --alias CivicTaxPlayground --instance-url https://login.salesforce.com --set-default
```
1. The CLI will output a user code and a link: `https://login.salesforce.com/setup/connect`.
2. Open Chrome or Edge manually, navigate to that URL, enter the code, and approve.
3. The CLI will detect authorization without requiring a local loopback server.

---

## 3. Deploying CivicTax Metadata to Authorized Org

Once `CivicTaxPlayground` is authorized:
```powershell
cd C:\Users\dilee\.gemini\antigravity\scratch\civictax\salesforce
sf project deploy start --target-org CivicTaxPlayground
```
This deploys the custom objects (`Property__c`, `Tax_Assessment__c`, etc.), Apex services, triggers, and the REST endpoint to your Playground.
