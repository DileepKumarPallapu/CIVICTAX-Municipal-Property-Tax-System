# CIVICTAX Property Registration & Verification Workflows

## 1. Citizen Registration Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant UI as RegisterPropertyPage.tsx
    participant Service as LocalPropertyService / API
    participant Store as LocalStorage / Property__c
    actor Officer as Municipal Officer

    Citizen->>UI: Input Built-Up Area, Category, Zone, Address, Deed Ref
    UI->>UI: Client-Side Validation (Area > 0, Year <= Current, Non-Empty)
    Citizen->>UI: Click "Submit Registration"
    UI->>Service: createProperty(PropertyDTO)
    Service->>Service: Check Duplicate Property Number & Deed Ref
    Service->>Store: Persist Record (Status = 'PENDING')
    Service->>Store: Generate Application Notification & Audit Entry
    Service-->>UI: Return Created Property (CT-PROP-2024-...)
    UI-->>Citizen: Display Confirmation Card & Reference Number

    Note over Citizen,Officer: Officer Digital Deed & Site Inspection
    Officer->>UI: Open Assigned Properties (/officer/verification)
    Officer->>UI: Inspect Title Deed Index & Land Records
    Officer->>Service: updateVerificationStatus(propertyId, 'VERIFIED', comments)
    Service->>Store: Update VerificationStatus = 'VERIFIED', VerificationDate = NOW()
    Service->>Store: Notify Citizen ("Property CT-PROP-... Approved")
    Service-->>Officer: Confirmation Toast
    Note over Citizen,Officer: Property is Now Eligible for Tax Assessment
```

---

## 2. Multi-Tab Property Details Workspace

In `src/pages/citizen/MyPropertiesPage.tsx` and `src/pages/officer/PropertyVerificationPage.tsx`, selecting any property opens the unified workspace providing:
1. **Overview Tab**: Parcel summary, category badge, built-up dimensions, and municipal ward details.
2. **Ownership Tab**: Registered citizen legal name, email, phone, and sub-registrar deed reference number.
3. **Documents Tab**: Uploaded Index-II deed reference and municipal layout approvals.
4. **Assessments Tab**: Historical and current annual property tax bills tied to this parcel.
5. **Payments Tab**: Ledger of all settled tax receipts and transaction references.
6. **Service Requests Tab**: Linked grievances, ownership transfer tickets, and reassessment appeals.
7. **Activity History Tab**: Chronological audit trail of all status transitions and officer remarks.
