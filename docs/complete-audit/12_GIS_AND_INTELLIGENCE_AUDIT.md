# 12 — CivicTax GIS & Municipal Intelligence Audit

## 1. GIS Property Intelligence Audit

- **Map Engine**: Leaflet & React-Leaflet with OpenStreetMap tile provider.
- **Coordinate Validation**: WGS-84 ranges (`-90 <= lat <= 90`, `-180 <= lng <= 180`).
- **Synthetic Marker Disclosures**: All demo parcels feature `isSynthetic: true` with a clear warning: *"Synthetic Demonstration Coordinate — Not an authoritative or land-registry verified municipal cadastral parcel"*.
- **Filtering**: Synchronized category, zone, and verification filters across both the map view and data table.

---

## 2. Revenue Recovery & Arrears Aging Audit

- **Aging Buckets**: Automatically computed from due dates:
  1. `Not Due` ($\le 0$ days)
  2. `1–30 Days` (2% fee)
  3. `31–60 Days` (5% fee)
  4. `61–90 Days` (10% fee)
  5. `>90 Days` (18% p.a. legal action)
- **Case Priority**: Auto-classified into `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.

---

## 3. Explainable Compliance Monitor Audit

- **Rule Catalog**: Evaluates rules **CMP-001** through **CMP-008** covering duplicate properties, dimension anomalies, missing active tax rates, and SLA breaches.
- **Review Indicator Guarantee**: Alerts are presented as review indicators requiring officer resolution comments rather than unverified convictions.

---

## 4. Revenue Forecasting Audit

- **Predictive Models**: Simple Moving Average (SMA), Weighted Moving Average (WMA), and Linear Trend Line (OLS Regression).
- **Data Invariant**: Models execute strictly over verified, successful payment ledgers.
- **Observation Safeguard**: Requires $n \ge 3$ periods before outputting forecasts; displays informative fallback otherwise.
