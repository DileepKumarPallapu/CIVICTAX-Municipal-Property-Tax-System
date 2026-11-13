# CIVICTAX API Catalog & Documentation

## 1. Gateway & REST Routing Architecture

CivicTax exposes two primary API tiers:
1. **Express Backend Endpoints (`http://localhost:3001`)**: Handles PKCE OAuth negotiation, session validation, and status inspection.
2. **Apex REST Endpoints (`/services/apexrest/civictax/v1/*`)**: Authoritative municipal operations in Salesforce, accessed via the backend proxy.

---

## 2. Endpoint Catalog

### A. Authentication & Health Endpoints (Express Gateway)

#### 1. Initiate Salesforce OAuth 2.0 PKCE Flow
- **Method**: `GET`
- **Path**: `/auth/salesforce`
- **Access**: Public / Browser Redirect
- **Description**: Generates cryptographic state, code verifier, and SHA-256 challenge, then redirects to Salesforce login.

#### 2. OAuth Callback
- **Method**: `GET`
- **Path**: `/auth/salesforce/callback?code=...&state=...`
- **Access**: Public / Salesforce OAuth Server
- **Description**: Validates CSRF state, exchanges code for access/refresh tokens, creates an encrypted `civictax.sid` cookie, and redirects to frontend `/admin/salesforce`.

#### 3. Integration Status
- **Method**: `GET`
- **Path**: `/api/salesforce/status`
- **Access**: Cookie Authenticated (`civictax.sid`)
- **Response Format**:
  ```json
  {
    "connected": true,
    "instanceUrl": "https://yourorg.my.salesforce.com",
    "orgId": "00DXXXXXXXXXXXX",
    "username": "admin@civictax.playground",
    "apiVersion": "v60.0",
    "authMode": "PKCE_EXTERNAL_CLIENT_APP"
  }
  ```

---

### B. Apex REST Endpoints (Salesforce Platform)

#### 1. List / Query Properties
- **Method**: `GET`
- **Path**: `/services/apexrest/civictax/v1/properties`
- **Headers**: `Authorization: Bearer <access_token>`, `Accept: application/json`
- **Description**: Returns a list of properties with verification status and GIS coordinates.

#### 2. Register New Property
- **Method**: `POST`
- **Path**: `/services/apexrest/civictax/v1/properties`
- **Request Format**:
  ```json
  {
    "propertyNumber": "CT-PROP-2024-001",
    "address": "Flat 402, Shanti Heights, Civil Lines",
    "category": "RESIDENTIAL",
    "builtUpArea": 1200,
    "zone": "Z-CENTRAL",
    "documentReference": "DOC-MH-2024-8849",
    "latitude": 18.5204,
    "longitude": 73.8567
  }
  ```
- **Response (201 Created)**: Returns the created `Property__c` record with Salesforce ID.

#### 3. Record Tax Payment
- **Method**: `POST`
- **Path**: `/services/apexrest/civictax/v1/payments`
- **Request Format**:
  ```json
  {
    "assessmentId": "a00XXXXXXXXXXXX",
    "amountPaid": 6000.00,
    "paymentMethod": "UPI",
    "transactionId": "TXN-UPI-2024-99124"
  }
  ```
- **Response (201 Created)**: Returns the confirmed `Tax_Payment__c` record; parent assessment balance is automatically updated.

#### 4. Municipal Operations Dashboard Metrics
- **Method**: `GET`
- **Path**: `/services/apexrest/civictax/v1/dashboard`
- **Response Format**:
  ```json
  {
    "totalProperties": 20,
    "verifiedProperties": 16,
    "pendingProperties": 4,
    "totalAssessedTax": 350000.00,
    "totalRevenueCollected": 274500.00
  }
  ```
