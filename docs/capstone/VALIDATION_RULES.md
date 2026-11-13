# CivicTax Validation Rules Specification

## 1. Declarative Validation Architecture

Validation rules enforce domain invariants at the Salesforce database layer before DML operations commit.

---

## 2. Implemented Validation Rules

### 2.1 `Property__c` Validation Rules

#### Rule 1: `Built_Up_Area_Must_Be_Positive`
- **Error Condition Formula**: `Built_Up_Area__c <= 0`
- **Error Message**: *"Built-up area must be a strictly positive number of square feet."*

#### Rule 2: `Built_Up_Cannot_Exceed_Plot_Area`
- **Error Condition Formula**: `Built_Up_Area__c > Plot_Area__c`
- **Error Message**: *"Built-up area cannot exceed the total declared plot area."*

#### Rule 3: `Valid_Construction_Year`
- **Error Condition Formula**: `OR(Construction_Year__c < 1850, Construction_Year__c > YEAR(TODAY()))`
- **Error Message**: *"Construction year must be between 1850 and the current calendar year."*

#### Rule 4: `Owner_Contact_Required`
- **Error Condition Formula**: `ISBLANK(Owner_Contact__c)`
- **Error Message**: *"Every registered municipal property parcel must be associated with a valid Citizen Contact."*

---

### 2.2 `Tax_Assessment__c` Validation Rules

#### Rule 1: `Tax_Amount_Cannot_Be_Negative`
- **Error Condition Formula**: `Total_Amount__c < 0`
- **Error Message**: *"Total tax assessment liability cannot be negative."*

#### Rule 2: `Due_Date_Cannot_Be_In_Past_On_Creation`
- **Error Condition Formula**: `AND(ISNEW(), Due_Date__c < TODAY())`
- **Error Message**: *"The assessment payment due date cannot be set in the past upon generation."*

---

### 2.3 `Tax_Payment__c` Validation Rules

#### Rule 1: `Payment_Amount_Must_Be_Positive`
- **Error Condition Formula**: `Amount_Paid__c <= 0`
- **Error Message**: *"Payment amount must be greater than zero."*

#### Rule 2: `Transaction_ID_Required`
- **Error Condition Formula**: `ISBLANK(Transaction_ID__c)`
- **Error Message**: *"Every recorded payment must contain an external banking transaction ID or UTR."*
