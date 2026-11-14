# CivicTax 5.0: Automated Tax Assessment Billing Pipeline

## 1. Automated Billing Process (12 Stages)

```
[ Trigger Event ] (Property Activated OR Annual Fiscal Batch Execution)
  │  Stage 1: Retrieve verified, active property record
  │  Stage 2: Retrieve applicable active tax configuration matrix (Tax_Rate__c)
  │  Stage 3: Identify statutory assessment fiscal year (e.g. 2025-2026)
  │  Stage 4: Retrieve property category classification (Residential, Commercial, Industrial)
  ▼
[ Central Calculation Engine ]
  │  Stage 5: Calculate Base Tax = Built-Up Area × Configured Category Unit Rate
  │  Stage 6: Generate transparent mathematical breakdown
  │  Stage 7: Apply eligible early-bird rebate adjustments (-5% for advance payment)
  │  Stage 8: Validate calculated amounts against non-negative boundary bounds
  ▼
[ Approval & Citizen Publication ]
  │  Stage 9: Submit assessment record for supervisor approval
  │  Stage 10: Generate finalized approved assessment statement
  │  Stage 11: Publish demand statement to citizen portal with outstanding balance
  │  Stage 12: Dispatch automated citizen notification with payment due date
```

---

## 2. Centralized Mathematical Standard

$$\text{Base Tax} = \text{Built-Up Area (sq ft)} \times \text{Category Unit Rate (₹/sq ft)}$$

$$\text{Total Assessed Demand} = \text{Base Tax} + \text{Penalty} - \text{Discount}$$

$$\text{Outstanding Balance} = \text{Total Assessed Demand} - \sum \text{Verified Successful Payments}$$

> [!IMPORTANT]
> **Zero UI Math**: Tax calculations are executed strictly inside centralized services (`LocalAssessmentService.ts` / Apex `TaxCalculationService.cls`). Frontend components only render the authoritative values.
