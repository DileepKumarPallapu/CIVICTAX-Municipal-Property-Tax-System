# 08 — CivicTax Business Logic & Domain Validation Audit

## 1. Domain Validation Engine

CivicTax centralizes domain invariants and validation logic in `src/services/businessRules.ts`, governing property registrations, assessments, payment processing, and grievance redressal.

---

## 2. Invariant Rules Audited

### 2.1 Property Rules (`PropertyRules`)
- **Plot & Built-up Area**: Built-up area must be $> 0$ and cannot exceed the declared total plot area.
- **Construction Year**: Year must be $\ge 1850$ and $\le \text{Current Year}$.
- **Unique Property Number**: Duplicate property door/survey numbers within the same municipal zone are rejected with a `BusinessRuleError`.

### 2.2 Assessment Rules (`AssessmentRules`)
- **Tax Rate Lookup**: Resolves active rate for category (`Residential`, `Commercial`, `Industrial`) matching the assessment date.
- **Effective Date Overlap Prevention**: Rejects overlapping active rates for the same category.
- **Base Tax Computation**: $\text{Base Tax} = \text{Built-up Area} \times \text{Rate}$.

### 2.3 Payment Rules (`PaymentRules`)
- **Positive Amount**: Payment amount must be $> 0$.
- **Overpayment Guard**: Payment amount cannot exceed the assessment's outstanding balance.
- **Double Payment Guard**: Assessments with status `PAID` reject subsequent payment attempts.
- **Idempotency**: Duplicate payment transaction IDs trigger validation errors.

---

## 3. Automated Test Verification

All business rules are under automated continuous verification in `src/__tests__/businessRules.test.ts` (4 passed) and `src/__tests__/taxCalculation.test.ts` (5 passed).
