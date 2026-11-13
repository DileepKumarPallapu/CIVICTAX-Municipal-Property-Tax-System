# CIVICTAX Functional Requirements Specification (FRS)

This document specifies the functional requirements for CivicTax using unique identifiers (**FR-001** through **FR-030**).

| Requirement ID | Module / Domain | Functional Specification Statement | Target Persona | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Property Registration | A citizen can submit a new property registration specifying address, category, built-up area, zone, construction year, and deed document reference. | Citizen | High |
| **FR-002** | Duplicate Prevention | The system must prevent duplicate property registration based on unique `Property_Number__c` and title deed index number. | System | Critical |
| **FR-003** | Area Validation | Built-up area must be strictly greater than zero square feet; non-positive or blank inputs must be rejected with validation errors. | System | Critical |
| **FR-004** | Construction Year Rule | Construction year cannot exceed the current calendar year. | System | High |
| **FR-005** | Officer Verification | An authorized municipal officer can review a pending property registration, inspect uploaded deed details, and update status to `VERIFIED`, `REJECTED`, or `RESUBMISSION_REQUIRED`. | Officer | High |
| **FR-006** | Assessment Generation | Only verified properties can receive active annual tax assessments. Draft properties cannot generate payable assessment bills. | Officer, System | Critical |
| **FR-007** | Authoritative Tax Math | Base tax must be computed as: $\text{Base Tax} = \text{Built-Up Area} \times \text{Gazette Rate per Sq Ft}$. | System | Critical |
| **FR-008** | Category Multipliers | The system must apply category-specific gazette rates (Residential = ₹10/sq ft, Commercial = ₹18/sq ft, Industrial = ₹24/sq ft). | System | Critical |
| **FR-009** | Early Bird Rebate | If a tax bill is paid in full before the early incentive deadline, an automatic 5% rebate discount must be applied. | System | Medium |
| **FR-010** | Overdue Penalty | If payment is settled after the statutory due date, a mandatory 5% late penalty surcharge must be added to the total assessment amount. | System | High |
| **FR-011** | Payment Simulation | A citizen can simulate payment of an assessment using UPI, Net Banking, or Credit/Debit Card in full or partial amounts. | Citizen | High |
| **FR-012** | Overpayment Guard | Payment amount cannot exceed the current remaining outstanding balance of the assessment. | System | Critical |
| **FR-013** | Balance Recalculation | Successful payment settlement must atomically increment `Amount_Paid__c` and reduce `Outstanding_Amount__c` on the parent assessment. | System | Critical |
| **FR-014** | Status Advancement | When the outstanding balance reaches zero, assessment status must advance to `PAID`. If balance remains $>0$, status must be `PARTIALLY_PAID`. | System | High |
| **FR-015** | Digital Receipts | Upon successful transaction settlement, the citizen must be provided an official downloadable receipt containing transaction ID, timestamp, and QR reference. | Citizen | High |
| **FR-016** | Failed Payment Isolation | Simulated failed payments must never increment collected revenue totals or decrease outstanding tax balances. | System | Critical |
| **FR-017** | Citizen Grievances | A citizen can lodge a municipal grievance ticket selecting subject, category, description, and priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). | Citizen | High |
| **FR-018** | Grievance Resolution | An authorized officer can triage open grievances, record investigation comments, and advance status to `RESOLVED` with an immutable resolution timestamp. | Officer | High |
| **FR-019** | Reassessment Appeals | A citizen can submit a reassessment appeal specifying the target assessment, disputed valuation, and detailed appeal grounds. | Citizen | High |
| **FR-020** | Arrears Aging Buckets | Unpaid assessments must be dynamically categorized into 4 aging default brackets: `1-30 Days`, `31-60 Days`, `61-90 Days`, and `> 90 Days`. | System | High |
| **FR-021** | Recovery Case Actions | Recovery officers can triage delinquent cases, assign ward inspectors, advance case statuses, and export delinquent lists to CSV. | Officer | High |
| **FR-022** | Rule Compliance Engine | The system must evaluate explainable integrity rules (`RULE_PROP_DEED_CHECK`, `RULE_BASE_TAX_CONSISTENCY`, `RULE_OVERPAYMENT_DETECTION`) and flag anomalies. | System | High |
| **FR-023** | Municipal GIS Mapping | Municipal officers and administrators can view registered properties as interactive spatial markers color-coded by category with parcel popups. | Officer, Admin | High |
| **FR-024** | Revenue Forecasting | Administrators can run statistical revenue projections (Weighted Moving Average, Simple Moving Average, Linear Trend) with $\pm 12\%$ confidence bounds. | Admin | High |
| **FR-025** | Public Open Data | The system must provide a public transparency portal publishing ward-level collection efficiencies and revenue shares while strictly omitting PII. | Public | High |
| **FR-026** | Bilingual Switching | The user interface must support instant client-side switching between English and Tamil (தமிழ்) across all navigation paths and metrics. | All Personas | Medium |
| **FR-027** | Audit Trail Logging | Every data mutation (property approval, tax payment, grievance resolution) must record an immutable audit entry with actor, timestamp, and delta. | System | Critical |
| **FR-028** | Command Center Oversight | Administrators can inspect live city-wide municipal performance, active zones, revenue targets, and collection velocity in real time. | Admin | High |
| **FR-029** | Academic Evidence Matrix | The system must provide an interactive matrix mapping Milestone 1 and Milestone 2 concepts to source files, tests, and viva defense notes. | Admin, Faculty | High |
| **FR-030** | Dual-Mode Data Isolation | The application must allow switching between `local` and `salesforce` modes without mixing demonstration records with live Salesforce cloud records. | Admin, System | Critical |
