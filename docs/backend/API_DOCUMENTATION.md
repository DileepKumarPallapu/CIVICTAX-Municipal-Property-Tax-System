# CIVICTAX Backend API Documentation

## 1. REST Endpoint Reference

### A. Health & System Status
- **`GET /api/health`**
  - **Status**: 200 OK
  - **Payload**: `{ "status": "HEALTHY", "service": "CivicTax Municipal Backend Services", "dataProvider": "LocalRepository" }`

### B. Property Management
- **`GET /api/properties`**: Returns array of registered parcels with optional category/zone filters.
- **`POST /api/properties`**: Registers a new parcel.
  - *Required*: `propertyNumber`, `address`, `category`, `builtUpArea`.
  - *Validation*: Rejects non-positive built-up areas with 400 Bad Request.
- **`GET /api/properties/:id`**: Returns single parcel record.
- **`PATCH /api/properties/:id/verify`**: Updates verification status (`VERIFIED`, `REJECTED`).

### C. Tax Assessments
- **`GET /api/assessments`**: Returns municipal assessment bills.
- **`GET /api/assessments/:id`**: Returns detailed assessment with breakdown.

### D. Treasury & Payments
- **`GET /api/payments`**: Returns payment receipts.
- **`POST /api/payments`**: Records simulated tax payment.
  - *Validation*: Amount $>0$ and $\le$ remaining balance; rejects duplicate `transactionId`.
  - *Atomic State*: Increments `amountPaid`, updates `outstandingBalance`, sets status to `PAID` or `PARTIALLY_PAID`.

### E. Grievances
- **`GET /api/grievances`**: Lists citizen complaints.
- **`POST /api/grievances`**: Submits a new ticket with mandatory subject and narrative.
