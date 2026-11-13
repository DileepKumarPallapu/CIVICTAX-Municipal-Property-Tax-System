# CIVICTAX 6.0 — Business Rules & Governance Specification

## 1. Property Management Rules
- **Rule 1.1 (Mandatory Title Deed Reference)**: Every property registration must include a valid ownership document reference (`documentReference`) of at least 4 characters.
- **Rule 1.2 (Duplicate Parcel Protection)**: No property can be registered with a title deed reference that already exists in the system or an identical street address within the same municipal zone.
- **Rule 1.3 (Verification Precondition)**: A property cannot have its status updated to `VERIFIED` or `REJECTED` by a user whose role is not `OFFICER` or `ADMIN`.
- **Rule 1.4 (Immutable Verification Stamp)**: When an officer approves a property, the system automatically captures their user ID, full name, timestamp, and stores a permanent revision entry.

---

## 2. Tax Calculation & Assessment Rules
- **Rule 2.1 (Verification Dependency)**: Assessments can only be generated for properties with status `VERIFIED`. Attempts to generate an assessment for `PENDING` or `REJECTED` properties are blocked.
- **Rule 2.2 (Unit Area Value Formula)**:
  $$\text{Base Tax} = \text{Built-up Area (sq ft)} \times \text{Applied Rate per Sq Ft (\text{₹})}$$
  $$\text{Total Tax} = \text{Base Tax} + \text{Penalty} - \text{Discount}$$
  $$\text{Outstanding Balance} = \text{Total Tax} - \sum \text{Successful Payments}$$
- **Rule 2.3 (Discount Clamping)**: Early payment discounts cannot exceed the base tax amount, ensuring the total tax never becomes negative.
- **Rule 2.4 (Historical Rate Preservation)**: Modifying future rates in the Tax Rate Configuration table does not alter `appliedRatePerSqFt` on pre-existing assessment bills.

---

## 3. Payment Processing Rules
- **Rule 3.1 (Overpayment Prevention)**: Payment amounts exceeding the outstanding balance are rejected.
- **Rule 3.2 (Settlement Reconciliation)**: When a payment equals the remaining balance, the assessment status automatically transitions to `PAID` and `outstandingBalance` becomes 0. Partial payments update the status to `PARTIALLY_PAID`.
- **Rule 3.3 (Duplicate Transaction Safeguard)**: Unique transaction IDs (`TXN-`) and official receipts (`RCP-`) are issued for every payment.

---

## 4. Reassessment & Dispute Rules
- **Rule 4.1 (Non-Destructive Adjustments)**: Approving a citizen reassessment dispute generates a traceable revised assessment bill (`CT-ASM-XXXX-R`) linked to the original bill via `previousAssessmentId`. Original historical assessments are never silently overwritten.
