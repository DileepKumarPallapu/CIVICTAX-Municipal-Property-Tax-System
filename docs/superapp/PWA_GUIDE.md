# CIVICTAX Progressive Web Application (PWA) Architecture

## 1. PWA & Service Worker Blueprint

CivicTax implements modern Progressive Web Application standards:
- **Web App Manifest (`public/manifest.json`)**: Standalone display mode, brand Midnight Navy theme (`#101D32`), responsive icons, and launch settings.
- **Service Worker (`public/sw.js`)**:
  - Safe application-shell caching (`CACHE_NAME = 'civictax-app-shell-v1'`).
  - Strict security policy: Network requests to `/api/` and payment transactions are **never cached** to protect citizen financial privacy.
  - Offline fallback to cached `/index.html` shell when offline.

---

## 2. Offline Resilience Policy

| Resource Type | Offline Behavior | Security & Data Integrity Rule |
| :--- | :--- | :--- |
| **Static Assets (CSS, JS, Fonts)** | Served from Service Worker Cache | Fast reload with zero network overhead. |
| **Property Registration Drafts** | Saved to local draft storage | Marked as `LOCAL_DRAFT`; cannot generate active assessment bills. |
| **Payment Transactions** | **Strictly Blocked When Offline** | Payments require real-time validation and cannot be queued offline to prevent double-spending. |
| **Document Vault** | Metadata viewable; downloads require online fetch | Prevents stale unauthorized binary file retention. |
