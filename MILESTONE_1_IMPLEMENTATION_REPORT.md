# CivicTax 9.0 — Milestone 1 & 2 Implementation Report

## 1. Executive Summary

CivicTax 9.0 delivers a comprehensive academic mapping and evidence suite demonstrating mastery across Salesforce Milestone 1 (Administration & Configuration) and Milestone 2 (Development & Automation).

All requirements are backed by concrete Salesforce DX source files located under `salesforce/force-app/main/default/`, test verification methods, and an interactive **Academic Evidence Center** integrated into the live application at `/admin/evidence`.

---

## 2. Milestone 1 — Administration & Configuration Mapping

| Requirement / Concept | CivicTax Implementation | Metadata Path | Test Verification | Academic Viva Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Custom Objects** | `Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Grievance__c`, `Reassessment_Request__c` | `objects/*/*.object-meta.xml` | `PropertyServiceTest` | Modular custom object hierarchy preventing cascading financial data loss. |
| **Field Types & Accuracy** | Currency (precision 14, scale 2), External IDs, Text, Picklist, Date | `objects/*/fields/*.field-meta.xml` | Schema validation | Currency arithmetic uses exact decimals to prevent floating-point rounding errors. |
| **Object Relationships** | Lookup & Master-Detail (Property $\rightarrow$ Assessments, Assessment $\rightarrow$ Payments) | Field metadata lookups | Relational integrity tests | Parent-child relationships enforce referential integrity across the municipal lifecycle. |
| **Validation Rules** | Built-up area > 0, non-future year, non-negative tax amounts | `objects/*/validationRules/*.validationRule-meta.xml` | Negative DML assertions | Enforced at database level before any commit takes place. |
| **Permission Sets & Security** | `CivicTax_Officer`, `CivicTax_Admin`, `CivicTax_Citizen` | `permissionsets/*.permissionset-meta.xml` | `System.runAs()` execution | Object-level and field-level security prevents cross-citizen data leakage. |

---

## 3. Milestone 2 — Development & Automation Mapping

| Requirement / Concept | CivicTax Implementation | Metadata Path | Test Verification | Academic Viva Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Authoritative Apex** | `TaxCalculationService.cls`, `PropertyService.cls`, `PaymentService.cls` | `classes/*.cls` | `TaxCalculationServiceTest` | All tax formulas and payment rollups execute strictly in Apex. |
| **Database Triggers** | One trigger per object (`PropertyTrigger`, `TaxPaymentTrigger`) | `triggers/*.trigger` | Bulk insert/update tests | Bulkified triggers update parent balances without recursive looping. |
| **Asynchronous Apex** | `NotificationQueueable`, `OverdueAssessmentBatch`, `OverdueAssessmentScheduler` | `classes/CivicTaxAsyncJobs.cls` | `Test.startTest()` / `Test.stopTest()` | Heavy annual assessment generation and overdue scans run in background batches. |
| **SOQL & SOSL** | Aggregated zone queries and multi-object SOSL search | `classes/CivicTaxSearchService.cls` | Search unit tests | Selective SOQL with zero queries inside loops; SOSL for text indexing. |
| **Lightning Web Components** | `civicTaxDashboard`, `propertyRegistration` | `lwc/*` | LWC component rendering | Native Salesforce UI execution complementing the external React portal. |
| **Order of Execution** | Documented exact sequence: Before Triggers $\rightarrow$ Validation $\rightarrow$ Save $\rightarrow$ After Triggers $\rightarrow$ Commit | `TRIGGER_AND_EXECUTION_ORDER.md` | Order trace audit | Transparent adherence to Salesforce multi-tenant transaction limits. |
