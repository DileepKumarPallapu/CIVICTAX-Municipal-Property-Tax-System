# CivicTax User Operations Manual & User Guide

## 1. Getting Started

CivicTax offers a unified interface for Citizens, Municipal Officers, and Municipal Administrators.

### Logging into CivicTax
1. Navigate to `http://localhost:5173/login`.
2. Select one of the quick demo profiles:
   - **Citizen**: `citizen@civictax.org` (Simulates registered property taxpayer).
   - **Municipal Officer**: `officer@civictax.org` (Simulates Revenue Inspector).
   - **Administrator**: `admin@civictax.org` (Simulates Municipal Commissioner / IT Admin).
3. Click **"Sign In"**.

---

## 2. Citizen Workflows

### 2.1 Registering a New Property
1. Click **"Register Property"** on the citizen navigation sidebar.
2. Complete property details:
   - Door / Survey Number.
   - Property Category (`Residential`, `Commercial`, `Industrial`).
   - Municipal Zone (`Zone 1 (T. Nagar)`, `Zone 2 (Adyar)`, etc.).
   - Built-up Area and Plot Area in Square Feet.
   - Upload ownership deed proof reference.
3. Review submission and click **"Submit for Verification"**. A unique reference (e.g. `PROP-2026-00412`) is generated.

### 2.2 Paying Property Tax
1. Navigate to **"My Assessments"**.
2. Select an outstanding assessment statement.
3. Click **"Pay Tax"** to launch the secure checkout dialog.
4. Select payment method (`UPI`, `Net Banking`, `Card`) and complete simulated payment.
5. Download the instant **Digital Payment Receipt** with embedded verification QR code.

### 2.3 Submitting a Grievance
1. Navigate to **"Grievances" > "File New Grievance"**.
2. Select your registered property and grievance category (`Tax Calculation`, `Payment Issue`, etc.).
3. Enter subject and details. Submit to receive tracking number (e.g. `GRV-00109`).

---

## 3. Municipal Officer Workflows

1. **Property Verification**: Navigate to **"Pending Verifications"**. Review citizen-uploaded dimensions and deeds. Click **"Approve & Certify"** or **"Reject with Comments"**.
2. **Grievance Investigation**: Inspect assigned citizen grievances, record field survey notes, and provide formal resolution comments.

---

## 4. Administrator Workflows

1. **Command Center**: View real-time municipal tax collection rates, zonal breakdown, and revenue trends.
2. **Tax Rate Configuration**: Configure rate per square foot across property categories and set effective fiscal dates.
3. **Data Import/Export**: Upload bulk CSV records for properties and zones with schema validation.
