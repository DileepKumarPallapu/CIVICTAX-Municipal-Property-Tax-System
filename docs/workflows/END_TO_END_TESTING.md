# CivicTax 5.0: End-to-End Integration Testing & Verification Scenarios

## 1. Quality Assurance Scope & Test Strategy

This document details the ten comprehensive end-to-end integration test scenarios validating CivicTax 5.0 across all municipal workflows, mathematical formulas, role access boundaries, and operational failure modes.

```
+---------------------------------------------------------------------------------------------------+
|                        CIVICTAX 5.0 VERIFICATION MATRIX (10 CORE SCENARIOS)                       |
+---------------------------------------------------------------------------------------------------+
| TC-01: Happy Path Registration to Payment      | TC-06: Automated Zone & Workload Routing         |
| TC-02: Verification Rejection & Resubmission   | TC-07: Partial Payment & Arrears Roll-Forward    |
| TC-03: Assessment Dispute & Grievance Cycle    | TC-08: Document MIME & SHA-256 Cryptographic Run |
| TC-04: Reassessment & Dual Statutory Approval  | TC-09: Notification Dispatch & Read Lifecycle    |
| TC-05: SLA Breach Detection & Supervisor Alert | TC-10: Audit Log Immutability & Hash Chain Guard |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Test Scenarios

### TC-01: Happy Path Citizen Property Registration to Tax Payment
- **Actor Flow**: Citizen -> Verification Officer -> Revenue Inspector -> Citizen (Payment).
- **Execution Steps**:
  1. Citizen creates draft property in Zone 01 (`Built-up: 1,500 sq.ft`, `Plot: 2,000 sq.ft`, `Category: Residential`).
  2. Uploads Sale Deed PDF (`Deed_Valid.pdf`, 1.8 MB). Submits registration.
  3. Verification Officer inspects ground measurements; marks status as `VERIFIED`.
  4. System executes deterministic calculation: Base Value = ₹18,000, Rebate = ₹1,800, Cess = ₹810, Total = ₹17,010.
  5. Citizen initiates payment via simulated NetBanking gateway.
  6. Payment status transitions: `Initiated` -> `Success`. Receipt `RCT-2026-00412` generated and downloaded.
- **Pass Criteria**: Property state = `ACTIVE`; Assessment state = `PAID`; Balance = ₹0.00; Receipt checksum matches.

### TC-02: Field Verification Rejection with Resubmission Workflow
- **Actor Flow**: Citizen -> Verification Officer -> Citizen -> Verification Officer.
- **Execution Steps**:
  1. Citizen registers property declaring `Built-up: 800 sq.ft`.
  2. Verification Officer inspects site; measures actual built-up area as `1,450 sq.ft` (+650 sq.ft undeclared).
  3. Officer rejects verification with structured reason code `ERR-DIM-MISMATCH` and inspection photo proof.
  4. Property state transitions to `CORRECTION_REQUIRED`. In-App alert sent to Citizen.
  5. Citizen corrects dimensions to `1,450 sq.ft`, uploads revised building plan, and resubmits.
  6. Officer conducts desk review and approves.
- **Pass Criteria**: Resubmission clears previous rejection flag; audit trail records both rejection and subsequent approval.

### TC-03: Assessment Dispute & Grievance Resolution Cycle
- **Actor Flow**: Citizen -> Grievance Officer -> Revenue Section Head.
- **Execution Steps**:
  1. Citizen disputes residential tax assessment claiming incorrect commercial rate application.
  2. Ticket `GRV-2026-00319` generated with Category `Assessment Error` and 48-hour SLA clock.
  3. Grievance Officer reviews property title and confirms purely residential electricity bill.
  4. Officer proposes resolution: "Reclassify to Residential; recompute tax bill."
  5. Citizen accepts proposed resolution within 24 hours.
  6. System voids initial bill and generates revised bill reflecting correct rebate.
- **Pass Criteria**: Grievance state = `CLOSED_RESOLVED`; CSAT score = 5 Stars; revised assessment reflects ₹6,400 reduction.

### TC-04: Property Reassessment Request with Two-Step Statutory Approval
- **Actor Flow**: Citizen -> Senior Surveyor (Step 1) -> Municipal Commissioner (Step 2).
- **Execution Steps**:
  1. Citizen submits reassessment request to add First Floor extension (`+600 sq.ft`).
  2. Senior Surveyor reviews ground plan; approves Step 1 with statutory note.
  3. Workflow escalates to Municipal Commissioner queue for Step 2 final approval.
  4. Commissioner approves; system triggers `TaxCalculationService.cls`.
  5. Old assessment (₹12,500) superseded; New assessment (₹18,200) generated. Supplemental bill of ₹5,700 issued.
- **Pass Criteria**: Both approvals recorded in sequential approval history; Supplemental Arrears Bill created with 30-day payment window.

### TC-05: SLA Breach Detection and Tier-2 Supervisor Escalation Trigger
- **Actor Flow**: Background Cron Engine -> Department Supervisor.
- **Execution Steps**:
  1. High-priority grievance (`GRV-2026-00108`) created with 24-hour SLA.
  2. Test harness accelerates simulated clock by 18 hours: Tier 1 Warning emitted to assigned officer.
  3. Simulated clock advances to 25 hours (Breach state).
  4. Background SLA monitor executes: flags record as `SLA_BREACHED`.
  5. Instant alert emitted to Zonal Supervisor with red badge indicator.
- **Pass Criteria**: Record state updated to `BREACHED`; breach timestamp logged; single deduplicated supervisor alert delivered.

### TC-06: Automated Zone-Based Task Assignment to Inspector Queue
- **Actor Flow**: Citizen Registration -> Task Routing Engine.
- **Execution Steps**:
  1. Property submitted in `Zone 03 (North Sector)`.
  2. Engine queries active officer workloads in Zone 03: Officer A (8 active tasks), Officer B (4 active tasks).
  3. Engine routes verification task to Officer B (least loaded).
  4. Officer B's "My Tasks" queue increments from 4 to 5; In-App notification emitted.
- **Pass Criteria**: Workload balance verified; task assigned without manual supervisor triage.

### TC-07: Partial Payment and Arrears Roll-Forward Calculation
- **Actor Flow**: Citizen -> Payment Service.
- **Execution Steps**:
  1. Property assessed at ₹24,000 for FY 2026-27.
  2. Citizen pays partial amount of ₹10,000.
  3. System records partial receipt; updates Outstanding Balance to ₹14,000.
  4. Status transitions to `PARTIALLY_PAID`.
  5. Subsequent payment of ₹14,000 initiated and confirmed.
  6. Final status transitions to `FULLY_PAID`; balance becomes ₹0.00.
- **Pass Criteria**: No duplicate payment generated; ledger accounts balance across two distinct transaction receipts.

### TC-08: Document Upload Validation and Cryptographic Hash Check
- **Actor Flow**: Citizen -> Document Vault Engine.
- **Execution Steps**:
  1. Citizen uploads valid PDF `Sale_Deed.pdf` (2.4 MB). Engine computes SHA-256: `e3b0c442...` and stores record.
  2. Citizen attempts to upload executable file `Malicious.exe` (Renamed as `Plan.pdf.exe`). Engine rejects MIME type.
  3. Citizen attempts to upload 8.2 MB file. Engine rejects with `MAX_SIZE_EXCEEDED (5MB Limit)`.
- **Pass Criteria**: Valid files accepted with checksum; invalid MIME types and oversized binaries strictly rejected.

### TC-09: Notification Dispatch & Read Receipt Lifecycle
- **Actor Flow**: Municipal System -> Citizen Notification Bell.
- **Execution Steps**:
  1. Tax bill generated; engine enqueues notification `NOTIF-2026-00412`.
  2. Bell unread badge counter increments to 1.
  3. Citizen opens notification pane; clicks deep link to view bill.
  4. Notification state updates from `DELIVERED` to `READ`; badge counter decrements to 0.
- **Pass Criteria**: Delivery state machine transitions properly; idempotency check prevents duplicate notifications on page refresh.

### TC-10: Immutable Audit Trail Verification under High-Frequency DML
- **Actor Flow**: Test Harness -> Audit Ledger Service.
- **Execution Steps**:
  1. Test script triggers 50 rapid sequential status mutations across 10 properties.
  2. Audit service records 50 entries, each with actor, timestamp, previous state, new state, and hash chain.
  3. Test script attempts to execute direct `DELETE FROM Audit_Log` or `UPDATE Audit_Log`.
- **Pass Criteria**: All 50 entries persisted in strict sequential order; update/delete operations throw fatal security exception.

---

## 3. Academic Faculty Viva Demonstration Script

```
+---------------------------------------------------------------------------------------------------+
|                            VIVA DEMONSTRATION WORKFLOW (5-MINUTE RUN)                             |
+---------------------------------------------------------------------------------------------------+
| 00:00 - 01:00 : Architecture & Dual-Mode Decoupling (Salesforce Core vs Local Repository fallback)|
| 01:00 - 02:00 : Citizen Registration, Document Vault Upload & SHA-256 Checksum Validation         |
| 02:00 - 03:00 : Field Verification, Automated Tax Calculation Formula, Early Payment Rebate       |
| 03:00 - 04:00 : Payment Gateway Settlement, Instant Receipt Generation & CiviAssist QA           |
| 04:00 - 05:00 : Municipal Command Center KPI Analytics, SLA Escalation & Immutable Audit Ledger   |
+---------------------------------------------------------------------------------------------------+
```
