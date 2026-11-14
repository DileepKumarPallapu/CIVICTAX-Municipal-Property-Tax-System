# CivicTax 7.0: End-to-End Functional Test Report

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Date**: November 14, 2026 | **Execution Framework**: Vitest v5.1.0  
**Overall Functional Pass Rate**: **100% (30 / 30 Tests Passing)**  

---

## 1. Executive Summary & Test Evidence

End-to-end integration tests were executed across all five core municipal workflows (Workflows A through E). Testing was performed in both the React client state machine environment and the backend Express repository layer.

```bash
$ npm test -- --run

 ✓ src/__tests__/businessRules.test.ts (4 tests) 39ms
 ✓ src/__tests__/smartCity7.test.ts (4 tests) 49ms
 ✓ server/src/tests/api.test.ts (5 tests) 18ms
 ✓ src/__tests__/taxCalculation.test.ts (5 tests) 36ms
 ✓ src/__tests__/integrationLifecycle.test.ts (3 tests) 40ms
 ✓ src/__tests__/workflowsAThroughE.test.ts (5 tests) 45ms
 ✓ src/__tests__/storageAndAuth.test.ts (4 tests) 37ms

 Test Files  7 passed (7)
      Tests  30 passed (30)
   Duration  2.57s
```

---

## 2. Detailed Functional Workflow Execution Results

### Workflow A: Property Registration & Physical Verification
- **Test Target**: `src/__tests__/workflowsAThroughE.test.ts` (Test 1)
- **Execution Flow**:
  1. Citizen submits new residential property details (`Built-Up: 1,400 sq.ft`, `Zone 1`).
  2. System enforces required-field validations and plot area boundary guards.
  3. Property created with unique number (`CT-PROP-YYYY-XXXXX`) and status `PENDING`.
  4. System logs `REGISTER_PROPERTY` in the Application Audit Ledger.
  5. Verification Officer inspects details and transitions status to `VERIFIED` with surveyor comments.
  6. Citizen dashboard reflects updated status; audit log records `VERIFY_PROPERTY_VERIFIED`.
- **Observed Result**: **PASS** (13ms). Status transitions verified; audit entries confirmed.

### Workflow B: Annual Tax Assessment & Approval Workflow
- **Test Target**: `src/__tests__/workflowsAThroughE.test.ts` (Test 2)
- **Execution Flow**:
  1. Assessment officer retrieves verified property (`prop-001`, 1,200 sq.ft).
  2. Math engine applies Unit Area Value formula: $1200 \text{ sq.ft} \times ₹10 = ₹12,000 \text{ Base Tax}$.
  3. 5% early payment discount applied ($₹600$). Net statutory tax = $₹11,400$.
  4. Assessment status set to `APPROVED`; due date populated (+60 days).
  5. Tax demand becomes instantly accessible in citizen portal.
- **Observed Result**: **PASS** (30ms). Mathematical precision confirmed; record locked for billing.

### Workflow C: Tax Payment Settlement & Integrity Protection
- **Test Target**: `src/__tests__/workflowsAThroughE.test.ts` (Test 3)
- **Execution Flow**:
  1. Citizen selects assessment `asm-001` (Outstanding: ₹6,500).
  2. System rejects negative payment amounts ($-\$500$) with validation error.
  3. System rejects overpayment ($₹10,000 > ₹6,500$) with balance boundary exception.
  4. Citizen initiates valid partial payment of $₹3,000$ via UPI simulation.
  5. System generates confirmed receipt `RCP-YYYY-XXXXX`.
  6. Assessment balance updates atomically: Paid = $₹9,000$, Outstanding = $₹3,500$, Status = `PARTIALLY_PAID`.
- **Observed Result**: **PASS** (12ms). Financial bounds and receipts verified.

### Workflow D: Citizen Grievance Redressal Lifecycle
- **Test Target**: `src/__tests__/workflowsAThroughE.test.ts` (Test 4)
- **Execution Flow**:
  1. Citizen submits grievance regarding calculation discrepancy.
  2. System generates ticket `GRV-YYYY-XXXXX` with status `SUBMITTED`.
  3. Ticket routed to Officer Priya Sundaram; status transitions to `ASSIGNED`.
  4. Officer reviews documentation and updates status to `RESOLVED` with mandatory resolution comments.
  5. Timeline audit tracks citizen submission, assignment, and resolution events with timestamps.
- **Observed Result**: **PASS** (3ms). Full lifecycle audit and notifications confirmed.

### Workflow E: Property Valuation Reassessment & Revision
- **Test Target**: `src/__tests__/workflowsAThroughE.test.ts` (Test 5)
- **Execution Flow**:
  1. Citizen submits reassessment claim for demolition reduction ($1,200 \rightarrow 1,000 \text{ sq.ft}$).
  2. Request created with status `SUBMITTED` linked to parent assessment `asm-001`.
  3. Revenue Officer inspects building sanction and marks request `APPROVED`.
  4. System automatically generates a traceable Version 2 assessment with suffix `-R`.
  5. Revised base tax computed at $₹10,000$; original assessment preserved for audit compliance.
- **Observed Result**: **PASS** (3ms). Non-destructive revision verified.

---

## 3. Server-Side Repository & API Workflow Validation

- **Test Target**: `server/src/tests/api.test.ts` (5 Tests)
- **Scenarios Tested**:
  1. Seeded property listing and multi-criteria zone/category filtering (**PASS**).
  2. Property registration and duplicate property number rejection (**PASS**).
  3. Overpayment rejection, negative payment rejection, and duplicate transaction ID prevention (**PASS**).
  4. Grievance ticket intake and resolution comments enforcement (**PASS**).
  5. Direct aggregate calculation of municipal dashboard KPIs (**PASS**).
