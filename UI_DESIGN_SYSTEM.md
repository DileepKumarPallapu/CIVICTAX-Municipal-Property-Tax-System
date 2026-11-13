# CIVICTAX 3.0 — UI/UX Design System Specification

## 1. Brand Personality & Identity
- **Product Name**: CIVICTAX (Property Tax Assessment and Payment Management System)
- **Tagline**: *"Smarter Property Management. Transparent Taxation. Better Cities."*
- **Visual Character**: A synthesis of governmental institutional authority and modern high-velocity SaaS design (Linear / Stripe / Vercel aesthetic adapted for municipal governance).

---

## 2. Color Palette & Semantic Tokens

### Primary Palette
- **Midnight Navy**: `#101D32` (Primary dark surface, sidebar, header base)
- **Deep Slate**: `#19283D` (Elevated card background, borders in dark mode)
- **Royal Indigo**: `#405CF5` (Primary brand accent, primary CTA buttons, active route indicator)
- **Teal / Emerald**: `#13A58B` (Secondary accent, verification badges, collection indicators)
- **Soft White**: `#FFFFFF` (Light surface, card background)
- **Canvas Background**: `#F5F7FB` (Light mode subtle tinted neutral)
- **Subtle Border**: `#E7EBF2` (Light mode card borders, table dividers)
- **Muted Text**: `#718096` (Supporting captions, table secondary labels)

### Status & Feedback Tokens
- **Success / Paid / Verified**: `#16A34A` (Emerald 600)
- **Warning / Partially Paid / Resubmission**: `#F59E0B` (Amber 500)
- **Danger / Overdue / Rejected**: `#DC2626` (Red 600)
- **Information / In Progress**: `#2563EB` (Blue 600)

---

## 3. Typography System
- **Heading & UI Font**: `Plus Jakarta Sans`, sans-serif (`500`, `600`, `700`, `800`)
- **Body & Numerical Font**: `Inter`, system-ui (`400`, `500`, `600`)
- **Hierarchy Rules**:
  - Hero Display: `text-5xl` / `text-6xl`, font-weight `800`, line-height `1.12`
  - Page Titles: `text-xl` / `text-2xl`, font-weight `800`
  - Section Headings: `text-base` / `text-lg`, font-weight `700`
  - Table Headers & Captions: `text-xs`, font-weight `600`, tracking-wider, uppercase
  - Numerical Metrics & Currency: `font-extrabold`, tabular numbers with Indian Rupee formatting (`₹1,25,000`)

---

## 4. Elevation, Radii & Surface Rules
- **Border Radii**:
  - Cards & Modals: `rounded-3xl` (`24px`) or `rounded-2xl` (`16px`)
  - Buttons & Inputs: `rounded-xl` (`12px`)
  - Status Badges & Pills: `rounded-full`
- **Shadow System**:
  - `shadow-subtle`: `0 1px 3px 0 rgba(16, 29, 50, 0.04)`
  - `shadow-card`: `0 4px 12px -2px rgba(16, 29, 50, 0.06)`
  - `shadow-elevated`: `0 12px 24px -4px rgba(16, 29, 50, 0.08)`
  - `shadow-floating`: `0 20px 35px -5px rgba(16, 29, 50, 0.12)`

---

## 5. Theme Adaptability (Light & Dark)
- Built-in `ThemeContext` tracking `localStorage` preference and system `prefers-color-scheme`.
- Dark mode utilizes `#101D32` and `#19283D` instead of pure harsh black `#000000`, ensuring soft eye comfort during prolonged administrative usage.
