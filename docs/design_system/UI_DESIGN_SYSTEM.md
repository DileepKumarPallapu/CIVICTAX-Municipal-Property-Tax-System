# CIVICTAX UI Design System Specification

## 1. Brand Identity & Design Principles

CivicTax utilizes an institutional, high-trust design system specifically tailored for municipal property tax management and civic governance:

- **Authoritative & Professional**: Grounded in Midnight Navy (`#101D32`) and Deep Slate (`#19283D`) with high-contrast text and structured layout geometry.
- **Accessible & Transparent**: Clear visual hierarchy, accessible color contrasts ($\ge 4.5:1$), and status badges for approval lifecycles.
- **Responsive & Motion-Safe**: Fluid multi-device adaptation from 320px mobile viewports to ultra-wide displays, honoring `prefers-reduced-motion`.

---

## 2. Core Color Palette

| Token Name | Hex Code | Tailwind Token | Application & Role |
| :--- | :--- | :--- | :--- |
| **Midnight Navy** | `#101D32` | `brand-midnight`, `navy-900` | Primary brand anchor, sidebar navigation, dark headers |
| **Deep Slate** | `#19283D` | `brand-deepslate`, `navy-800` | Sub-nav headers, cards in dark mode, active navigation backgrounds |
| **Royal Indigo** | `#405CF5` | `brand-indigo`, `royal-500` | Primary action buttons, active tabs, focus rings, interactive links |
| **Municipal Teal** | `#13A58B` | `brand-teal`, `teal-500` | Verified status badges, success indicators, collection metrics |
| **Canvas Background** | `#F5F7FB` | `brand-bg`, `civic-bg` | Main application background (Light Theme) |
| **Muted Text / Slate**| `#64748B` | `slate-500`, `civic-muted` | Secondary body text, timestamps, table column headers |
| **Pure White** | `#FFFFFF` | `brand-softwhite` | Card backgrounds, dialogs, contrasting text in dark containers |

---

## 3. Typography & Hierarchy

The application employs **Plus Jakarta Sans** with a fallback to **Inter** and system sans-serif:

- **Display Headings**: `text-3xl` / `text-2xl font-bold tracking-tight text-slate-900 dark:text-white`
- **Section Headings**: `text-lg font-semibold text-slate-900 dark:text-slate-100`
- **Body Text**: `text-sm text-slate-600 dark:text-slate-300`
- **Captions & Metadata**: `text-xs font-medium text-slate-500 dark:text-slate-400`
- **Code & Financial Numbers**: `font-mono tracking-tight font-semibold`
