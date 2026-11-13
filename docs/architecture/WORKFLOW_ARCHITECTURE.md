# CIVICTAX Workflow Architecture

## 1. End-to-End Municipal Tax Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Portal as CivicTax React Portal
    participant Gateway as Express Gateway (Port 3001)
    participant SF as Salesforce Multi-Tenant Platform
    actor Officer as Municipal Officer

    Note over Citizen,Officer: Phase 1: Property Registration & Verification
    Citizen->>Portal: Submit Property (Area, Category, Zone, Deed Ref)
    Portal->>Gateway: POST /properties (Payload)
    Gateway->>SF: Apex REST insert Property__c
    SF->>SF: PropertyTrigger (Set PENDING, Timestamp)
    SF-->>Portal: Record Confirmed (CT-PROP-2024-001)
    Officer->>Portal: Review Registered Deed & Physical Inspection
    Officer->>SF: Update Verification_Status__c = 'VERIFIED'

    Note over Citizen,Officer: Phase 2: Annual Assessment & Authoritative Billing
    SF->>SF: TaxCalculationService (Area × Rate + Penalties - Rebates)
    SF->>SF: Insert Tax_Assessment__c (Status = 'APPROVED', Balance Due)

    Note over Citizen,Officer: Phase 3: Simulated Payment Settlement
    Citizen->>Portal: Open Assessment & Initiate Payment (UPI/Card)
    Portal->>Gateway: POST /payments (Amount, Transaction ID)
    Gateway->>SF: PaymentService.recordPayment() (FOR UPDATE Lock)
    SF->>SF: Insert Tax_Payment__c
    SF->>SF: TaxPaymentTrigger (Rollup Paid Amount, Update Outstanding Balance)
    SF-->>Portal: Payment Receipt Generated (PAID or PARTIALLY_PAID)

    Note over Citizen,Officer: Phase 4: Grievance or Reassessment (If Disputed)
    Citizen->>Portal: Submit Grievance / Reassessment Request
    Portal->>SF: Insert Grievance__c / Reassessment_Request__c
    Officer->>SF: Review, Resolve & Record Resolution Comments
```

---

## 2. OAuth 2.0 PKCE Authentication Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Browser as React Frontend (Port 5173)
    participant Gateway as Express Gateway (Port 3001)
    participant SF as Salesforce Authorization Server

    Admin->>Browser: Click "Connect Salesforce Playground"
    Browser->>Gateway: GET /auth/salesforce
    Gateway->>Gateway: Generate state, verifier, and SHA-256 code challenge
    Gateway->>Gateway: Store state & verifier in req.session
    Gateway-->>Browser: HTTP 302 Redirect to Salesforce login
    Browser->>SF: Open Salesforce OAuth Approval Dialog
    Admin->>SF: Authenticate & Authorize CivicTax Gateway
    SF-->>Browser: Redirect to callback URL with auth code & state
    Browser->>Gateway: GET /auth/salesforce/callback?code=...&state=...
    Gateway->>Gateway: Verify state token matches session state
    Gateway->>SF: POST /services/oauth2/token (code + code_verifier)
    SF-->>Gateway: Return access_token, refresh_token, instance_url
    Gateway->>Gateway: Store tokens in session memory; issue civictax.sid cookie
    Gateway-->>Browser: Redirect to /admin/salesforce?status=success
    Browser->>Gateway: GET /api/salesforce/status (Cookie Authenticated)
    Gateway-->>Browser: Return connected: true (Zero tokens leaked)
```
