# CIVICTAX Tax Assessment Billing Lifecycle

## 1. End-to-End Assessment Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Municipal Officer
    participant UI as OfficerAssessmentsPage.tsx
    participant Service as LocalAssessmentService / Apex REST
    participant Store as LocalStorage / Tax_Assessment__c
    actor Citizen as Citizen Property Owner

    Officer->>UI: Select Verified Property (CT-PROP-2024-001)
    UI->>Service: Check Verification Status ('VERIFIED')
    alt If Property is PENDING or REJECTED
        Service-->>UI: Reject: "Property must be verified before assessment"
    else If Property is VERIFIED
        Officer->>UI: Select Fiscal Year (2024-2025)
        UI->>Service: Fetch Active Gazette Rate for Category
        Service->>Service: Calculate BaseTax, Penalty, TotalTax Demand
        Officer->>UI: Click "Generate & Approve Assessment"
        Service->>Store: Insert Tax_Assessment__c (Status = 'APPROVED')
        Service->>Store: Dispatch Citizen Notification ("New Assessment Issued")
        Store-->>UI: Assessment Created (CT-ASM-2024-001)
    end
    Citizen->>UI: Open Portal (/citizen/assessments)
    UI-->>Citizen: Display Bill Breakdown, Applied Rate, Due Date
```

---

## 2. Assessment Status State Progression

- **`DRAFT`**: Generated internally; awaiting officer rate confirmation.
- **`APPROVED`**: Active, payable municipal tax demand visible to the citizen.
- **`PARTIALLY_PAID`**: Validated installment payment recorded; balance remains $>0$.
- **`PAID`**: Fully settled assessment; outstanding balance equals ₹0.00.
- **`OVERDUE`**: Statutory payment deadline has passed with unpaid outstanding balance. Late penalty surcharge applied.
