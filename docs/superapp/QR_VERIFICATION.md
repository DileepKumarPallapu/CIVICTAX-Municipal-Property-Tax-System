# CIVICTAX QR Verification & Public Authenticity Architecture

## 1. Opaque QR Code Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Verifier as External Verifier (Bank / Registrar)
    participant Phone as QR Code Scanner
    participant Portal as CivicTax Transparency (/verify)
    participant Registry as Municipal Record Database

    Phone->>Verifier: Scans QR code on certificate / receipt
    Phone->>Portal: Opens URL with opaque reference (e.g. /verify?ref=RCT-2024-001)
    Portal->>Registry: Lookup Receipt / Certificate by Opaque Reference
    alt Record Authentic & Active
        Registry-->>Portal: Valid Data (Status = SUCCESS, Paid Amount, Fiscal Year)
        Portal-->>Verifier: Display Green Seal: "Authentic Municipal Receipt"
    else Record Invalid or Tampered
        Registry-->>Portal: Not Found / Hash Mismatch
        Portal-->>Verifier: Display Red Warning: "Unverified Document"
    end
```

---

## 2. Privacy & Zero-PII Policy

When external parties scan a QR verification code:
- **Exposed Data**: Property Number, Assessment Year, Amount Paid, Payment Timestamp, Authenticity Status (`VALID` or `SUPERSEDED`).
- **Strictly Excluded Data**: Citizen legal name, mobile phone number, email address, bank account details, and street-level residential flat numbers.
