# CivicTax Public Transparency Portal Specification

## 1. Transparency Mandate & Privacy Architecture

The CivicTax Public Transparency Portal provides open municipal governance metrics while guaranteeing absolute protection of citizen Personally Identifiable Information (PII) and confidential financial data.

---

## 2. Privacy Guardrails & Zero-PII Policy

> [!CAUTION]
> **Zero-PII Compliance Invariant**:
> 1. Never expose individual citizen names, phone numbers, email addresses, or national identity references.
> 2. Never publish discrete payment transaction references, credit card/UPI hashes, or bank UTR numbers.
> 3. Aggregate all statistics at the Municipal Zone, Ward, or Category level.
> 4. Property lists in open data feeds are strictly desensitized to display only non-confidential aggregated zone totals and collection percentages.

---

## 3. Published Municipal Metrics

```
+-------------------------------------------------------------------------------+
|                    MUNICIPAL PUBLIC TRANSPARENCY DASHBOARD                    |
+-------------------------------------------------------------------------------+
|  Total Registered     Assessed Value        Collected Revenue     Collection  |
|     Properties          FY 2025-26             FY 2025-26            Rate     |
|       14,820           ₹42,50,00,000          ₹36,12,50,000         85.0%     |
+-------------------------------------------------------------------------------+
|   Zone Performance    |   Category Distribution   |   Grievance Redressal Rate|
| - Zone 1: 88.4%       | - Residential: 68%        | - Total Filed: 412        |
| - Zone 2: 91.2%       | - Commercial:  24%        | - Resolved: 394 (95.6%)   |
| - Zone 3: 79.5%       | - Industrial:   8%        | - Avg Resolution: 4.2 days|
+-------------------------------------------------------------------------------+
```

1. **Macro KPI Cards**: Total properties, net assessed revenue, collected revenue, outstanding balance, overall municipal collection rate.
2. **Zone Collection Benchmarks**: Comparative revenue efficiency across municipal zones.
3. **Citizen Service Redressal Speed**: Average days to resolve citizen grievances and reassessments, demonstrating municipal accountability.
