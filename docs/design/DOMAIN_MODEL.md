# CIVICTAX Domain Models & Entity Schema

## 1. Domain Entities Architecture

CivicTax domain entities follow strict typing in `src/types/index.ts` and Salesforce custom object mappings under `salesforce/force-app/main/default/objects/`.

```mermaid
classDiagram
    class Property {
        +string id
        +string propertyNumber
        +string ownerId
        +string ownerName
        +string address
        +PropertyCategory category
        +string zoneId
        +number builtUpArea
        +number constructionYear
        +string documentReference
        +PropertyVerificationStatus verificationStatus
        +number latitude
        +number longitude
        +string registrationDate
    }

    class TaxAssessment {
        +string id
        +string assessmentNumber
        +string propertyId
        +string propertyNumber
        +string assessmentYear
        +PropertyCategory category
        +number builtUpArea
        +number appliedRatePerSqFt
        +number baseTax
        +number penalty
        +number discount
        +number totalTax
        +number amountPaid
        +number outstandingBalance
        +TaxAssessmentStatus status
        +string dueDate
    }

    class Payment {
        +string id
        +string paymentNumber
        +string assessmentId
        +string assessmentNumber
        +string propertyId
        +number amountPaid
        +string paymentDate
        +PaymentMethod paymentMethod
        +string transactionId
        +PaymentStatus paymentStatus
        +string receiptNumber
    }

    class Grievance {
        +string id
        +string grievanceNumber
        +string propertyId
        +string citizenId
        +string subject
        +string description
        +GrievancePriority priority
        +GrievanceStatus status
        +string resolutionComments
        +string resolutionDate
    }

    class ReassessmentRequest {
        +string id
        +string requestNumber
        +string propertyId
        +string assessmentId
        +number requestedValue
        +string reason
        +ReassessmentStatus status
        +string officerComments
    }

    Property "1" --> "*" TaxAssessment : assesses
    TaxAssessment "1" --> "*" Payment : settles
    Property "1" --> "*" Grievance : lodges
    Property "1" --> "*" ReassessmentRequest : appeals
```

---

## 2. Comprehensive Entity Definitions

### 1. `Property` / `Property__c`
- **Primary Key**: `id` (UUID / Salesforce 18-char ID)
- **Business Reference**: `propertyNumber` (Unique External ID, e.g. `CT-PROP-2024-001`)
- **Foreign Keys**: `ownerId` $\rightarrow$ `User.id` / `Contact.Id`, `zoneId` $\rightarrow$ `MunicipalZone.id`
- **Fields**:
  - `builtUpArea`: Decimal(10,2), Required, $>0$
  - `category`: Picklist (`RESIDENTIAL`, `COMMERCIAL`, `INDUSTRIAL`, `AGRICULTURAL`)
  - `verificationStatus`: Picklist (`PENDING`, `VERIFIED`, `RESUBMISSION_REQUIRED`, `REJECTED`)
  - `documentReference`: Text(100), Title deed Index-II reference
  - `latitude`, `longitude`: Decimal(10,6), WGS84 coordinates

### 2. `TaxAssessment` / `Tax_Assessment__c`
- **Primary Key**: `id`
- **Business Reference**: `assessmentNumber` (Unique External ID, e.g. `CT-ASM-2024-001`)
- **Foreign Keys**: `propertyId` $\rightarrow$ `Property.id` (Master-Detail / Restrict Delete)
- **Financial Fields**:
  - `baseTax`: Currency(14,2), Area $\times$ Rate
  - `totalTax`: Currency(14,2), BaseTax + Penalty - Discount
  - `amountPaid`: Currency(14,2), Cumulative payments rollup
  - `outstandingBalance`: Currency(14,2), TotalTax - AmountPaid
  - `status`: Picklist (`DRAFT`, `APPROVED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`)
  - `dueDate`: Date, Statutory payment deadline

### 3. `Payment` / `Tax_Payment__c`
- **Primary Key**: `id`
- **Business Reference**: `transactionId` (Unique External ID, e.g. `TXN-UPI-2024-8841`)
- **Foreign Keys**: `assessmentId` $\rightarrow$ `TaxAssessment.id` (Master-Detail)
- **Fields**:
  - `amountPaid`: Currency(14,2), $>0$, $\le$ OutstandingBalance
  - `paymentMethod`: Picklist (`UPI`, `NET_BANKING`, `CARD`, `CASH_COUNTER`)
  - `paymentStatus`: Picklist (`SUCCESS`, `FAILED`, `PENDING`)
  - `receiptNumber`: Text(50), Unique generated receipt reference

### 4. `Grievance` / `Grievance__c`
- **Primary Key**: `id`
- **Business Reference**: `grievanceNumber` (Unique, e.g. `GRV-2024-001`)
- **Foreign Keys**: `propertyId` $\rightarrow$ `Property.id`, `citizenId` $\rightarrow$ `User.id`
- **Fields**:
  - `subject`: Text(255), Required
  - `description`: LongTextArea(32000), Required
  - `priority`: Picklist (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `status`: Picklist (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
  - `resolutionComments`: LongTextArea, Mandatory on resolution
