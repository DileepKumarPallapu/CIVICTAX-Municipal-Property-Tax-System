# CivicTax Salesforce Object & Field Schema

## 1. Schema Architecture & Standard vs Custom Boundary

CivicTax maps its municipal domain model onto Salesforce Core entities using standard objects for identity and accounts, and dedicated custom objects with `__c` notation for municipal assessments, parcels, rates, and payments.

```
+-----------------------------------------------------------------------------------+
|                        SALESFORCE DATA MODEL ARCHITECTURE                         |
+-----------------------------------------------------------------------------------+

     [ Account ] (Municipal Household / Entity)
          |
          | 1:N
          v
     [ Contact ] (Citizen / Property Owner) <------- [ User ] (Municipal Officer)
          |                                                |
          | 1:N                                            | Assigned Officer
          v                                                |
     [ Property__c ] (Cadastral Parcel) <------------------+
          |
          +-----------------------+-----------------------+
          | 1:N                   | 1:N                   | 1:N
          v                       v                       v
 [ Tax_Assessment__c ]      [ Grievance__c ]     [ Property_Transfer_Request__c ]
          |
          | 1:N
          v
  [ Tax_Payment__c ]
```

---

## 2. Standard Object Usage Invariants

1. **`Account`**: Represents a municipal household, commercial enterprise, or institutional taxpayer entity.
2. **`Contact`**: Represents individual registered citizens, co-owners, or authorized legal representatives. Holds citizen identity attributes without exposing raw PII.
3. **`User`**: Municipal field revenue inspectors, zonal commissioners, and system administrators with role hierarchy assignments.
4. **`Case`**: Optionally leveraged or referenced for formal citizen service requests, while `Grievance__c` acts as the domain-specialized municipal redressal record.

---

## 3. Core Custom Objects & Field Specifications

### 3.1 `Property__c` (Municipal Parcel)
- `Name`: Auto-Number (`PROP-{000000}`)
- `Property_Number__c`: Text(50), Unique, External ID (e.g. `CHN-ZN01-WD04-00104`)
- `Owner_Contact__c`: Lookup(Contact), Cascading read-only
- `Property_Category__c`: Picklist (`Residential`, `Commercial`, `Industrial`)
- `Municipal_Zone__c`: Lookup(`Property_Zone__c`)
- `Built_Up_Area__c`: Number(12, 2) (Square Feet)
- `Plot_Area__c`: Number(12, 2) (Square Feet)
- `Construction_Year__c`: Number(4, 0)
- `Latitude__c`: Number(8, 6)
- `Longitude__c`: Number(9, 6)
- `Ownership_Doc_Ref__c`: Text(100)
- `Verification_Status__c`: Picklist (`PENDING`, `VERIFIED`, `REJECTED`)
- `Assigned_Officer__c`: Lookup(User)

### 3.2 `Tax_Assessment__c` (Tax Liability Statement)
- `Name`: Auto-Number (`ASM-{YYYY}-{000000}`)
- `Property__c`: Master-Detail(`Property__c`), Delete restricted
- `Assessment_Year__c`: Text(10) (e.g. `2025-2026`)
- `Applied_Rate__c`: Currency(14, 2)
- `Base_Tax__c`: Currency(14, 2) Formula: `Built_Up_Area__c * Applied_Rate__c`
- `Penalty_Amount__c`: Currency(14, 2) Default 0.00
- `Early_Rebate_Discount__c`: Currency(14, 2) Default 0.00
- `Total_Amount__c`: Currency(14, 2) Formula: `Base_Tax__c + Penalty_Amount__c - Early_Rebate_Discount__c`
- `Due_Date__c`: Date
- `Status__c`: Picklist (`DRAFT`, `FINALIZED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`)

### 3.3 `Tax_Payment__c` (Authoritative Payment Receipt)
- `Name`: Auto-Number (`RCPT-{YYYY}-{000000}`)
- `Assessment__c`: Master-Detail(`Tax_Assessment__c`)
- `Amount_Paid__c`: Currency(14, 2)
- `Payment_Date__c`: DateTime
- `Payment_Method__c`: Picklist (`UPI`, `NET_BANKING`, `DEBIT_CARD`, `CREDIT_CARD`, `POS_CASH`)
- `Payment_Status__c`: Picklist (`SUCCESS`, `FAILED`, `PENDING_CLEARANCE`)
- `Transaction_ID__c`: Text(100), External ID, Unique

### 3.4 `Tax_Rate__c` (Tax Rate Schedule)
- `Property_Category__c`: Picklist (`Residential`, `Commercial`, `Industrial`)
- `Rate_Per_SqFt__c`: Currency(10, 2)
- `Effective_Start_Date__c`: Date
- `Effective_End_Date__c`: Date
- `Is_Active__c`: Checkbox

### 3.5 `Grievance__c` (Redressal Record)
- `Grievance_Number__c`: Auto-Number (`GRV-{000000}`)
- `Citizen_Contact__c`: Lookup(Contact)
- `Property__c`: Lookup(`Property__c`)
- `Category__c`: Picklist (`Tax_Calculation`, `Payment`, `Property_Info`, `Ownership`, `Other`)
- `Priority__c`: Picklist (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `Status__c`: Picklist (`SUBMITTED`, `ASSIGNED`, `UNDER_INVESTIGATION`, `RESOLVED`, `REJECTED`)
- `Resolution_Comments__c`: Long TextArea(32000)
