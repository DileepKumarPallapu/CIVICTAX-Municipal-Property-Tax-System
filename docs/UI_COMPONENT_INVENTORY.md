# CivicTax 2.0 UI Component Inventory

## 1. Core Reusable Component Library

| Component Name | File Path | Role / Design Function | Interactive Features |
| :--- | :--- | :--- | :--- |
| **`AppSidebar`** | `src/components/common/AppSidebar.tsx` | Collapsible navigation drawer | Role-specific nav items, unread counters, expand/collapse toggles, mobile drawer. |
| **`AppHeader`** | `src/components/common/AppHeader.tsx` | Sticky glassmorphic top navigation | Global search trigger (`Ctrl+K`), language switcher (`EN`/`TA`), theme toggle, profile menu. |
| **`StatCard`** | `src/components/common/StatCard.tsx` | Executive KPI metric card | Hover elevation, animated count-ups, trend indicators, role-tinted icon containers. |
| **`StatusBadge`** | `src/components/common/StatusBadge.tsx` | Status pill component | Verified, Pending, Overdue, Paid, Resolved status color coordination. |
| **`ReceiptViewer`** | `src/components/common/ReceiptViewer.tsx` | Official payment receipt modal | Printable layout, SVG corporation seal, dynamic QR code verification. |
| **`DataTable`** | `src/components/common/DataTable.tsx` | Responsive data table | Column sorting, search filter, pagination, empty state fallback. |
| **`GlobalSearchModal`** | `src/components/common/GlobalSearchModal.tsx` | Universal keyboard modal (`Ctrl+K`) | Cross-object search across properties, assessments, grievances, and routes. |
| **`CiviAssist`** | `src/components/common/CiviAssist.tsx` | Floating municipal AI assistant | Context-aware queries, tax calculation assistance, deep route shortcuts. |
| **`FacultyDemoMode`** | `src/components/common/FacultyDemoMode.tsx` | Guided academic evaluation banner | 12-stage automated walkthrough scenarios with step progression tracking. |
