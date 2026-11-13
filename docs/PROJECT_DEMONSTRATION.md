# CivicTax 10.0 Live Project Walkthrough & Faculty Demonstration Script

This document provides a structured, step-by-step walkthrough script for presenting the **CivicTax** project during academic evaluations, viva voce, and technical demonstrations.

---

## 1. Demonstration Outline & Timing

| Segment | Topic | Target Time | Key Features Highlighted |
| :--- | :--- | :--- | :--- |
| **Part 1** | Project Introduction & Architecture | 2 Mins | Problem statement, dual-mode architecture, institutional design |
| **Part 2** | Citizen Portal Experience | 3 Mins | Property registration, assessment viewing, partial payment, receipt download |
| **Part 3** | Municipal Officer Workflow | 3 Mins | Verification inspection, grievance triage, recovery aging |
| **Part 4** | Administrator Command Center | 3 Mins | Real-time analytics, GIS parcel map, forecasting lab, risk compliance |
| **Part 5** | Salesforce Academic Evidence Center | 4 Mins | Milestone 1 & 2 traceability, Apex code, order of execution |

---

## 2. Step-by-Step Demonstration Actions

### Step 1: Landing Page & Public Transparency
1. Open `http://localhost:5173`.
2. Point out the professional municipal landing page, institutional palette (Navy, White, Teal), and feature highlights.
3. Click **Public Transparency** in the top navigation bar.
4. Explain how this view publishes city-wide revenue and zone collection efficiency while strictly sanitizing PII (names, phone numbers) for citizen privacy.

### Step 2: Citizen Flow
1. Click **Sign In** and select **Citizen Demo Account** (`citizen@civictax.demo`).
2. Navigate to **My Properties** $\rightarrow$ view verified residential and commercial parcels.
3. Click **Register Property** $\rightarrow$ show validation rules (positive area, built-up year).
4. Navigate to **Tax Assessments** $\rightarrow$ open a pending tax bill.
5. Click **Pay Now** $\rightarrow$ simulate a partial UPI payment (e.g. ₹5,000).
6. Point out automatic balance recalculation (Total Tax $-$ Amount Paid $=$ Outstanding).
7. Click **Download Receipt** $\rightarrow$ generate official municipal tax receipt.

### Step 3: Officer Flow
1. Log out and switch to **Municipal Officer Account** (`officer@civictax.demo`).
2. Navigate to **Property Verification** $\rightarrow$ review pending registrations with deed references.
3. Approve a pending parcel and record inspection remarks.
4. Navigate to **Revenue Recovery** $\rightarrow$ demonstrate delinquent arrears aging brackets (`1-30`, `31-60`, `61-90`, `> 90` days).
5. Advance a recovery case from `OPEN` to `NOTICE_ISSUED` and click **Export Delinquent Cases (CSV)**.

### Step 4: Administrator Command Center & Smart Tools
1. Log out and switch to **Administrator Account** (`admin@civictax.demo`).
2. Open **Municipal Command Center** $\rightarrow$ demonstrate live aggregate revenue metrics, active zones, and collection velocity.
3. Navigate to **Municipal GIS Map** $\rightarrow$ show spatial parcel markers across Pune zones with category color codes (Residential, Commercial, Industrial).
4. Open **Revenue Forecast Lab** $\rightarrow$ demonstrate statistical projection models (Weighted Moving Average, Linear Trend) with $\pm 12\%$ confidence intervals.
5. Open **Risk & Compliance** $\rightarrow$ explain rule-based audit detections (`RULE_PROP_DEED_CHECK`, `RULE_BASE_TAX_CONSISTENCY`).

### Step 5: Salesforce Academic Evidence Center
1. Navigate to **Academic Evidence** in the Admin sidebar (`/admin/evidence`).
2. Filter between *Milestone 1 (Admin & Config)* and *Milestone 2 (Apex & Automation)*.
3. Open individual requirement cards to show:
   - Target Implementation
   - Metadata / Source Path (`salesforce/force-app/main/default/*`)
   - Test Verification Method
   - Faculty Viva Defense note explaining why the architecture was chosen.
4. Point out the **Salesforce Order of Execution** diagram showing platform transaction lifecycle.
