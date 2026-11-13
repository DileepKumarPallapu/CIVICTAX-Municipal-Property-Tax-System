# CIVICTAX Business Rules Catalog

This catalog documents the authoritative business rules enforced by CivicTax across client validation, storage adapters, and Salesforce Apex services.

| Rule Identifier | Rule Name | Domain | Formal Validation & Enforcement Logic | Error Message / Platform Action |
| :--- | :--- | :--- | :--- | :--- |
| **BR-PROP-001** | Positive Built-Up Area | Property | $\text{BuiltUpArea} > 0$ | "Built-up Area must be strictly greater than zero for municipal property tax assessment." |
| **BR-PROP-002** | Valid Construction Year | Property | $\text{ConstructionYear} \le \text{CurrentYear}$ | "Construction year cannot be in the future." |
| **BR-PROP-003** | Mandatory Deed Reference | Property | $\text{String.isNotBlank(deedRef)} \land \text{Length} \ge 4$ | "Mandatory registered title deed reference (Index-II) is required for property verification." |
| **BR-PROP-004** | Unique Property Identifier | Property | $\text{Unique}(\text{Property\_Number\_\_c})$ | "Property number is already registered in the municipal records." |
| **BR-TAX-001** | Verified Property Gate | Tax Assessment | $\text{VerificationStatus} = \text{'VERIFIED'}$ | "Cannot assess property: property must be approved and verified by an assigned municipal officer." |
| **BR-TAX-002** | Area-Rate Determinism | Tax Assessment | $\text{BaseTax} = \text{BuiltUpArea} \times \text{GazetteRate}$ | "Base tax calculation mismatch: calculated base tax does not match area multiplied by active gazette rate." |
| **BR-TAX-003** | Non-Negative Assessments | Tax Assessment | $\text{BaseTax} \ge 0 \land \text{TotalTax} \ge 0$ | "Municipal tax assessment amount cannot be negative." |
| **BR-TAX-004** | Statutory Due Date | Tax Assessment | $\text{DueDate} \ge \text{AssessmentDate}$ | "Assessment due date cannot precede the assessment generation date." |
| **BR-PAY-001** | Positive Payment Amount | Payment | $\text{AmountPaid} > 0$ | "Payment amount must be strictly greater than zero." |
| **BR-PAY-002** | Overpayment Guard | Payment | $\text{AmountPaid} \le \text{OutstandingBalance}$ | "Payment amount (₹X) exceeds remaining outstanding balance (₹Y)." |
| **BR-PAY-003** | Unique Transaction Reference | Payment | $\text{Unique}(\text{Transaction\_ID\_\_c})$ | "Duplicate transaction reference detected. Duplicate transaction has been blocked to protect collection totals." |
| **BR-PAY-004** | Balance Rollup Invariant | Payment | $\text{NewOutstanding} = \text{TotalTax} - \text{CumulativePaid}$ | Updates parent assessment balance and advances status to `PAID` or `PARTIALLY_PAID`. |
| **BR-GRV-001** | Mandatory Grievance Fields | Grievance | $\text{Subject} \ne \text{null} \land \text{Description} \ne \text{null}$ | "Subject and narrative description are mandatory for citizen grievance submission." |
| **BR-GRV-002** | Resolution Remarks Check | Grievance | $\text{Status} = \text{'RESOLVED'} \implies \text{String.isNotBlank(Comments)}$ | "Officer resolution comments must be provided before closing a grievance." |
| **BR-REC-001** | Default Arrears Aging | Recovery | Overdue days $= \text{Today} - \text{DueDate}$ | Segregates delinquent bills into `1-30`, `31-60`, `61-90`, and `>90` days. |
