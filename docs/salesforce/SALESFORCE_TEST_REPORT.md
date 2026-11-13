# CivicTax Salesforce Apex Test Strategy & Verification Report

## 1. Test Architecture & Coverage Principles

CivicTax requires a minimum of $85\%$ Apex test coverage across all domain services, trigger handlers, REST resources, and asynchronous batch jobs, exceeding the standard Salesforce $75\%$ deployment requirement.

---

## 2. Test Suites Implemented

### 2.1 `PropertyServiceTest.cls`
- `testRegisterPropertySuccess`: Validates successful parcel creation and auto-assignment.
- `testDuplicatePropertyNumberPrevented`: Confirms database error when attempting to insert duplicate property number.
- `testBulkPropertyRegistration`: Validates bulk insertion of 200 parcels in a single transaction without governor limit violations.

### 2.2 `TaxCalculationTest.cls`
- `testResidentialCalculation`: Verifies accurate computation of base tax ($1,200\text{ sq ft} \times ₹10 = ₹12,000$).
- `testOverlappingTaxRatePrevented`: Ensures system rejects concurrent active rates for the same category.
- `testPenaltyAndDiscountPrecision`: Confirms mathematical accuracy of early-bird discounts and late penalties down to the cent/paise.

### 2.3 `PaymentServiceTest.cls`
- `testFullPaymentStatusUpdate`: Verifies assessment status transition from `FINALIZED` to `PAID` upon full payment.
- `testPartialPaymentStatusUpdate`: Verifies status transitions to `PARTIALLY_PAID` when outstanding remains.
- `testDuplicateTransactionRejected`: Tests external transaction ID uniqueness constraint.

### 2.4 `CivicTaxRestResourceTest.cls`
- Simulates REST requests with mocked `RestContext.request` and `RestContext.response`.
- Validates JSON deserialization, error response codes, and payload formatting.

---

## 3. Test Execution Status

- **Apex Test Suite Coverage Target**: $\ge 85\%$
- **Governor Limit Checks**: Verified zero SOQL/DML in iterative loops across all classes.
