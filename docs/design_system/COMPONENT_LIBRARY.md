# CIVICTAX Reusable UI Component Library

## 1. Core Component Inventory & Usage

All reusable components are located in `src/components/common/`:

### A. Navigation & Shell Components
- **`AppHeader.tsx`**: Top municipal navigation bar containing brand logo, global search trigger (`Ctrl+K`), language selector (English / தமிழ்), dark/light theme switch, notifications dropdown, and user profile pill.
- **`AppSidebar.tsx`**: Multi-role navigation sidebar supporting collapse/expand, role badges (`CITIZEN`, `OFFICER`, `ADMIN`), and active route highlighting.
- **`PageHeader.tsx`**: Consistent breadcrumbs, title, subtitle, and contextual action buttons.

### B. Data Display & Badges
- **`StatusBadge.tsx`**: Universal status indicator supporting:
  - Property Verification: `VERIFIED` (Teal/Green), `PENDING` (Amber), `REJECTED` (Rose)
  - Tax Assessments: `PAID` (Green), `PARTIALLY_PAID` (Indigo), `APPROVED` (Blue), `OVERDUE` (Red)
  - Grievances: `OPEN` (Amber), `IN_PROGRESS` (Blue), `RESOLVED` (Green)
- **`StatCard.tsx`**: Responsive metric card with count-up animations, trend indicators, and iconography.
- **`DataTable.tsx`**: Sortable, filterable, and paginated data table with built-in empty states and search input.

### C. Dialogs & Modals
- **`ConfirmDialog.tsx`**: Accessible modal for critical confirmations (e.g. data reset, session disconnect) with focus trapping.
- **`ReceiptViewer.tsx`**: Formatted printable tax payment clearance receipt with official seal and transaction timestamps.
- **`GlobalSearchModal.tsx`**: Keyboard-accessible search modal searching properties, assessments, and grievances simultaneously.
- **`CiviAssist.tsx`**: Floating interactive assistant providing quick FAQs, navigation shortcuts, and tax guidance.
