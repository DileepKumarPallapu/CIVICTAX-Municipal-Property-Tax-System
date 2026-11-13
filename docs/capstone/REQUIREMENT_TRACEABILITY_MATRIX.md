# CivicTax USECASE_6 Requirement Traceability Matrix (RTM)

## 1. Traceability Standard

This matrix maps every academic requirement of **USECASE_6 (Property Tax Assessment and Payment Management System)** to its implementation in React, Express, and Salesforce Core.

---

## 2. Milestone 1 & Milestone 2 Traceability Matrix

| Requirement ID | Capstone Requirement Description | React Component | Express API Endpoint | Salesforce Platform Asset | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Property Registration with Parcel Dimensions | `RegisterPropertyPage.tsx` | `POST /api/municipal/properties` | `Property__c` (Object & Fields) | Dimension validation in `PropertyRules.ts` & `PropertyServiceTest.cls`. |
| **REQ-02** | Municipal Zone Assignment | `RegisterPropertyPage.tsx` | `GET /api/municipal/zones` | `Property_Zone__c` & Lookup | Zone routing in `PropertyService.cls`. |
| **REQ-03** | Officer Inspection & Verification | `PropertyVerificationPage.tsx` | `PUT /api/municipal/properties/:id` | `Property_Verification_Approval` | `PropertyTrigger` before/after update. |
| **REQ-04** | Annual Assessment Calculation | `CitizenAssessmentsPage.tsx` | `GET /api/municipal/assessments` | `Tax_Assessment__c`, `Tax_Rate__c` | `TaxCalculationService.cls` Decimal math. |
| **REQ-05** | Early-Rebate & Arrears Penalty Rules | `CitizenAssessmentsPage.tsx` | N/A (Embedded Logic) | Formula & Apex Service | Tested in `taxCalculation.test.ts`. |
| **REQ-06** | Simulated Payment Ingestion | `CitizenPaymentPortalPage.tsx`| `POST /api/municipal/payments` | `Tax_Payment__c` (Master-Detail) | `PaymentService.cls` with savepoints. |
| **REQ-07** | Instant Digital QR Receipt | `ReceiptViewer.tsx` | N/A (Render Engine) | `NotificationQueueable` | Verification hash & SVG seal. |
| **REQ-08** | Grievance Redressal Management | `CitizenGrievancesPage.tsx` | `POST /api/municipal/grievances` | `Case` (Standard Object) / `Grievance__c` | Case routing Flow & status timeline. |
| **REQ-09** | Reassessment Request & Multi-Step Sanction | `CitizenReassessmentsPage.tsx`| `POST /api/municipal/reassessments` | `Reassessment_Approval_Process` | Multi-step approval documentation. |
| **REQ-10** | Executive Analytics & Zonal Telemetry | `MunicipalCommandCenter.tsx` | `GET /api/municipal/dashboard` | Reports & Executive Dashboard | Real-time aggregate charts in Recharts. |
| **REQ-11** | Zero-Dead-Button Integrity | All 35+ Pages | N/A | LWC `civicTaxDashboard` | 100% handler verification audit. |
| **REQ-12** | Asynchronous Processing | N/A | Background Node Tasks | `CivicTaxAsyncJobs.cls` | Queueable, Batchable, Schedulable Apex. |
