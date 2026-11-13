# CIVICTAX API Contracts & Schemas

## 1. REST Contract Specifications

### A. Property Registration (`POST /api/salesforce/proxy/properties` or Local Adapter)
- **Request Headers**: `Content-Type: application/json`
- **Request Schema**:
  ```json
  {
    "propertyNumber": "string (required, unique, e.g. CT-PROP-2024-001)",
    "address": "string (required, min 10 chars)",
    "category": "string (required, 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL')",
    "builtUpArea": "number (required, > 0)",
    "zone": "string (required, e.g. 'zone-1')",
    "documentReference": "string (required, deed index reference)",
    "constructionYear": "number (optional, <= current year)",
    "latitude": "number (optional, -90 to 90)",
    "longitude": "number (optional, -180 to 180)"
  }
  ```
- **Response Schema (201 Created)**:
  ```json
  {
    "id": "string (UUID / SF ID)",
    "propertyNumber": "string",
    "verificationStatus": "PENDING",
    "registrationDate": "ISO8601 Timestamp"
  }
  ```

---

### B. Payment Settlement (`POST /api/salesforce/proxy/payments` or Local Adapter)
- **Request Schema**:
  ```json
  {
    "assessmentId": "string (required)",
    "amountPaid": "number (required, > 0)",
    "paymentMethod": "string ('UPI' | 'NET_BANKING' | 'CARD')",
    "transactionId": "string (required, unique)"
  }
  ```
- **Response Schema (201 Created)**:
  ```json
  {
    "id": "string",
    "assessmentId": "string",
    "amountPaid": 6000.00,
    "paymentStatus": "SUCCESS",
    "transactionId": "TXN-UPI-2024-99124",
    "receiptNumber": "RCT-2024-99124",
    "newOutstandingBalance": 6500.00,
    "newAssessmentStatus": "PARTIALLY_PAID"
  }
  ```

---

### C. Grievance Submission (`POST /api/salesforce/proxy/grievances` or Local Adapter)
- **Request Schema**:
  ```json
  {
    "propertyId": "string (optional)",
    "subject": "string (required, max 255 chars)",
    "description": "string (required, min 10 chars)",
    "priority": "string ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')"
  }
  ```
- **Response Schema (201 Created)**:
  ```json
  {
    "id": "string",
    "grievanceNumber": "GRV-2024-001",
    "status": "OPEN",
    "createdAt": "ISO8601 Timestamp"
  }
  ```
