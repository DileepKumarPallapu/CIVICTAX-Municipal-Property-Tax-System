# CivicTax 3.0 End-to-End Municipal Workflow Mapping

## 1. Cross-Department Lifecycle Pipelines

CivicTax coordinates municipal tasks across multiple specialized departmental actors through sequential, audit-logged pipelines.

---

## 2. Core Operational Workflows

### 2.1 Property Cadastral Pipeline
```
[ Citizen / Registration Dept ]
          │  1. Submit parcel dimensions & ownership deed proof
          ▼
[ Property Ingestion ] ──> Duplicate check (CMP-001) & Plot Bounds check
          │
          ▼
[ Field Verification Dept ]
          │  2. On-site physical survey inspection
          │  3. Dimension verification & photograph comparison
          ▼
[ Zonal Approval ] ──────> Approved ──> Status: VERIFIED ──> Ready for Assessment
                          │
                          └──> Rejected ──> Mandatory Comments ──> Resubmission
```

### 2.2 Annual Tax Assessment Pipeline
```
[ Property Master (VERIFIED) ]
          │
          ▼
[ Assessment & Valuation Dept ]
          │  1. Lookup active Category Tax Rate (Residential, Commercial, Industrial)
          │  2. Compute Base Tax = Built-Up Area × Rate Per Sq Ft
          │  3. Calculate Early-Rebate Discount (-5%) if applicable
          │  4. Ingest Tax_Assessment__c record
          ▼
[ Notification Engine ] ───> Dispatches Demand Statement Notice to Citizen
```

### 2.3 Revenue Collection & Settlement Pipeline
```
[ Citizen Portal ]
          │  1. Reviews Assessment Statement Breakdown
          │  2. Initiates Online Payment (Full / Partial)
          ▼
[ Payment Gateway Proxy ]
          │  3. Validates Idempotency & Prevents Overpayment
          │  4. Ingests Payment Record with Bank Transaction UTR
          ▼
[ Treasury Dept ]
          │  5. Updates Parent Assessment: Amount Paid & Outstanding Balance
          │  6. Generates Official Digital Payment Receipt with QR Code
          ▼
[ Settlement & Audit ] ────> Daily Treasury Ledger Reconciliation
```

### 2.4 Citizen Grievance Redressal Pipeline
```
[ Citizen Portal ] ───> Files Grievance with Category & Supporting Evidence
          │
          ▼
[ Grievance Dept ] ───> Auto-assigned to Zonal Queue based on property zone
          │
          ▼
[ Field Officer ]  ───> Conducts inquiry, logs investigation notes
          │
          ▼
[ Resolution ]     ───> Closes ticket with formal resolution comments
          │             (Citizen can reopen within statutory window if unsatisfied)
```
