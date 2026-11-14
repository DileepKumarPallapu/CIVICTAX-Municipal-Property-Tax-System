# CivicTax 6.0: Entity-Relationship Architecture & Schema Diagram

```mermaid
erDiagram
    CONTACT ||--o{ PROPERTY : "owns"
    PROPERTY ||--|{ TAX_ASSESSMENT : "assessed under"
    TAX_ASSESSMENT ||--o{ TAX_PAYMENT : "settled via"
    PROPERTY ||--o{ REASSESSMENT_REQUEST : "reassessed by"
    TAX_ASSESSMENT ||--o{ REASSESSMENT_REQUEST : "superseded by"
    PROPERTY ||--o{ CASE : "disputed via"
    USER ||--o{ TASK : "assigned to"
    PROPERTY ||--o{ CONTENT_DOCUMENT_LINK : "verified with"

    CONTACT {
        Id id PK
        string Name
        string Email
        string Phone
        string Aadhaar_Number
    }

    PROPERTY {
        Id id PK
        string Property_Number__c UK "External ID"
        Id Owner__c FK
        string Property_Address__c
        string Zone__c
        picklist Property_Category__c
        decimal Built_Up_Area__c
        decimal Land_Area__c
        picklist Verification_Status__c
        picklist Registration_Status__c
    }

    TAX_ASSESSMENT {
        Id id PK
        string Assessment_Number__c UK "External ID"
        Id Property__c FK "Master-Detail"
        string Assessment_Year__c
        currency Base_Tax__c
        currency Penalty__c
        currency Discount__c
        currency Total_Tax__c
        date Due_Date__c
        picklist Assessment_Status__c
    }

    TAX_PAYMENT {
        Id id PK
        string Payment_Reference__c UK "External ID"
        Id Assessment__c FK "Master-Detail"
        currency Amount__c
        datetime Payment_Date__c
        picklist Payment_Method__c
        picklist Transaction_Status__c
        string Gateway_Reference__c
    }

    REASSESSMENT_REQUEST {
        Id id PK
        string Request_Number__c UK "External ID"
        Id Property__c FK "Lookup"
        Id Original_Assessment__c FK "Lookup"
        string Requested_Change__c
        string Supporting_Reason__c
        picklist Approval_Status__c
        string Decision_Comments__c
    }

    CASE {
        Id id PK
        string CaseNumber
        Id ContactId FK
        string Subject
        string Description
        picklist Priority
        picklist Status
    }
```

---

## 2. Integrity and Cascade Rules

1. **`Property__c` ➔ `Tax_Assessment__c` (Master-Detail)**:
   - Deleting a property automatically cleanses linked assessment dockets to prevent orphaned tax liabilities.
   - Rollup summary fields compute Total Lifetime Tax Assessed on `Property__c`.
2. **`Tax_Assessment__c` ➔ `Tax_Payment__c` (Master-Detail)**:
   - Rollup summary fields dynamically compute `Amount_Paid__c` and `Outstanding_Amount__c` on `Tax_Assessment__c`.
   - Reparenting of payment records is strictly prohibited (`reparentableMasterDetail=false`).
3. **`Property__c` ➔ `Reassessment_Request__c` (Lookup with SetNull)**:
   - Preserves legal audit records if property details are updated.
