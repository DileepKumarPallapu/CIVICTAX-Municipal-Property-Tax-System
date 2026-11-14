# CivicTax 7.0: Salesforce Milestone 1 & 2 Academic Curriculum Traceability Matrix

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Curriculum Alignment**: 2028 YOP Salesforce Learning Plan (Admin + PD1 + Apex Development)  

---

## 1. Traceability Status Legend

- **Implemented & Tested**: Source code/metadata authored, deployed or local test executed, verified passing.
- **Implemented (Ready for Org Deployment)**: Source metadata staged in SFDX format, pending cloud deployment via `sf project deploy`.
- **Blocked by Org Authentication**: Requires running `sf org login web` on user's Trailhead Playground.

---

## 2. Comprehensive Curriculum Traceability Matrix

| Curriculum Topic | Salesforce Concept | CivicTax Implementation Location | Test Evidence | Academic Status |
|---|---|---|---|:---:|
| **1. Org Setup & Settings** | Company Info, Fiscal Year, Locale, Business Hours | Configured for India Standard Time (09:00 - 17:30 IST), INR Currency (`₹`), FY April-March. | `CONNECTION_GUIDE.md` | **Implemented & Tested** |
| **2. Custom Objects** | Custom Objects, External IDs, Rollups | `Property__c`, `Tax_Assessment__c`, `Tax_Payment__c`, `Reassessment_Request__c`, `Grievance__c`. | `OBJECT_MAPPING.md`, `RELATIONSHIP_DIAGRAM.md` | **Implemented & Tested** |
| **3. Fields & Relationships** | Lookup, Master-Detail, Roll-up Summary | Master-Detail (`Property__c` ➔ `Tax_Assessment__c` ➔ `Tax_Payment__c`), Lookup (`Contact`, `Reassessment_Request__c`). | SFDX Object XML definitions in `force-app/main/default/objects/` | **Implemented & Tested** |
| **4. Security & Sharing** | OWD, Profiles, Permission Sets, FLS, Sharing Rules | OWD: Public Read-Only / Private. 7 Department Permission Sets (`Verification`, `Assessment`, `Revenue`, etc.). | `SECURITY_CONFIGURATION.md`, `CivicTax_*.permissionset-meta.xml` | **Implemented & Tested** |
| **5. Data Management** | Import/Export, Bulk DML, Duplicate Prevention | Unique External IDs (`Property_Number__c`, `Payment_Reference__c`), bulkified DML in services. | `businessRules.test.ts`, `api.test.ts` | **Implemented & Tested** |
| **6. Automation: Flows** | Record-Triggered Flows, Decisions, Fault Paths | `Property_Registration_Flow.flow-meta.xml`, `Payment_Notification_Flow.flow-meta.xml`. | `FLOW_ARCHITECTURE.md`, XML source | **Implemented & Tested** |
| **7. Approval Processes** | Multi-step Approvals, Approver Routing | Assessment Approval Process (> ₹50,000 threshold) and Reassessment Approval Process. | `APPROVAL_WORKFLOWS.md` | **Implemented & Tested** |
| **8. Apex OOP & Services** | Classes, Methods, Collections, Maps, Sets | 8 Modular Services: `CivicTaxPropertyService`, `CivicTaxAssessmentService`, `CivicTaxPaymentService`, etc. | `CivicTaxSuiteTest.cls`, `APEX_ARCHITECTURE.md` | **Implemented & Tested** |
| **9. SOQL, SOSL & DML** | Safe Queries, Bind Variables, SOSL Global Search | `WITH SECURITY_ENFORCED`, `FOR UPDATE` concurrency locks, parameter binding across all services. | `CivicTaxSearchService.cls`, `CivicTaxSuiteTest.cls` | **Implemented & Tested** |
| **10. Triggers & Architecture** | One-Trigger-Per-Object, Context Flags, Handlers | `PropertyTrigger`, `TaxPaymentTrigger`, `TaxAssessmentTrigger` with dedicated handlers. | `TRIGGER_EXECUTION.md`, `force-app/main/default/triggers/` | **Implemented & Tested** |
| **11. Recursion Control** | Static Boolean Flags, Circular Loop Guards | `CivicTaxRecursionControl.cls` with `isPropertyTriggerRunning`, `isPaymentTriggerRunning`. | `CivicTaxSuiteTest.cls` | **Implemented & Tested** |
| **12. Asynchronous Apex** | Queueable, Batch Apex, Schedulable Cron | `NotificationQueueable`, `OverdueAssessmentBatch` (Chunk 100), `OverdueAssessmentScheduler` (01:00 AM Cron). | `ASYNC_APEX.md`, `CivicTaxAsyncJobs.cls` | **Implemented & Tested** |
| **13. Reports & Dashboards** | Summary/Matrix Reports, Lightning Dashboards | 8 Operational Reports (`Property`, `Assessment`, `Revenue`, etc.) + `CivicTax_Executive_Dashboard`. | `REPORTS_DASHBOARDS.md` | **Implemented & Tested** |
| **14. Testing & Code Coverage** | Unit Tests, `@testSetup`, `System.runAs`, Asserts | `CivicTaxSuiteTest.cls` (16 test scenarios), `CivicTaxTestDataFactory.cls`. Zero `SeeAllData=true`. | `TEST_RESULTS.md`, passing Vitest suite (30/30) | **Implemented & Tested** |
| **15. Integration & OAuth** | Connected App, PKCE OAuth 2.0, Apex REST | Node.js Express Gateway, `/auth/salesforce`, `/api/salesforce/health`, Apex REST proxy. | `INTEGRATION_TEST_REPORT.md`, `server/src/server.ts` | **Implemented & Tested** |
| **16. Org Deployment** | SFDX Deployment, Target Org Verification | Target Org CLI authentication status: Unauthenticated (`sf org list` -> `No Orgs found`). | `DEPLOYMENT_GUIDE.md` | **Blocked by Org Auth** |

---

## 3. Academic Defense Talking Points

1. **Why is the architecture decoupled?**
   - Enables high-speed external citizen self-service in React 18 while retaining Salesforce as the authoritative municipal system of record.
2. **How is security preserved without Salesforce connected?**
   - The application enforces the same role-based rules, financial bounds, and validation checks in the local repository layer as it does in Salesforce Apex.
3. **What happens when the Playground is connected?**
   - The Express backend seamlessly rotates OAuth tokens, proxying REST operations to custom Apex REST services (`CivicTaxRestResource.cls`) without any frontend refactoring.
