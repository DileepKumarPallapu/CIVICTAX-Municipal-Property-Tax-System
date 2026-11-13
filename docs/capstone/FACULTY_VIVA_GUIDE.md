# CivicTax USECASE_6 Faculty Viva & Academic Defense Guide

## 1. Candidate & Project Identification

- **Project**: CIVICTAX — Property Tax Assessment and Payment Management System
- **Use Case**: `USECASE_6` | **Team**: `TEAM_16`
- **Candidate**: Pallapu Dileep Kumar (VTU Number: `29962`)
- **Department**: Computer Science and Engineering

---

## 2. High-Impact Faculty Defense Questions & Answers

### Q1: Why is Salesforce the primary business platform for CivicTax rather than an ordinary relational database?
**Defense**: Municipal tax assessment and property deed governance require enterprise-grade auditability, strict role-based access control, automated workflow routing, and immutable financial ledgers. Salesforce provides native Organization-Wide Defaults, Sharing Rules, declarative Flow automation, multi-step Approval Processes, and custom Apex business logic with ACID transaction control. React serves as the public citizen engagement interface, while Salesforce acts as the authoritative municipal system of record.

### Q2: How did you implement Milestone 1 (Admin & Configuration) concepts?
**Defense**: In Milestone 1, we established:
1. **Data Model**: Standard objects (`Account`, `Contact`, `Case`, `User`) combined with custom objects (`Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Tax_Rate__c`, `Property_Zone__c`).
2. **Relationships**: Master-Detail relationships between `Property__c` $\to$ `Tax_Assessment__c` and `Tax_Assessment__c` $\to$ `Tax_Payment__c` with roll-up summaries, and Lookup relationships for citizen owners and zones.
3. **Security**: Private OWD, Field-Level Security, and dedicated Permission Sets (`CivicTax_Citizen`, `CivicTax_Officer`, `CivicTax_Admin`).
4. **Automation**: Record-Triggered Flows and Multi-Step Approval Processes for property verifications and reassessment requests.
5. **Analytics**: Custom Report Types, Reports, and the native CivicTax Executive Dashboard.

### Q3: How did you implement Milestone 2 (Development & Automation) concepts?
**Defense**: In Milestone 2, we engineered:
1. **Apex Architecture**: Object-oriented service layer (`PropertyService`, `TaxCalculationService`, `PaymentService`) using `Decimal` currency math, avoiding floating-point rounding errors.
2. **Collections & SOQL**: Bulkified algorithms using `List`, `Set`, and `Map` with relationship queries (`Tax_Assessments__r`) and zero SOQL queries in loops.
3. **Triggers & Recursion**: Single Trigger Per Object architecture (`PropertyTrigger`, `TaxPaymentTrigger`) governed by a set-based, bulk-safe recursion controller (`CivicTaxRecursionControl`).
4. **Order of Execution**: Mapped the statutory 20-step Salesforce execution order across before/after triggers, validation rules, roll-up summaries, and flows.
5. **Asynchronous Apex**: Queueable Apex for receipt generation, Batch Apex for city-wide annual assessment generation, and Schedulable Apex for daily overdue interest compounding.
6. **Integration**: REST endpoint at `/services/apexrest/civictax/v1/*` secured via External Client App OAuth 2.0 PKCE.

### Q4: How is citizen data privacy protected in public open data?
**Defense**: CivicTax enforces a strict **Zero-PII invariant**. On the Public Transparency Portal, all metrics are aggregated at the Municipal Zone level. Individual citizen names, phone numbers, email addresses, and discrete payment transaction references are completely stripped before reaching public endpoints.
