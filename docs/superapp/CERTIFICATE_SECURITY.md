# CIVICTAX Certificate Management & Eligibility Security

## 1. Supported Municipal Certificates

1. **Tax Clearance Certificate (TCC)**:
   - **Eligibility Invariant**: Granted only when all assessments for the parcel have `outstandingBalance === 0` and status `PAID`.
   - **Notice**: Clearly labeled as an educational municipal demonstration document.
2. **Property Ownership Certificate (Khata Certificate)**:
   - **Eligibility Invariant**: Parcel must be in status `VERIFIED` with validated title deed index reference.
3. **Assessment Statement**:
   - Official multi-year valuation summary for bank or legal representation.

---

## 2. Certificate Security & Revocation

- **Tamper-Evident Digest**: Each certificate contains an opaque 16-character SHA-256 hash digest (e.g. `CERT-TCC-2024-991A`).
- **Superseded Invalidation**: Issuing a revised tax assessment automatically marks prior clearance certificates for that fiscal year as `SUPERSEDED`.
