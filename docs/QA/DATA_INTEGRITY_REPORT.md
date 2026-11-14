# CivicTax 7.0: Data Integrity, Business Rules & Boundary Protection Report

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Date**: November 14, 2026 | **Validation Level**: Strict Invariant Enforcement  

---

## 1. Executive Summary

This report documents the verification of 14 critical data integrity rules, mathematical rounding invariants, and transaction boundary protections in CivicTax 7.0. All boundary guards were validated via automated test assertions in Vitest (`src/__tests__/businessRules.test.ts`, `src/__tests__/workflowsAThroughE.test.ts`, and `server/src/tests/api.test.ts`).

---

## 2. Integrity Rule Verification Matrix

| # | Integrity Guard / Boundary | Test Target | Test Scenario | Verified Outcome |
|---|---|---|---|:---:|
| 1 | **Duplicate Property Registration** | `PropertyRules.ts` & `LocalRepository.ts` | Attempting to register existing `propertyNumber` | **BLOCKED** with `Property already exists` error. |
| 2 | **Missing Mandatory Information** | `municipalRoutes.ts` | Submitting property with empty address or category | **BLOCKED** with HTTP 400 Bad Request. |
| 3 | **Non-Positive Built-Up Area** | `PropertyRules.ts` | Registering built-up area of `0` or `-100` sq.ft | **BLOCKED** with `Built-up area must be > 0`. |
| 4 | **Plot Dimension Boundary** | `PropertyRules.ts` | Built-up area exceeding total land area | **BLOCKED** with plot dimension bounds warning. |
| 5 | **Negative Payment Prevention** | `LocalPaymentService.ts` | Initiating payment of `-₹500` | **REJECTED** with `Amount must be > 0`. |
| 6 | **Overpayment Prevention** | `LocalPaymentService.ts` | Paying ₹10,000 on ₹6,500 outstanding balance | **REJECTED** with `Amount exceeds balance`. |
| 7 | **Duplicate Transaction Prevention** | `LocalRepository.ts` | Re-submitting identical gateway `transactionId` | **BLOCKED** with `Duplicate transaction ID`. |
| 8 | **Illegal State Reversion** | `CivicTaxPropertyTriggerHandler.cls` | Reverting `VERIFIED` property to `PENDING` | **BLOCKED** with trigger state exception. |
| 9 | **Unverified Property Assessment** | `CivicTaxAssessmentService.cls` | Generating tax bill on unverified property | **BLOCKED** with `Property must be Verified`. |
| 10 | **Orphaned Reassessment Prevention** | `LocalReassessmentService.ts` | Reassessment submission without parent `assessmentId` | **BLOCKED** with invalid reference error. |
| 11 | **Grievance Resolution Without Notes** | `CivicTaxGrievanceService.cls` | Resolving grievance with blank remarks | **BLOCKED** with mandatory comments error. |
| 12 | **Document MIME Type Gate** | Digital Vault Engine | Uploading `.exe` or `.sh` script binaries | **REJECTED** by strict MIME allowlist. |
| 13 | **Decimal Rounding Precision** | `TaxCalculationService.ts` | Fractions resulting from cess/rebate math | **ENFORCED** to exactly 2 decimal places. |
| 14 | **Immutable Audit Log Appending** | `StorageService.ts` | Intercepting and appending to activity ledger | **ENFORCED** via append-only array. |

---

## 3. Financial Precision Invariants

To avoid cumulative rounding errors across thousands of municipal parcels:
1. **Currency Invariant**: All intermediate tax values are rounded using banker's half-up precision:
   $$\text{Tax}_{\text{net}} = \text{round}\Big(\text{BaseTax} \times (1 - \text{DiscountRate}) + \text{Penalty}, 2\Big)$$
2. **Balance Conservation**:
   $$\text{Amount Paid} + \text{Outstanding Balance} \equiv \text{Total Assessed Tax}$$
   This identity is verified in automated unit tests after every partial payment transaction.
3. **Concurrency Locking**:
   In Salesforce Apex, payment transactions query `Tax_Assessment__c` using `FOR UPDATE`, preventing simultaneous payments from over-deducting the ledger balance.
