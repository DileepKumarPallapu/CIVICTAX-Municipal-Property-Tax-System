# CIVICTAX — Technical Architecture Documentation

## 1. Architectural Philosophy
CivicTax is built following **Clean Architecture principles** and the **Dependency Inversion Principle (DIP)**. The user interface does not directly depend on any database or persistent storage technology; instead, all interactions are channeled through high-level TypeScript service interfaces (`src/services/interfaces/`).

---

## 2. Layered Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Presentation Layer                  │
│       React 19 Components, Contexts & React Router      │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Service Abstraction                 │
│         Interfaces: IPropertyService, IPaymentService...│
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│       Local Persistence     │ │   Salesforce Adapter   │
│     (Phase 1: LocalStorage) │ │    (Phase 2: Apex)     │
└─────────────────────────────┘ └────────────────────────┘
```

---

## 3. Directory Layout & Organization

```
civictax/
├── public/                 # Favicons and static assets
├── src/
│   ├── assets/             # Brand logos and imagery
│   ├── components/         # Reusable UI components
│   │   ├── common/         # StatCards, StatusBadges, EmptyState, DataTable, Modals
│   │   ├── forms/          # Form inputs and selectors
│   │   └── navigation/     # Header, Sidebar, Breadcrumbs
│   ├── context/            # React Context providers (Auth, Theme, Toast, Notifications)
│   ├── data/               # Seed data for initial demo initialization
│   ├── layouts/            # PublicLayout and DashboardLayout
│   ├── pages/              # Route views grouped by role
│   │   ├── public/         # Landing, About, Services, Contact, Login, Register
│   │   ├── citizen/        # 9 Citizen views
│   │   ├── officer/        # 9 Officer views
│   │   └── admin/          # 11 Admin views
│   ├── routes/             # AppRoutes and ProtectedRoute
│   ├── services/           # Service layer
│   │   ├── interfaces/     # Service contracts
│   │   ├── local/          # LocalStorage implementations
│   │   ├── salesforce/     # Salesforce phase 2 adapter stubs
│   │   ├── serviceFactory.ts # DI Factory
│   │   └── storageService.ts # Storage event bus & persistence
│   ├── types/              # Domain models and TypeScript contracts
│   └── utils/              # Calculation formulas, CSV exports, date formatters
├── tests/                  # Vitest automated test suites
├── index.html              # HTML5 entrypoint with Google Fonts
├── tailwind.config.js      # Civic design tokens and theme rules
└── vite.config.ts          # Vite bundler configuration
```

---

## 4. State Management & Storage Reactivity
The application uses a lightweight, reactive pattern combining **React Context** with **Browser Custom Events**:
1. When any data mutation occurs in a local service (e.g. `createProperty`, `processSimulatedPayment`, `updateStatus`), `StorageService` dispatches a `civictax_storage_update` event with the affected key.
2. The UI components, `AuthContext`, and `NotificationContext` listen to this event and trigger an immediate state refresh without full page reloads.
3. When the database is reset from the Admin Settings page, a `civictax_data_reset` event restores all components instantly.
