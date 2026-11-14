# CivicTax 7.0: Academic Faculty Capstone Demonstration Runbook

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Demonstration Time**: 10–15 Minutes | **Mode**: Live Interactive Web UI + Express Gateway  

---

## 1. Demonstration User Personas & Safe Demo Credentials

The application includes pre-configured, safe demonstration accounts that switch instantly using the top navigation user menu without requiring real production credentials:

| Role | Persona Name | Demo Login Email | Primary Workspace Route |
|---|---|---|---|
| **System Administrator** | Dr. Arvind S. Deshmukh | `admin@civictax.demo` | `/admin/command-center` |
| **Verification Officer** | Priya V. Sundaram | `officer.ver@civictax.demo` | `/officer/verification` |
| **Assessment Officer** | Ramesh C. Patel | `officer.asm@civictax.demo` | `/officer/assessment` |
| **Revenue Officer** | Sunita Narayanan | `officer.rev@civictax.demo` | `/officer/payments` |
| **Grievance Officer** | Vikramjit Singh | `officer.grv@civictax.demo` | `/officer/grievances` |
| **Citizen (Property Owner)**| Rajesh Kumar Sharma | `citizen@civictax.demo` | `/citizen` |

---

## 2. 16-Step Step-by-Step Viva Demonstration Script

```
+---------------------------------------------------------------------------------------------------+
|                         CIVICTAX 7.0 CAPSTONE LIVE PRESENTATION FLOW                              |
+---------------------------------------------------------------------------------------------------+
| Phase A (Min 0-3)   : System Overview, Command Center KPIs & Dual-Mode Decoupling                |
| Phase B (Min 3-6)   : Citizen Property Registration, Document Vault Upload & Verification         |
| Phase C (Min 6-9)   : Statutory Tax Assessment, UAV Rate Math & Simulated UPI Settlement          |
| Phase D (Min 9-12)  : Citizen Grievance Resolution, Reassessment Versioning & Immutable Audit    |
| Phase E (Min 12-15) : Salesforce Integration Architecture, SFDX Metadata & Question Defense       |
+---------------------------------------------------------------------------------------------------+
```

### Step 1: Administrator Reviews Command Center
- Navigate to `/admin/command-center`.
- Highlight live municipal metrics: Total Properties (2), Verified Properties (2), Assessed Tax (₹23,700), Revenue (₹6,000), Collection Efficiency (25.32%).
- Explain that all statistics derive directly from genuine record aggregations, not hardcoded mock numbers.

### Step 2: Citizen Registers a New Property
- Switch persona to **Citizen** (`citizen@civictax.demo`).
- Navigate to `/citizen/register`.
- Enter details: Plot Area: `2,000 sq.ft`, Built-up: `1,500 sq.ft`, Category: `Residential`, Zone: `Zone 1`.
- Upload deed document and click **Submit Registration**.
- Show that status is set to `PENDING` and a unique property number is generated (`CT-PROP-2026-XXXXX`).

### Step 3: Registration & Verification Review
- Switch persona to **Verification Officer** (`officer.ver@civictax.demo`).
- Navigate to `/officer/verification`.
- Open the newly submitted property docket. Inspect dimensions and document hash.

### Step 4: Verification Officer Approves Property
- Click **Verify Property**. Enter remarks: `"Field survey conducted; physical dimensions match registered deed."`
- Submit approval. Status transitions to `VERIFIED`.

### Step 5: Assessment Officer Calculates Tax
- Switch persona to **Assessment Officer** (`officer.asm@civictax.demo`).
- Navigate to `/officer/assessment`.
- Click **Generate Assessment** for the newly verified property.
- Demonstrate the Unit Area Value formula: $1500 \text{ sq.ft} \times ₹10 = ₹15,000$.
- Show prompt-payment 5% rebate ($₹750$). Net assessed tax: $₹14,250$.

### Step 6: Department Head Approves Assessment
- Review assessment docket and click **Approve & Publish**.
- Status transitions to `APPROVED`; bill becomes legally payable.

### Step 7: Citizen Views Tax Demand
- Switch persona back to **Citizen** (`citizen@civictax.demo`).
- Navigate to `/citizen/assessments`.
- Click the newly generated assessment to inspect itemized tax demand and statutory due date.

### Step 8: Citizen Executes Simulated Payment
- Click **Pay Tax Now**.
- Point out the clear UI label: **"Verified Simulation Gateway"**.
- Select **UPI** as payment method. Enter simulated VPA (`rajesh@okaxis`).
- Click **Confirm Payment (₹14,250)**.
- Show instant confirmation screen and download the PDF receipt (`RCP-2026-XXXXX`).

### Step 9: Revenue Officer Verifies Collection
- Switch persona to **Revenue Officer** (`officer.rev@civictax.demo`).
- Navigate to `/officer/payments`.
- Verify the newly recorded transaction in the central revenue ledger with UTR reference.

### Step 10: Citizen Lodges a Grievance
- Switch persona to **Citizen**. Navigate to `/citizen/grievances`.
- Click **Lodge Grievance**. Category: `Calculation Inquiry`.
- Description: `"Request confirmation of 5% rebate calculation."`
- Submit ticket. Reference number `GRV-2026-XXXXX` generated.

### Step 11: Grievance Officer Resolves Ticket
- Switch persona to **Grievance Officer** (`officer.grv@civictax.demo`).
- Navigate to `/officer/grievances`.
- Open ticket. Enter resolution comments: `"Rebate confirmed per Ward 4 schedule."`
- Click **Resolve Grievance**. Ticket status transitions to `RESOLVED`.

### Step 12: Citizen Submits Reassessment Request
- Switch persona to **Citizen**. Navigate to `/citizen/reassessments`.
- Click **Request Reassessment**. Select original assessment.
- Enter reason: `"Demolition of outhouse - reduce built-up area to 1,200 sq.ft."`
- Submit request. Status transitions to `SUBMITTED`.

### Step 13: Officer Adjudicates Reassessment
- Switch persona to **Assessment Officer**. Navigate to `/officer/reassessments`.
- Open docket. Click **Approve Reassessment**.
- Show that a new revised assessment bill is generated with suffix `-R`, preserving original records intact.

### Step 14: Auditor Inspects Immutable Audit Trail
- Switch persona to **System Administrator**.
- Navigate to `/admin/audit`.
- Review the chronologically ordered activity ledger showing every single action performed during steps 2–13 with actor ID, timestamp, and action code.

### Step 15: Administrator Reviews Reports & Exports
- Navigate to `/admin/reports`.
- Showcase the 8 operational reports (Zonal breakdown, collection efficiency, overdue dues).
- Click **Export CSV** to demonstrate data portability.

### Step 16: Salesforce Integration Defense & Architecture
- Navigate to `/admin/salesforce`.
- Honestly explain the dual-mode architecture:
  - If Playground is connected: Live org identity and sync metrics are displayed.
  - If Playground is not connected: Transparently demonstrate the standby state and show the complete SFDX metadata tree staged under `salesforce/force-app/main/default/`.
