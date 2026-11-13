# 17 — CivicTax Defect Register & Vulnerability Catalog

## 1. Defect Classification Standard

- **CRITICAL**: Security vulnerability, data corruption, calculation error.
- **HIGH**: Broken workflow, unauthorized record access, unhandled crash.
- **MEDIUM**: Feature gap, broken navigation, missing validation message.
- **LOW**: Minor spacing inconsistency, unused import warning, non-breaking linter note.

---

## 2. Audit Defect Registry

| Defect ID | Description | Severity | Affected Module | Root Cause | Status | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | Unused Import Warnings | `LOW` | Multiple (`LocalPropertyService.ts`, etc.) | Lingering type imports after refactoring | **IDENTIFIED** | Prune unused imports to optimize build hygiene. |
| **DEF-002** | `setState` in `useEffect` Warnings | `LOW` | `CitizenPaymentPortalPage.tsx`, `CitizenReassessmentsPage.tsx` | Synchronous state synchronization on mount | **IDENTIFIED** | Verified non-breaking; benign React compiler warning. |
| **DEF-003** | Target Org `CivicTaxPlayground` Unauthorized | `MEDIUM` | Salesforce Integration | Developer environment has not run interactive web login | **BLOCKED (EXT)**| Run `sf org login web` when ready to deploy metadata. |
| **DEF-004** | Live Payment Banking Rails | `MEDIUM` | Payment Portal | Local demonstration simulation mode | **DOCUMENTED** | Connect institutional merchant gateway credentials for production. |

---

## 3. Critical Defects Assessment

- **Critical Security Defects**: **0**
- **Financial Calculation Defects**: **0**
- **Data Loss / Corruption Defects**: **0**
- **Dead Buttons**: **0**
