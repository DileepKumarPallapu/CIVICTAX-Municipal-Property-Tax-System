# CIVICTAX Acceptance Criteria Specification

This document provides formal Gherkin-style (`Given-When-Then`) acceptance criteria for critical business operations across CivicTax.

---

## 1. Property Registration & Verification

### Scenario AC-01: Successful Citizen Property Registration
- **Given** an authenticated citizen on the "Register Property" page,
- **When** the citizen inputs a built-up area of `1200` sq ft, valid address, category `RESIDENTIAL`, zone `Zone 1`, and a valid deed document reference `DOC-MH-2024-991`,
- **And** clicks "Submit Registration",
- **Then** the system must create a property record with verification status `PENDING`,
- **And** display a success notification with the assigned property number `CT-PROP-...`.

### Scenario AC-02: Rejection of Non-Positive Built-Up Area
- **Given** an authenticated citizen submitting a property registration,
- **When** the citizen inputs `0` or a negative number in the built-up area field,
- **Then** the submission must be blocked with an inline validation error: *"Built-up Area must be strictly greater than zero."*,
- **And** no database or localStorage record may be created.

---

## 2. Tax Assessment & Payment Treasury

### Scenario AC-03: Accurate Tax Computation for Commercial Property
- **Given** an approved commercial property with built-up area `650` sq ft,
- **When** an annual tax assessment bill is generated for rate ₹18/sq ft,
- **Then** the base tax must equal exactly ₹11,700,
- **And** with an early bird rebate of ₹500, total tax demand must equal exactly ₹11,200.

### Scenario AC-04: Prevention of Overpayments
- **Given** a citizen viewing an assessment with an outstanding balance of ₹6,500,
- **When** the citizen attempts to submit a custom payment amount of ₹7,000,
- **Then** the system must reject the transaction,
- **And** display an alert: *"Payment amount (₹7,000) exceeds remaining outstanding balance (₹6,500)."*.

### Scenario AC-05: Partial Payment Balance Rollup
- **Given** an assessment with total tax demand ₹12,500 and ₹0 previously paid,
- **When** the citizen completes a simulated payment of ₹6,000 via UPI,
- **Then** `amountPaid` must update to ₹6,000,
- **And** `outstandingBalance` must update to ₹6,500,
- **And** assessment status must advance to `PARTIALLY_PAID`.

---

## 3. Delinquent Recovery & Privacy

### Scenario AC-06: Arrears Aging Classification
- **Given** an unpaid assessment whose due date was 45 days ago,
- **When** the Revenue Recovery sync evaluates the assessment,
- **Then** it must place the delinquent bill into the `31_60_DAYS` aging bucket,
- **And** assign it a default recovery priority of `HIGH`.

### Scenario AC-07: Public Transparency Zero-PII Enforcement
- **Given** an unauthenticated visitor accessing `/transparency`,
- **When** the public transparency dashboard loads city metrics,
- **Then** the response must contain aggregate zone revenue and collection percentages,
- **And** must contain zero citizen names, mobile numbers, email addresses, or plot identifiers.
