# CivicTax Apex Classes & Service Layer Documentation

## 1. Apex Service Architecture

CivicTax adheres to clean object-oriented architecture and enterprise design patterns.

---

## 2. Core Service Classes Implemented

### 2.1 `PropertyService.cls`
- **Class Modifiers**: `public with sharing class PropertyService`
- **Constructors**: Default no-arg constructor.
- **Methods**:
  - `registerProperty(Property__c prop, Id contactId)`: Ingests parcel, links to citizen, and auto-routes zonal officer.
  - `verifyProperty(Id propertyId, String verificationNotes)`: Sets verification status to `VERIFIED` and logs survey notes.
  - `getPropertiesByOwner(Id contactId)`: Returns permitted properties with relationship queries to assessments and payments.
- **Exception Handling**: Throws custom `CivicTaxException` with user-friendly error envelopes.

### 2.2 `TaxCalculationService.cls`
- **Class Modifiers**: `public with sharing class TaxCalculationService`
- **Purpose**: Authoritative financial computation using `Decimal` currency math.
- **Methods**:
  - `calculateBaseTax(Decimal builtUpArea, Decimal ratePerSqFt)`: Returns `builtUpArea * ratePerSqFt` rounded to scale 2.
  - `applyEarlyBirdRebate(Decimal baseTax, Date paymentDate, Date dueDate)`: Evaluates if payment is $\ge 30$ days prior to due date ($5\%$ discount).
  - `calculateArrearsPenalty(Decimal baseTax, Date dueDate, Date asOfDate)`: Evaluates delinquency duration:
    - $1-30$ days: $2\%$
    - $31-60$ days: $5\%$
    - $>60$ days: $10\%$

### 2.3 `PaymentService.cls`
- **Class Modifiers**: `public with sharing class PaymentService`
- **Purpose**: Transactional payment processing.
- **Methods**:
  - `processPayment(Id assessmentId, Decimal amount, String method, String txId)`:
    - Sets `Database.setSavepoint()`.
    - Queries `Tax_Assessment__c` with `FOR UPDATE` pessimistic row locking.
    - Validates against overpayment and duplicate transaction hash.
    - Inserts `Tax_Payment__c`.
    - Updates parent `Tax_Assessment__c` status and balance.

### 2.4 `CivicTaxRestResource.cls`
- **Annotation**: `@RestResource(urlMapping='/civictax/v1/*')`
- **Endpoints**:
  - `@HttpGet doGet()`: Dispatches requests for properties, assessments, and dashboard stats.
  - `@HttpPost doPost()`: Dispatches creation requests for properties, payments, and grievances.
