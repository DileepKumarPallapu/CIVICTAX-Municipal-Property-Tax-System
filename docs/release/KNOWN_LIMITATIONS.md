# CivicTax Known Technical & Operational Limitations

## 1. Architectural & Operational Boundaries

To maintain rigorous academic honesty and professional software standards, this document specifies all known technical constraints, demo-mode approximations, and planned roadmap items for CivicTax.

---

## 2. Documented Limitations

### 2.1 Salesforce Trailhead Playground Authorization
- **Status**: Salesforce DX metadata is completely developed, formatted, and staged under `salesforce/force-app/`.
- **Limitation**: The target alias `CivicTaxPlayground` requires interactive browser login (`sf org login web`) by the developer. Until authenticated, the system operates authoritatively on the full-featured Local Data Service.

### 2.2 Payment Gateway Rails
- **Status**: Complete end-to-end checkout flow with instant QR-receipt generation.
- **Limitation**: Transactions are executed in **Demonstration Simulation Mode**. Live bank settlement (Razorpay/BillDesk/NPCI UPI rails) requires institutional merchant credentials and production KYC.

### 2.3 Cadastral GIS Data
- **Status**: Interactive Leaflet parcel visualization with zone boundaries and filtering.
- **Limitation**: Demo parcel coordinates are synthetic approximations centered on the Greater Chennai Corporation. They are explicitly tagged with `isSynthetic: true` and must not be treated as legally binding cadastral land survey coordinates.

### 2.4 Browser-Side PWA Background Synchronization
- **Status**: Full Web App Manifest and Service Worker application-shell caching.
- **Limitation**: Offline background tax payment queuing is intentionally disabled to adhere to municipal financial security standards preventing unauthorized offline double-debits.
