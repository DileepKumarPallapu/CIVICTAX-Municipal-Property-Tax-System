# 13 — CivicTax Digital Municipal Super App Audit

## 1. PWA & Service Worker Audit

- **Web App Manifest (`public/manifest.json`)**: Configured with name, short name, theme color (`#101D32`), background color (`#F5F7FB`), and standalone display mode.
- **Service Worker (`public/sw.js`)**:
  - Implements application-shell caching (`/`, `/index.html`, `/manifest.json`, `/favicon.svg`).
  - Strict security rule: network calls to `/api/` or sensitive financial operations bypass the cache to prevent storing confidential records offline.
- **Offline Indicator**: UI informs the citizen when network connectivity drops.

---

## 2. Digital Document Vault & QR Verification

- **Document Categories**: Ownership Deeds, Tax Statements, Payment Receipts, Assessment Notices.
- **MIME & Size Validation**: Enforces PDF/PNG/JPEG validation with a 5MB per-file cap.
- **QR Receipt Verification**: Generated payment receipts feature a verification QR code embedding receipt ID, timestamp, and digital signature hash.

---

## 3. Tamil Localization Audit

- **Dictionary Coverage**: Complete bilingual strings in `LocalizationContext.tsx` across citizen, officer, and public terminology (e.g. *"சொத்து வரி"* for Property Tax, *"ரசீது"* for Receipt).
- **Dynamic Switching**: Instantly toggles between English and Tamil with zero page reload.
