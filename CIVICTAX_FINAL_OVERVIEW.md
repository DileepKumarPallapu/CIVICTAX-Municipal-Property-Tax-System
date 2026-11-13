# CIVICTAX 6.0 — Enterprise Release Candidate Overview

> **Product**: CIVICTAX (Property Tax Assessment and Payment Management System)  
> **Release Candidate**: Version 6.0.0-RC  
> **Target Audience**: Urban Local Bodies (Municipal Corporations), Evaluators, Citizens, Revenue Officers, System Administrators.

---

## 1. Executive Summary
CIVICTAX 6.0 is an enterprise municipal property tax administration platform. Designed as a complete digital municipal governance system, CivicTax streamlines citizen parcel registrations, physical/title deed inspections, formula-driven tax assessment generation, simulated online collections, multi-stage grievance resolution, and traceable reassessments.

Built with a decoupled **Service Factory Pattern**, CivicTax runs entirely independently during Phase 1 with persistent local storage, while remaining 100% prepared for future integration with **Salesforce Lightning Platform**, **Apex REST**, and **Salesforce Custom Objects**.

---

## 2. Platform Architecture & Portals

### 🏡 Citizen Portal (`/citizen`)
- **Self-Service Parcel Registration**: Complete title deed input with automatic duplicate parcel detection.
- **Verification Tracking**: Real-time inspection state with officer notes.
- **Tax Assessments**: Annual assessment breakdown showing base tax, penalties, and early discounts.
- **Payment Portal**: Simulated online payment checkout (UPI, Cards, Net Banking) with zero duplicate transactions and instant printable e-challan receipts.
- **5-Stage Grievance Tracking**: Stage-by-stage progression from `SUBMITTED` to `RESOLVED`.
- **Reassessment Disputes**: Traceable reassessment filing creating revised bills without altering historical records.
- **Smart Assistant (CiviAssist)**: Rule-based assistant providing accurate, personalized answers regarding citizen dues and navigation.

### 👮 Municipal Officer Portal (`/officer`)
- **Zone Inspection Queue**: Filtered queue of assigned properties awaiting physical/title audit.
- **Deed Verification Engine**: Approve or reject registrations with recorded reason codes.
- **Assessment Generation**: Instant annual tax generation using municipal gazette rates.
- **Reassessment Adjudication**: Review citizen revaluation claims and issue revised assessments.
- **Grievance Triage**: Officer case notes, assignment, and formal closure summaries.

### 💼 Administrator Portal (`/admin`)
- **Municipal Command Center (`/admin/command-center`)**: Multi-filter operational overview with real-time Gross Assessed, Revenue Collected, and Collection Efficiency % KPIs.
- **User Directory**: Governance of system users, role authorizations, and officer zone assignments.
- **Municipal Zone Setup**: Ward demarcation and revenue collection targets.
- **Gazette Tax Rate Configuration**: Category-wise and zone-wise rate schedules (`₹/sq ft`).
- **Immutable Audit Trail Ledger (`/admin/audit`)**: Audit log tracking administrative actions, payments, and approvals with sanitized CSV download.
- **System Maintenance**: Operational parameters and emergency database reset with confirmation dialog.

---

## 3. Technology Stack & Verification
- **Frontend Core**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Data Visualization**: Recharts for responsive municipal yield and workload charts.
- **Form & Validation**: React Hook Form with Zod schema validation.
- **Motion & Interaction**: Framer Motion for hardware-accelerated transitions.
- **Automated Tests**: Vitest suite with **16 passed out of 16 tests** (100% passing).
- **Vite Production Bundler**: Zero errors, zero warnings.
