# CIVICTAX 6.0 — System Architecture & Component Design

## 1. Clean Architecture & Decoupled Service Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│  React 19 Components, AppRoutes, Contexts & ProtectedRoute   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls
┌──────────────────────────────▼──────────────────────────────┐
│                    Service Abstractions                     │
│   IPropertyService, IAssessmentService, IPaymentService...   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Implemented by
             ┌─────────────────┴─────────────────┐
             │                                   │
┌────────────▼────────────────┐   ┌──────────────▼─────────────┐
│    Local Persistence Layer  │   │  Salesforce Adapter Layer  │
│    (LocalStorage / Events)  │   │    (Apex REST / OAuth)     │
└─────────────────────────────┘   └────────────────────────────┘
```

---

## 2. Directory & Component Structure
- `src/components/common/`: Reusable UI elements (`AppHeader`, `AppSidebar`, `StatCard`, `StatusBadge`, `CiviAssist`, `FacultyDemoMode`, `WorkflowTimeline`, `ReceiptViewer`, `GlobalSearchModal`).
- `src/context/`: Reactive providers (`AuthContext`, `ThemeContext`, `ToastContext`, `NotificationContext`).
- `src/data/`: Realistic seed dataset (`seedData.ts`) with 20 properties, 15 assessments, 10 payments, 8 grievances, and 5 reassessments.
- `src/services/interfaces/`: Strict TypeScript contracts defining backend interactions.
- `src/services/local/`: Local implementations encapsulating business rules and persistence.
- `src/services/businessRules.ts`: Centralized business rules engine preventing invalid transitions, duplicate deeds, and overpayments.
- `src/services/storageService.ts`: Central persistence bus dispatching custom browser events (`civictax_storage_update`) for real-time reactivity.

---

## 3. Data Flow & Reactive State Architecture
1. **User Action**: Citizen triggers a payment, or Officer approves a property.
2. **Business Rule Validation**: Service method calls `BusinessRules.validate...()` to ensure integrity.
3. **Staged Mutation**: Related entities (e.g. `Payment` record and `TaxAssessment` balance) update atomically in memory.
4. **Storage Persistence & Event Dispatch**: `StorageService` commits to `localStorage` and dispatches `civictax_storage_update`.
5. **UI Synchronization**: Listening components rehydrate state immediately without page refreshes.
6. **Immutable Audit Logging**: `StorageService.recordAuditLog()` appends an immutable audit entry.
