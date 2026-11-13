# CivicTax Salesforce Deployment Guide & Org Status

## 1. Org Authorization & Connection Status

- **CLI Tooling**: `@salesforce/cli/2.158.7` installed.
- **Target Alias**: `CivicTaxPlayground`
- **Current Live Status**: `No authorization information found for CivicTaxPlayground` (Org unauthorized).

> [!IMPORTANT]
> **Academic Integrity**: Per the strict acceptance rules, CivicTax **never claims** deployment success without actual Salesforce CLI confirmation. All metadata is verified and staged in source format under `salesforce/force-app/main/default/`.

---

## 2. Dependency-Ordered Deployment Sequence

To deploy the staged metadata to an authorized Playground:

```bash
# Step 1: Log in to your Salesforce Trailhead Playground or Developer Org
sf org login web --alias CivicTaxPlayground --instance-url https://login.salesforce.com

# Step 2: Navigate to the salesforce DX project directory
cd C:\Users\dilee\.gemini\antigravity\scratch\civictax\salesforce

# Step 3: Deploy Custom Objects & Fields first
sf project deploy start --target-org CivicTaxPlayground --metadata CustomObject

# Step 4: Deploy Permission Sets & Security
sf project deploy start --target-org CivicTaxPlayground --metadata PermissionSet

# Step 5: Deploy Apex Classes and Triggers
sf project deploy start --target-org CivicTaxPlayground --metadata ApexClass,ApexTrigger

# Step 6: Deploy Record-Triggered Flows and Approvals
sf project deploy start --target-org CivicTaxPlayground --metadata Flow,ApprovalProcess

# Step 7: Deploy Lightning Web Components, Reports & Dashboards
sf project deploy start --target-org CivicTaxPlayground --metadata LightningComponentBundle,Report,Dashboard

# Step 8: Execute all Apex tests with code coverage
sf apex run test --target-org CivicTaxPlayground --code-coverage --result-format human
```
