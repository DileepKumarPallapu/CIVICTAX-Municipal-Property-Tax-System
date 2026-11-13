# CIVICTAX Payment Processing & Receipt Generation Specification

## 1. Simulated Payment Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant UI as CitizenPaymentPortalPage.tsx
    participant Service as LocalPaymentService / PaymentService.cls
    participant Store as Database / Tax_Payment__c
    participant Viewer as ReceiptViewer.tsx

    Citizen->>UI: Select Bill & Choose Payment Option (Full or Partial)
    Citizen->>UI: Enter Amount (e.g. ₹6,000) & Method (UPI, Card, NetBanking)
    UI->>UI: Client-Side Guard (Amount > 0 and <= OutstandingBalance)
    Citizen->>UI: Click "Pay & Settle"
    UI->>Service: recordPayment(PaymentDTO)
    Service->>Service: Server-Side Validation & Duplicate Check (Transaction ID)
    Service->>Store: Insert Tax_Payment__c (Status = 'SUCCESS')
    Service->>Store: Recalculate Assessment (AmountPaid += 6000, Balance -= 6000)
    Service->>Store: Update Status ('PARTIALLY_PAID' or 'PAID')
    Service->>Store: Dispatch Settlement Notification
    Service-->>UI: Return Confirmed Payment Record
    UI->>Viewer: Open Printable Official Tax Clearance Receipt
    Viewer-->>Citizen: Download / Print PDF Tax Receipt
```

---

## 2. Educational Simulated Payment Notice
- **Zero Real Card / Banking Data Collection**: CivicTax strictly operates an educational simulation. No actual credit card numbers, CVVs, or bank OTPs are collected or processed.
- **Realistic Transaction Tokens**: Generates compliant transaction reference strings (e.g. `TXN-UPI-2024-98412`) for auditability.
- **Official Printable Receipt**: Formatted with municipal corporation header, QR verification code, parcel ID, tax period, breakdown, and timestamp.
