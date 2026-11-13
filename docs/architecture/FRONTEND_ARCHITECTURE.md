# CIVICTAX Frontend Architecture

## 1. Frontend Technology Stack & Structure

- **Framework**: React 19.0.0
- **Language**: TypeScript 5.9.3 (Strict Mode enabled)
- **Build Tool**: Vite 8.3.8 (Rollup client bundler)
- **Styling**: Tailwind CSS 3.4.19 with custom institutional design system tokens
- **Routing**: React Router DOM 7.2.0
- **Icons**: Lucide React
- **Geospatial Mapping**: Leaflet 1.9.4 & React-Leaflet 5.0.0

```mermaid
flowchart TD
    subgraph CoreEngine["Application Core (src/)"]
        Entry["main.tsx\n(Bootstrap & Root Render)"]
        App["App.tsx\n(Root Providers Wrap)"]
        Routes["routes/AppRoutes.tsx\n(Route Definitions & Role Protection)"]
    end

    subgraph ContextTier["State & Context Providers"]
        AuthCtx["AuthContext\n(User, Role, Login/Logout)"]
        ThemeCtx["ThemeContext\n(Light / Dark Mode State)"]
        LocaleCtx["LocalizationContext\n(English & Tamil Translation Dicts)"]
    end

    subgraph LayoutTier["Layout Shells"]
        PubLayout["PublicLayout\n(Header, Navigation, Footer)"]
        DashLayout["DashboardLayout\n(Sidebar, Header, Main Outlet)"]
    end

    subgraph FeatureTier["Domain Feature Modules"]
        GIS["features/gis\n(Municipal GIS Map)"]
        Recovery["features/recovery\n(Arrears Aging & Case Triage)"]
        Compliance["features/compliance\n(Explainable Integrity Engine)"]
        Forecast["features/forecasting\n(Statistical Projections)"]
        Transparency["features/transparency\n(Public Open Data)"]
        Evidence["features/evidence\n(Academic Traceability Matrix)"]
        SF_Gateway["features/salesforce\n(Connection Management)"]
    end

    Entry --> App
    App --> AuthCtx & ThemeCtx & LocaleCtx
    AuthCtx & ThemeCtx & LocaleCtx --> Routes
    Routes --> PubLayout & DashLayout
    DashLayout --> FeatureTier
```

---

## 2. Directory Layout & Organization

```
src/
├── components/          # Reusable shared UI elements
│   ├── common/          # AppHeader, AppSidebar, Notifications, CiviAssist
│   ├── dashboard/       # Metric cards, chart widgets, activity feeds
│   ├── forms/           # Form inputs, validation decorators
│   ├── modals/          # Dialog boxes, confirmations, receipt viewers
│   └── tables/          # Data tables with search, filter, and pagination
├── context/             # React Context Providers (Auth, Theme, Localization)
├── data/                # Seed data sets (properties, users, zones, assessments)
├── features/            # High-level domain modules (GIS, Recovery, Compliance, etc.)
├── layouts/             # PublicLayout and DashboardLayout containers
├── pages/               # Top-level portal route pages (citizen, officer, admin, public)
├── routes/              # AppRoutes and ProtectedRoute guards
├── services/            # ServiceFactory, LocalAdapters, and SalesforceApiClient
├── types/               # TypeScript interface and type definitions
└── utils/               # Formatting, currency helpers, and animation constants
```

---

## 3. Localization Architecture (English & Tamil)

The frontend features dynamic runtime language switching without page reload, powered by `LocalizationContext`:
- **Key Namespaces**: `nav`, `common`, `metrics`.
- **Dictionaries**: Structured TypeScript maps (`TRANSLATIONS.en`, `TRANSLATIONS.ta`).
- **Hook API**: `const { t, language, setLanguage } = useLocalization();`
- **Persistence**: Saved to `civictax_language` in localStorage with fallback to `en`.
