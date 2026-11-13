# CIVICTAX — Salesforce Integration Blueprint (Phase 2)

## 1. Architectural Strategy
To satisfy the project requirement of building the complete website independently now while preparing for a seamless transition to Salesforce later, CivicTax was built with a **decoupled service adapter pattern**.

Every page, table, and form interacts solely with TypeScript service interfaces (`src/services/interfaces/`). No React component directly accesses `localStorage` or hardcodes backend endpoints.

---

## 2. Salesforce Entity Mapping

| CivicTax Frontend Interface | Salesforce Custom Object | Salesforce API Name | Key Mapped Fields |
| :--- | :--- | :--- | :--- |
| `Property` | Property | `Property__c` | `Property_Number__c`, `Built_Up_Area__c`, `Zone__c`, `Category__c`, `Verification_Status__c`, `Document_Ref__c` |
| `TaxAssessment` | Tax Assessment | `Tax_Assessment__c` | `Assessment_Number__c`, `Property__c`, `Base_Tax__c`, `Penalty__c`, `Discount__c`, `Total_Tax__c`, `Outstanding_Balance__c` |
| `Payment` | Tax Payment | `Payment_Transaction__c`| `Receipt_Number__c`, `Transaction_Id__c`, `Assessment__c`, `Amount_Paid__c`, `Payment_Method__c`, `Status__c` |
| `Grievance` | Citizen Grievance | `Citizen_Grievance__c` | `Case_Number__c`, `Property__c`, `Subject__c`, `Status__c`, `Priority__c`, `Resolution_Notes__c` |
| `ReassessmentRequest` | Reassessment Request | `Reassessment_Request__c`| `Assessment__c`, `Claimed_Area__c`, `Reason__c`, `Status__c` |
| `TaxRate` | Tax Gazette Rate | `Tax_Rate_Configuration__c`| `Category__c`, `Zone__c`, `Rate_Per_Sq_Ft__c`, `Active__c` |
| `MunicipalZone` | Municipal Zone | `Municipal_Zone__c` | `Zone_Code__c`, `Zone_Name__c`, `Officer_In_Charge__c`, `Target__c` |

---

## 3. Apex REST Endpoints (Phase 2 Implementation)

CivicTax frontend is designed to call the following Apex REST endpoints:

```java
// PropertyController.cls
@RestResource(urlMapping='/civictax/properties/*')
global with sharing class PropertyServiceResource {
    @HttpGet
    global static List<Property__c> getProperties() {
        return [SELECT Id, Property_Number__c, Owner_Name__c, Built_Up_Area__c, 
                       Verification_Status__c, Zone__r.Name FROM Property__c];
    }

    @HttpPost
    global static Property__c registerProperty(String ownerName, Decimal area, String category, String zoneId) {
        Property__c prop = new Property__c(
            Owner_Name__c = ownerName,
            Built_Up_Area__c = area,
            Category__c = category,
            Zone__c = zoneId,
            Verification_Status__c = 'PENDING'
        );
        insert prop;
        return prop;
    }
}
```

---

## 4. How to Switch from Local Demo to Salesforce

Switching to a live Salesforce backend requires **zero changes to UI components**:
1. Open `src/services/serviceFactory.ts`.
2. Replace `LocalServiceFactory` with `SalesforceServiceAdapter` (already prototyped in `src/services/salesforce/SalesforceServiceAdapter.ts`).
3. Set your Salesforce Connected App Client ID, OAuth Token, and Org URL in `.env`.
4. All UI actions will automatically begin persisting directly into Salesforce Custom Objects.
