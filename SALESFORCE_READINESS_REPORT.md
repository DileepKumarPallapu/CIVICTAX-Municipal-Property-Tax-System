# CIVICTAX 6.0 — Salesforce Integration Blueprint & Readiness Report

## 1. Overview
CivicTax was designed from day one to serve as a high-fidelity frontend capable of connecting directly to **Salesforce Lightning Platform** and **Apex REST APIs** in Phase 2 without rewriting user interface views.

---

## 2. Comprehensive Salesforce Metadata Mapping

### 1. Data Schema & Custom Objects
| CivicTax TypeScript Interface | Proposed Salesforce Object | Object Type | Mapped Custom Fields |
| :--- | :--- | :--- | :--- |
| `Property` | `Property__c` | Custom Object | `Property_Number__c` (AutoNumber), `Owner__c` (Lookup: Contact), `Built_Up_Area__c` (Number), `Category__c` (Picklist), `Verification_Status__c` (Picklist), `Document_Reference__c` (Text), `Zone__c` (Master-Detail: Property_Zone__c) |
| `TaxAssessment` | `Tax_Assessment__c` | Custom Object | `Assessment_Number__c` (AutoNumber), `Property__c` (Master-Detail), `Assessment_Year__c` (Text), `Applied_Rate__c` (Currency), `Base_Tax__c` (Formula/Currency), `Total_Tax__c` (Currency), `Outstanding_Balance__c` (Formula/Currency), `Status__c` (Picklist) |
| `Payment` | `Tax_Payment__c` | Custom Object | `Receipt_Number__c` (AutoNumber), `Assessment__c` (Master-Detail), `Transaction_Id__c` (Text), `Amount_Paid__c` (Currency), `Payment_Method__c` (Picklist), `Status__c` (Picklist) |
| `Grievance` | `Citizen_Grievance__c` | Custom Object | `Case_Number__c` (AutoNumber), `Property__c` (Lookup), `Citizen__c` (Lookup), `Category__c` (Picklist), `Priority__c` (Picklist), `Status__c` (Picklist), `Assigned_Officer__c` (Lookup: User), `Resolution_Notes__c` (LongTextArea) |
| `ReassessmentRequest` | `Reassessment_Request__c` | Custom Object | `Assessment__c` (Lookup), `Claimed_Area__c` (Number), `Reason__c` (LongTextArea), `Status__c` (Picklist), `Reviewed_By__c` (Lookup: User) |
| `TaxRate` | `Tax_Rate_Configuration__c` | Custom Metadata | `Category__c` (Text), `Zone__c` (Text), `Rate_Per_Sq_Ft__c` (Currency), `Is_Active__c` (Checkbox) |
| `MunicipalZone` | `Property_Zone__c` | Custom Object | `Zone_Code__c` (Text), `Zone_Name__c` (Text), `Officer_In_Charge__c` (Lookup: User), `Revenue_Target__c` (Currency) |

---

## 3. Apex Implementation & Order of Execution
In Phase 2, the following Apex classes will handle the backend business logic:

1. **`PropertyServiceResource.cls` (Apex REST)**:
   - `@HttpPost registerProperty(...)`: Runs duplicate checks using SOQL, assigns record type, and routes to the zone officer via Salesforce Queue.
2. **`AssessmentTriggerHandler.cls` (Apex Trigger)**:
   - Prevents generation of `Tax_Assessment__c` if the parent `Property__c.Verification_Status__c != 'VERIFIED'`.
   - Stamps the historical applied rate from `Tax_Rate_Configuration__mdt`.
3. **`PaymentTriggerHandler.cls` (Apex Trigger)**:
   - After insert, recalculates `Outstanding_Balance__c` on `Tax_Assessment__c` and updates status to `'PAID'` or `'PARTIALLY_PAID'`.
   - Generates platform event `Municipal_Receipt_Event__e` for outbound notification.
4. **`ReassessmentApprovalProcess` (Salesforce Approval Process)**:
   - Automates two-tier officer review of tax disputes and fires an Apex Action creating the revised assessment (`-R`).

---

## 4. How to Transition
1. Switch `src/services/serviceFactory.ts` to export `SalesforceServiceAdapter` instead of `LocalServiceFactory`.
2. Configure `.env` with Salesforce Connected App OAuth credentials (`VITE_SF_CLIENT_ID`, `VITE_SF_INSTANCE_URL`).
3. The UI will seamlessly interact with Salesforce Apex REST endpoints with zero code modifications required on the React views.
