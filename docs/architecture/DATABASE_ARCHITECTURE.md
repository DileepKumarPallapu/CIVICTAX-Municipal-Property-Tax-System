# CIVICTAX Database Architecture

## 1. Entity-Relationship Model

```mermaid
erDiagram
    CONTACT ||--o{ PROPERTY : "owns"
    PROPERTY ||--o{ TAX_ASSESSMENT : "assessed against"
    PROPERTY ||--o{ GRIEVANCE : "filed for"
    PROPERTY ||--o{ REASSESSMENT_REQUEST : "appeals"
    TAX_ASSESSMENT ||--o{ TAX_PAYMENT : "settled by"
    PROPERTY_ZONE ||--o{ PROPERTY : "contains"

    PROPERTY {
        string Id PK
        string Property_Number__c UK "External ID"
        string Property_Address__c
        string Property_Category__c "RESIDENTIAL | COMMERCIAL | INDUSTRIAL"
        decimal Built_Up_Area__c
        string Zone__c
        string Verification_Status__c "PENDING | VERIFIED | REJECTED"
        decimal Latitude__c
        decimal Longitude__c
        string Ownership_Document__c
        datetime Registration_Date__c
    }

    TAX_ASSESSMENT {
        string Id PK
        string Property__c FK "Lookup to Property__c"
        string Assessment_Year__c "e.g. 2024-2025"
        currency Base_Value__c
        currency Total_Amount__c
        currency Amount_Paid__c
        currency Outstanding_Amount__c
        string Assessment_Status__c "DRAFT | APPROVED | PARTIALLY_PAID | PAID | OVERDUE"
        date Due_Date__c
    }

    TAX_PAYMENT {
        string Id PK
        string Assessment__c FK "Lookup to Tax_Assessment__c"
        currency Amount_Paid__c
        datetime Payment_Date__c
        string Transaction_ID__c UK "External ID"
        string Payment_Method__c "UPI | NET_BANKING | CARD"
        string Payment_Status__c "SUCCESS | FAILED"
    }

    GRIEVANCE {
        string Id PK
        string Property__c FK "Lookup to Property__c"
        string Subject__c
        string Description__c
        string Status__c "OPEN | IN_PROGRESS | RESOLVED"
        string Priority__c "LOW | MEDIUM | HIGH | CRITICAL"
        string Resolution_Comments__c
        datetime Resolution_Date__c
    }
```

---

## 2. Implemented vs. Proposed Objects

| Object Name | API Name | Implementation Status | Purpose |
| :--- | :--- | :--- | :--- |
| **Property** | `Property__c` | **Implemented** | Core municipal property parcel registry with GIS coordinates. |
| **Tax Assessment** | `Tax_Assessment__c` | **Implemented** | Annual property tax bill with assessed demands and balances. |
| **Tax Payment** | `Tax_Payment__c` | **Implemented** | Financial transaction receipt records with unique transaction IDs. |
| **Grievance** | `Grievance__c` | **Implemented** | Citizen municipal service complaints and officer resolution notes. |
| **Reassessment Request** | `Reassessment_Request__c` | **Implemented** | Formal dispute appeals challenging property valuation. |
| **Tax Rate** | `Tax_Rate__c` | **Implemented** | Gazette rate matrix per sq ft across property categories. |
| **Property Zone** | `Property_Zone__c` | **Implemented** | Municipal ward boundaries and revenue targets. |
| **Recovery Case** | `Recovery_Case__c` | **Implemented** | Delinquent arrears tracking across 4 aging buckets. |
| **Compliance Alert** | `Compliance_Alert__c` | **Implemented** | Rule-based data integrity findings and officer remediation logs. |
| **Municipal Task** | `Municipal_Task__c` | *Proposed* | Officer inspection calendar and field task scheduling. |
| **Application Audit** | `Application_Audit__c` | *Proposed* | Immutable cloud ledger for administrative action auditing. |
