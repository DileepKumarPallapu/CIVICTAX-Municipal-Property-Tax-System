# CIVICTAX USECASE_6 Capstone Project Scope & Academic Charter

## 1. Confirmed Project & Student Identity

- **Project Name**: CIVICTAX
- **Full Title**: Property Tax Assessment and Payment Management System
- **Assigned Use Case**: `USECASE_6`
- **Team**: `TEAM_16`
- **Student**: Pallapu Dileep Kumar
- **VTU Number**: `29962`
- **Department**: Computer Science and Engineering
- **Academic Standard**: Salesforce Milestone 1 & Milestone 2 Compliance

---

## 2. Project Mission & Enterprise Platform Role

The primary objective of this capstone is to establish **Salesforce** as the authoritative enterprise business platform for municipal taxation and governance. 

```
+-------------------------------------------------------------------------------+
|                       CIVICTAX PLATFORM RESPONSIBILITY MODEL                  |
+-------------------------------------------------------------------------------+

   [ React Client (Port 5173) ]
     - Professional citizen & officer presentation
     - Responsive mobile PWA & Tamil localization
     - Instant interactive form validations & QR viewer
                 |
                 v (REST / OAuth 2.0 PKCE - Port 3001)
   [ Node.js Express Gateway ]
     - Zero token leakage proxy
     - Session security & Helmet headers
                 |
                 v
   [ SALESFORCE CORE PLATFORM ] <=== AUTHORITATIVE BUSINESS PLATFORM
     - Core Data Model: Custom Objects (Property__c, Tax_Assessment__c, etc.)
     - Standard Objects: Account (Household), Contact (Citizen), Case (Grievance)
     - Security: OWD (Private), Sharing Rules, Permission Sets, FLS
     - Domain Logic: Apex Services (PropertyService, TaxCalculationService, etc.)
     - Data Integrity: Single-Trigger Framework, Pessimistic Locking, ACID DML
     - Automation: Flow Builder & Multi-Step Approval Processes
     - Asynchronous Layer: Queueable, Batch & Schedulable Apex
     - Reporting: Reports & Native Executive Dashboards / LWC
```

---

## 3. Scope of Implemented Modules (USECASE_6)

1. **Property Registration & Cadastral Lifecycle**: Parcel creation, unique reference tracking, plot/built-up area validation, and zonal jurisdiction assignment.
2. **Officer Verification & Sanction**: Field inspector review, document inspection, approval/rejection workflows with mandatory audit notes.
3. **Annual Property Tax Assessment Engine**: Precise mathematical calculations ($\text{Area} \times \text{Rate}$), category rate schedules, early-rebate discounts, and statutory arrears penalties.
4. **Simulated Payment Processing & Receipts**: Idempotent payment recording, ledger rollups, balance updates, and instant QR-verifiable payment receipts.
5. **Grievance Redressal (Standard `Case`)**: Ticket routing, priority categorization, officer inquiry logging, resolution comments, and reopen capabilities.
6. **Reassessment Request Workflow**: Multi-step engineering review and approval process for requested dimension or classification changes.
7. **Municipal Zone & Cadastral Intelligence**: Zonal bounds, rate administration, and geographic parcel distribution.
8. **Administrative Telemetry & Analytics**: Real-time revenue collection benchmarks, arrears aging analysis, and statistical revenue forecasting.
