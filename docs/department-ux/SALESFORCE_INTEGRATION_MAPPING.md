# CivicTax 3.0 Salesforce Object & API Integration Mapping

## 1. Enterprise Integration Architecture

CivicTax 3.0 maps every departmental data model directly to standard and custom Salesforce objects for seamless transition when the external org is connected.

```
+---------------------------------------------------------------------------------------------------+
|                        DEPARTMENT WORKSPACE TO SALESFORCE MAPPING                                 |
+---------------------------------------------------------------------------------------------------+

  [ Municipal Workspace ]                           [ Salesforce Core Asset ]
  ├── Property Registration Dept    ─────────────>  Property__c (Custom Object)
  ├── Field Verification Dept       ─────────────>  Property_Verification_Approval (Approval Process)
  ├── Tax Assessment Dept           ─────────────>  Tax_Assessment__c & Tax_Rate__c (Master-Detail)
  ├── Revenue & Payment Dept        ─────────────>  Tax_Payment__c (Master-Detail with Rollups)
  ├── Grievance Redressal Dept      ─────────────>  Case (Standard Service Cloud Object)
  ├── Reassessment Dept             ─────────────>  Reassessment_Request__c & Approval Process
  ├── Zonal Management Dept         ─────────────>  Property_Zone__c (Custom Lookup Master)
  ├── Citizen Identity Layer        ─────────────>  Contact (Standard Object) & Account (Household)
  └── Audit & Telemetry Dept        ─────────────>  Application_Audit__c & Change Data Capture
```

---

## 2. Salesforce Field & Relationship Mapping Table

| CivicTax Department | Entity Name | Salesforce Object | Key Fields Mapped | Relationship Type |
| :--- | :--- | :--- | :--- | :--- |
| **Property Registration** | Cadastral Parcel | `Property__c` | `Property_Number__c`, `Built_Up_Area__c`, `Property_Category__c` | Custom Object |
| **Property Registration** | Property Owner | `Contact` | `FirstName`, `LastName`, `Email`, `Phone` | Standard Lookup |
| **Field Verification** | Verification Status | `Property__c` | `Verification_Status__c`, `Field_Survey_Notes__c` | Custom Picklist |
| **Tax Assessment** | Tax Assessment | `Tax_Assessment__c` | `Total_Amount__c`, `Due_Date__c`, `Assessment_Status__c` | Master-Detail to `Property__c` |
| **Tax Assessment** | Tax Rate Matrix | `Tax_Rate__c` | `Rate_Per_SqFt__c`, `Effective_Start_Date__c` | Custom Lookup |
| **Revenue & Payment** | Payment Receipt | `Tax_Payment__c` | `Amount_Paid__c`, `Transaction_ID__c`, `Payment_Date__c` | Master-Detail to `Tax_Assessment__c` |
| **Grievance Redressal** | Citizen Complaint | `Case` | `Subject`, `Description`, `Priority`, `Status` | Standard Service Object |
| **Reassessment** | Dimension Appeal | `Reassessment_Request__c`| `Requested_Area__c`, `Approval_Status__c`, `Reason__c` | Custom Lookup |
| **Zonal Management** | Municipal Zone | `Property_Zone__c` | `Name`, `Zone_Code__c`, `Ward_Count__c` | Custom Lookup |

---

## 3. Security & Non-Fabrication Protocol
- Salesforce credentials and OAuth tokens are strictly stored on the server side (`server/src/routes/salesforceRoutes.ts`).
- Connection health checks dynamically report live org status and avoid silent fallbacks or fake connection claims.
