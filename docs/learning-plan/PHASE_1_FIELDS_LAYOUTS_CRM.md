# Topic 5: Fields, Layouts, Record Types & Separate Outreach CRM

## 1. Core CivicTax Fields, Layouts & Record Types

### 1.1 Custom Field Types Demonstrated
- **Formula Fields**: `Base_Tax_Formula__c` (`Built_Up_Area__c * Applied_Rate__c`), `Is_Overdue__c` (`TODAY() > Due_Date__c && Outstanding_Balance__c > 0`).
- **Roll-Up Summary Fields**: `Total_Amount_Paid__c` (SUM of child `Tax_Payment__c.Amount_Paid__c`).
- **Picklists & Dependent Picklists**: `Property_Category__c` (`Residential`, `Commercial`, `Industrial`) controlling dependent `Property_Sub_Type__c`.

### 1.2 Record Types (`Property__c`)
- **`Residential`**: Picklist values: Individual Villa, Apartment Flat. Layout: Standard Citizen / Verification.
- **`Commercial`**: Picklist values: Retail Shop, Office Complex, Hotel. Includes Fire NOC fields.
- **`Industrial`**: Picklist values: Manufacturing, Warehouse. Includes Pollution Clearance document reference.

---

## 2. Independent Municipal Outreach CRM Demonstration (Phase 1 Curriculum)

> [!NOTE]
> Per curriculum instructions, standard Sales Cloud concepts (Leads, Opportunities, Products, Price Books, Quotes, Contracts, Campaigns) are **strictly isolated** from the municipal property tax engine to prevent architectural pollution.

### Municipal Citizen Outreach Campaign Model:
- **`Campaign`**: "FY 2026-27 Early-Bird Advance Property Tax Incentive Drive".
- **`Lead`**: Unregistered property occupants identified via satellite GIS surveys.
- **`Lead Conversion`**: Converts to `Account` (Citizen Household), `Contact` (Owner), and initial `Opportunity` (Estimated Advance Tax Assessment).
- **`Product2` / `PricebookEntry`**: Municipal Commercial Waste Disposal Services / Water Connection Fees.
- **`Opportunity` Stages**: Identified $\to$ Inspection Scheduled $\to$ Demand Note Issued $\to$ Closed Settled.
