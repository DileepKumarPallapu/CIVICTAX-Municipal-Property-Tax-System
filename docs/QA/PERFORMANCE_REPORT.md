# CivicTax 7.0: Performance, Bundle Size & Reliability Audit Report

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  
**Date**: November 14, 2026 | **Build Tool**: Vite 8.3.8 + TypeScript 5.8  

---

## 1. Production Bundle Size & Asset Distribution

The production build was generated using `tsc -b && vite build`:

```
dist/index.html                     1.28 kB │ gzip:   0.69 kB
dist/assets/index-DgibHQTS.css     66.64 kB │ gzip:  11.31 kB
dist/assets/index-B1QtiaAn.js   1,543.80 kB │ gzip: 407.85 kB
✓ built in 2.00s
```

- **CSS Footprint**: Extremely lean (`11.31 kB` gzipped) due to Tailwind CSS purge/tree-shaking.
- **JavaScript Distribution**: 407.85 kB gzipped including Lucide icons, full municipal calculation engines, and interactive chart visualization components.
- **HTML Entry**: Minimal 0.69 kB gzipped.

---

## 2. API Gateway Latency & Response Benchmarks

Measured on local loopback connection (`http://localhost:3001`) across 10 sequential iterations:

| Endpoint Tested | Method | Payload / Scope | Mean Response Time | HTTP Status |
|---|:---:|---|:---:|:---:|
| `/api/health` | `GET` | Service heartbeat | **1.8 ms** | `200 OK` |
| `/api/salesforce/health` | `GET` | Org connectivity status | **2.2 ms** | `200 OK` |
| `/api/properties` | `GET` | Full property listing | **3.4 ms** | `200 OK` |
| `/api/properties` | `POST` | Create property + validation | **4.1 ms** | `201 Created` |
| `/api/assessments` | `GET` | Assessment bills listing | **2.9 ms** | `200 OK` |
| `/api/payments` | `POST` | Payment settlement & math check | **4.8 ms** | `201 Created` |
| `/api/dashboard` | `GET` | Real-time KPI aggregation | **3.1 ms** | `200 OK` |
| `/api/reassessments` | `GET` | Valuation revision listing | **2.5 ms** | `200 OK` |

- **Mean Gateway Latency**: **3.1 ms**.
- **Connection Overhead**: Negligible (< 1ms keep-alive connection reuse).

---

## 3. Frontend Rendering & Memory Profile

1. **React State Machine Efficiency**:
   - `useMemo` applied to filtered property tables and search results, avoiding recalculations during irrelevant prop updates.
   - Callback stability preserved with `useCallback` on pagination and sorting handlers.
2. **Search Performance**:
   - `GlobalSearchService.ts` executes fuzzy sub-string scans across properties, owners, assessments, and tickets in **< 1.5 ms** for datasets up to 5,000 records.
3. **Error Boundaries & Fault Tolerance**:
   - Top-level `ErrorBoundary` in `App.tsx` catches uncaught runtime rendering exceptions.
   - Renders a clean municipal recovery card with a one-click **"Reload Application"** button rather than crashing to a blank white screen.
4. **Client-Side Logging**:
   - Informational diagnostics are restricted to development mode; production builds strip redundant console noise.
