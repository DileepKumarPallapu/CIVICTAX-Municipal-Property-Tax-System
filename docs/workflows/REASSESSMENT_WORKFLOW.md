# CIVICTAX Reassessment Appeals Workflow Specification

## 1. Reassessment Entity Schema & Purpose

The Reassessment module allows citizens to formally challenge an annual tax valuation without altering or corrupting the original historical bill.

```mermaid
classDiagram
    class ReassessmentRequest {
        +string id
        +string requestNumber
        +string propertyId
        +string propertyNumber
        +string assessmentId
        +string assessmentNumber
        +string citizenId
        +string citizenName
        +number currentBaseTax
        +number currentTotalTax
        +number requestedValue
        +string reason
        +string supportingDocuments
        +ReassessmentStatus status
        +string assignedOfficerId
        +string assignedOfficerName
        +string officerComments
        +string reviewDate
        +string createdAt
    }
```

---

## 2. Reassessment Workflow & Financial Integrity Guard

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant UI as CitizenReassessmentsPage.tsx
    participant Service as LocalReassessmentService
    participant Store as Database / Reassessment_Request__c
    actor Officer as Municipal Officer

    Citizen->>UI: Select Bill (CT-ASM-2024-001) & Dispute Value
    Citizen->>UI: Enter Disputed Valuation, Reason, Supporting Deed Map
    UI->>Service: submitReassessmentRequest(DTO)
    Service->>Store: Create Record (REQ-2024-001, Status = 'PENDING')
    Service-->>Citizen: Reference Assigned & Trackable
    Officer->>UI: Open Officer Review (/officer/reassessments)
    Officer->>UI: Compare Sanctioned Built-Up Map vs. Gazette Rate
    alt If Valuation Approved
        Officer->>Service: approveReassessment(requestId, revisedArea, comments)
        Note over Service: Original Assessment Is NEVER Overwritten!
        Service->>Store: Create Revised Assessment (CT-ASM-2024-001-REV)
        Service->>Store: Update Reassessment Status = 'APPROVED'
    else If Valuation Rejected
        Officer->>Service: rejectReassessment(requestId, justificationComments)
        Service->>Store: Update Reassessment Status = 'REJECTED'
    end
    Service->>Store: Dispatch Citizen Notification
```

### Invariant: Non-Destructive Revision
- When a reassessment is approved, the original `TaxAssessment` remains intact in the ledger as historical audit evidence.
- A new linked revision assessment (e.g. `CT-ASM-2024-001-REV`) is generated, adjusting the balance forward.
