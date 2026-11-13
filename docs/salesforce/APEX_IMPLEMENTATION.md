# CivicTax Apex Implementation & Architecture Guide

## 1. Apex Service Architecture

CivicTax enforces enterprise separation of concerns across presentation, controller, domain service, and selector/data-access layers.

```
+-------------------------------------------------------------------------+
|                         APEX ARCHITECTURE LAYERS                        |
+-------------------------------------------------------------------------+

   [ CivicTaxRestResource ] / [ Lightning Web Components ]
                   |
                   v
        [ CivicTaxController ]  (Input Validation & Transformation)
                   |
                   v
     [ Domain Services ]
       - PropertyService
       - TaxCalculationService
       - TaxAssessmentService
       - PaymentService
       - GrievanceService
       - CivicTaxSearchService
                   |
                   v
     [ Asynchronous Layer ] (CivicTaxAsyncJobs)
       - Queueable Notification Dispatcher
       - Batch Assessment Generator
       - Schedulable Due-Date Monitor
```

---

## 2. Implemented Apex Service Classes

### 2.1 `PropertyService.cls`
- Encapsulates parcel lifecycle: registration, validation, officer assignment, and status updates.
- Bulk-safe handling using Maps and Sets to avoid SOQL/DML in loops.
- `registerProperty(Property__c prop, String ownerContactId)`
- `verifyProperty(Id propertyId, String officerComments)`

### 2.2 `TaxCalculationService.cls`
- Authoritative municipal tax computation using Salesforce `Decimal` with scale 2.
- Looks up active `Tax_Rate__c` records without overlapping effective periods.
- Base tax computation: $\text{Area} \times \text{Rate}$.
- Applies early-bird rebate discounts ($5\%$ if paid $\ge 30$ days prior to due date).
- Calculates statutory late penalties ($2\%$ flat for $1-30$ days overdue, $5\%$ for $31-60$ days).

### 2.3 `PaymentService.cls`
- Enforces ACID transaction integrity with `Database.setSavepoint()` and rollback.
- Validates external transaction hash idempotency to prevent duplicate payments.
- Updates parent `Tax_Assessment__c` outstanding balance and status via single-trigger handlers.

### 2.4 `CivicTaxRestResource.cls`
- Custom Apex REST endpoint mounted at `/services/apexrest/civictax/v1/*`.
- Handlers for `GET`, `POST`, `PUT`, with HTTP status code mappings (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`).
- Enforces user session context and field-level security checks before returning responses.
