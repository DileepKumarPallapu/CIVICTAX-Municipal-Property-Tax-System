# CivicTax Salesforce Requirement Traceability Matrix

| Requirement Identifier | Salesforce Concept | CivicTax Implementation Details | Source Artifact / Metadata Location | Verification Test Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-M1-01** | Custom Objects | `Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Grievance__c`, `Reassessment_Request__c` | `salesforce/force-app/main/default/objects/*` | `PropertyServiceTest.testRegisterPropertySuccess` | **Implemented Locally** |
| **REQ-M1-02** | Validation Rules | Non-zero area, non-future construction year, non-negative tax amounts | `salesforce/force-app/main/default/objects/*/validationRules/*` | Negative DML execution assertions | **Implemented Locally** |
| **REQ-M1-03** | Permission Sets | `CivicTax_Officer`, `CivicTax_Admin`, `CivicTax_Citizen` | `salesforce/force-app/main/default/permissionsets/*` | `System.runAs()` execution | **Implemented Locally** |
| **REQ-M1-04** | Relationships | Lookup & Master-Detail relationships across properties, bills, and payments | Field XML metadata definitions | Relational integrity tests | **Implemented Locally** |
| **REQ-M2-01** | Authoritative Apex | `TaxCalculationService`, `PropertyService`, `PaymentService` | `salesforce/force-app/main/default/classes/*` | `TaxCalculationServiceTest` | **Implemented Locally** |
| **REQ-M2-02** | Triggers | One-trigger-per-object (`PropertyTrigger`, `TaxPaymentTrigger`) | `salesforce/force-app/main/default/triggers/*` | Bulk trigger execution test | **Implemented Locally** |
| **REQ-M2-03** | Asynchronous Apex | `NotificationQueueable`, `OverdueAssessmentBatch`, `OverdueAssessmentScheduler` | `salesforce/force-app/main/default/classes/CivicTaxAsyncJobs.cls` | `Test.startTest()` / `Test.stopTest()` | **Implemented Locally** |
| **REQ-M2-04** | SOQL & SOSL | Zone aggregations and multi-object SOSL full-text searches | `salesforce/force-app/main/default/classes/CivicTaxSearchService.cls` | Search execution assertions | **Implemented Locally** |
| **REQ-M2-05** | Lightning Web Components | `civicTaxDashboard`, `propertyRegistration` | `salesforce/force-app/main/default/lwc/*` | LWC UI rendering verification | **Implemented Locally** |
| **REQ-M2-06** | REST Web Services | Apex REST `@RestResource(urlMapping='/civictax/v1/*')` | `salesforce/force-app/main/default/classes/CivicTaxRestResource.cls` | Integration endpoint test | **Implemented Locally** |
