# CIVICTAX Salesforce Milestone 1 & 2 Mapping

This document provides a comprehensive mapping of all academic and technical Salesforce requirements to the actual source files, metadata artifacts, and test verification methods in CivicTax.

---

## 1. Milestone 1 — Administration & Configuration

| Academic Requirement | Salesforce Implementation | Metadata / Source File | Verification Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Standard & Custom Objects** | `Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Grievance__c`, `Reassessment_Request__c` | `salesforce/force-app/main/default/objects/*` | `PropertyServiceTest.cls` | **Implemented Locally** |
| **Field Types & Accuracy** | Exact currency precision (`14, 2`), external IDs, Picklists, Text, Dates | `objects/*/fields/*.field-meta.xml` | Schema Validation | **Implemented Locally** |
| **Validation Rules** | Positive area, non-future year, non-negative tax amounts | `objects/*/validationRules/*` | Negative DML Assertions | **Implemented Locally** |
| **Object Relationships** | Lookup & Master-Detail relationships across properties, bills, and receipts | Field XML metadata lookups | Relational Integrity Tests | **Implemented Locally** |
| **Permission Sets & Security** | `CivicTax_Officer`, `CivicTax_Admin`, `CivicTax_Citizen` with FLS | `permissionsets/CivicTax_Officer.permissionset-meta.xml` | `System.runAs()` Tests | **Implemented Locally** |

---

## 2. Milestone 2 — Development & Automation

| Academic Requirement | Salesforce Implementation | Metadata / Source File | Verification Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authoritative Apex** | `TaxCalculationService.cls`, `PropertyService.cls`, `PaymentService.cls` | `classes/TaxCalculationService.cls`, `classes/PaymentService.cls` | `PropertyServiceTest.testTaxCalculationLogic` | **Implemented Locally** |
| **Database Triggers** | Single-trigger design (`PropertyTrigger`, `TaxPaymentTrigger`) | `triggers/PropertyTrigger.trigger`, `triggers/TaxPaymentTrigger.trigger` | Bulk Trigger Test | **Implemented Locally** |
| **Asynchronous Apex** | `NotificationQueueable`, `OverdueAssessmentBatch`, `OverdueAssessmentScheduler` | `classes/CivicTaxAsyncJobs.cls` | `Test.startTest()` / `Test.stopTest()` | **Implemented Locally** |
| **SOQL & SOSL** | Aggregated zone queries and multi-object full-text search | `classes/CivicTaxSearchService.cls` | SOQL Unit Assertions | **Implemented Locally** |
| **Lightning Web Components** | `civicTaxDashboard` bundle (`html`, `js`, `js-meta.xml`) | `lwc/civicTaxDashboard/*` | LWC Rendering Test | **Implemented Locally** |
| **REST Integration Endpoint** | Apex REST resource `@RestResource(urlMapping='/civictax/v1/*')` | `classes/CivicTaxRestResource.cls` | HTTP Callout Test | **Implemented Locally** |
| **Order of Execution Trace** | Authoritative 14-step transaction lifecycle documentation | `docs/architecture/WORKFLOW_ARCHITECTURE.md` | Order Trace Review | **Implemented Locally** |
