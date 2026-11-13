# CIVICTAX Dependency & Package Audit

## 1. Frontend Dependencies (`package.json`)

| Package Name | Version | Role in CivicTax | Health & Audit Assessment |
| :--- | :--- | :--- | :--- |
| **react** | `^19.0.0` | UI component library | Modern release, concurrent rendering, clean compilation |
| **react-dom** | `^19.0.0` | DOM rendering engine | Fully aligned with React 19 core |
| **react-router-dom**| `^7.2.0` | SPA routing & route guards | Declarative client routing with nested layouts |
| **lucide-react** | `^1.16.0` | Iconography suite | Clean SVG icon components, zero layout shifts |
| **leaflet** | `^1.9.4` | Open-source interactive maps | Stable cartography engine |
| **react-leaflet** | `^5.0.0` | React wrapper for Leaflet | High performance vector mapping integration |
| **recharts** | `^2.15.1` | Financial analytics charting | Responsive SVGs for forecasting & revenue trends |
| **clsx** | `^2.1.1` | Class string composition | Minimal utility for dynamic CSS classes |
| **tailwind-merge** | `^3.0.1` | Tailwind class deduplication | Resolves conflicting Tailwind utility classes |

---

## 2. Frontend Developer Dependencies

| Package Name | Version | Role in CivicTax | Health & Audit Assessment |
| :--- | :--- | :--- | :--- |
| **vite** | `^8.3.8` | Build bundler & dev server | Fast HMR, production Rollup bundling |
| **typescript** | `~5.9.3` | Typechecker & compiler | Strict type safety across all components & models |
| **tailwindcss** | `^3.4.19` | Utility CSS framework | Custom theme palette (Navy, Indigo, Teal, Canvas) |
| **postcss** | `^8.5.2` | CSS post-processing | Autoprefixer and Tailwind processing |
| **autoprefixer** | `^10.4.20` | Cross-browser vendor prefixes | Production CSS compatibility |
| **vitest** | `^5.1.0` | Unit & integration test engine | Headless, fast in-memory execution (20/20 passed) |
| **jsdom** | `^27.0.0` | Headless DOM simulator | Provides document & window objects for test suites |
| **oxlint** | `^1.48.0` | Ultra-fast linter | Rapid static analysis (0 errors reported) |

---

## 3. Backend Gateway Dependencies (`server/package.json`)

| Package Name | Version | Role in CivicTax Gateway | Health & Audit Assessment |
| :--- | :--- | :--- | :--- |
| **express** | `^4.21.2` | Node.js web framework | Gateway routing for OAuth PKCE and Apex REST |
| **express-session**| `^1.18.1` | Server session manager | Encrypted session store for Salesforce OAuth tokens |
| **cookie-parser** | `^1.4.7` | HTTP cookie parser | Parses `civictax.sid` HttpOnly cookie |
| **cors** | `^2.8.5` | Cross-Origin middleware | Restricted strictly to `FRONTEND_URL` (`localhost:5173`) |
| **dotenv** | `^16.4.7` | Environment variable loader | Loads server `.env` configuration |
| **tsx** | `^4.19.3` | TypeScript Node runtime | Development watch runner for `src/server.ts` |
