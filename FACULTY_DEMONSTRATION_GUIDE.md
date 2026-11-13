# CIVICTAX 6.0 — Complete Faculty Demonstration Guide

This guide provides a structured, live presentation walkthrough for faculty evaluation.

---

## 🏛️ PART 1: Project Introduction & Problem Statement
- **Problem Statement**: Municipal local bodies face revenue leakages, opaque manual square-foot calculations, long property verification backlogs, disjointed payment reconciliations, and lack of citizen grievance transparency.
- **CivicTax Solution**: A centralized digital governance platform featuring role-based portals for Citizens, Municipal Officers, and Administrators.
- **Technology Highlights**: Clean architecture with React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, and a decoupled Service Factory pattern ready for future Salesforce deployment.

---

## 🏡 PART 2: Citizen Portal Walkthrough
1. **Login as Citizen**:
   - Navigate to `/login`, click the **Citizen** preset card (`citizen@civictax.demo` / `Citizen@123`).
2. **Register a Property**:
   - Open **Register Property** (`/citizen/register-property`).
   - Enter owner name, built-up area (e.g. `1400` sq ft), select Zone 1, and title deed `DOC-MH-EVAL-2026`.
   - Submit: Notice the property appears with status `PENDING` and duplicate detection safeguards are active.
3. **CiviAssist Assistant Demo**:
   - Click the floating **CiviAssist** launcher (bottom-right).
   - Ask: *"How much tax do I owe?"*
   - Observe the personalized response displaying the exact outstanding Rupee balance and a direct navigation button.

---

## 👮 PART 3: Municipal Officer Portal Walkthrough
1. **Login as Officer**:
   - Switch to **Officer** preset (`officer@civictax.demo` / `Officer@123`).
2. **Verify Property**:
   - Open **Property Verification** (`/officer/verification`).
   - Inspect the deed reference of the newly registered parcel and click **Approve Registration**.
   - Notice the status badge immediately updates to `VERIFIED`.
3. **Generate Tax Assessment**:
   - Open **Assessment Review** (`/officer/assessments`).
   - Select the newly verified property and generate an annual assessment for FY 2024-25.
   - Point out that the system applies the configured municipal gazette rate (`₹10/sq ft` for Residential).

---

## 💳 PART 4: Payment Simulation & Receipt
1. **Switch Back to Citizen**:
   - Open **Payment Portal** (`/citizen/payments`).
   - Notice the newly generated bill is listed. Select it.
   - Choose **UPI** simulation and pay a partial amount (e.g. ₹5,000).
2. **Official Printable Receipt**:
   - Note the confetti celebration and open the **Receipt Viewer**.
   - Point out the formal municipal seal, transaction ID (`TXN-`), receipt number (`RCP-`), and remaining balance. Click **Print Receipt** to display the browser print layout.

---

## 💼 PART 5: Administrator Command Center & Audit Trail
1. **Login as Administrator**:
   - Switch to **Admin** preset (`admin@civictax.demo` / `Admin@123`).
2. **Municipal Command Center**:
   - Open **Command Center** (`/admin/command-center`).
   - Show interactive filters: toggle by Zone or Category and observe that Gross Assessed, Revenue Collected, and Collection Efficiency % recalculate dynamically from stored records.
3. **Immutable Audit Trail Ledger**:
   - Open **Audit Trail Ledger** (`/admin/audit`).
   - Highlight that every previous action (citizen registration, officer approval, tax assessment, and payment) is logged with an immutable actor and timestamp. Click **Export Audit Ledger CSV** to demonstrate sanitized spreadsheet export.

---

## 🎓 Evaluator Quick Tooling
- The floating **Faculty Demo Guide** widget (top-right pill) is active on every screen, allowing evaluators to jump directly between the 8 core demo steps with one click.
