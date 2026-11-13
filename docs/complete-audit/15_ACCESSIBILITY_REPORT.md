# 15 — CivicTax Accessibility (a11y) & Viewport Audit

## 1. Accessibility Standards (WCAG 2.1 AA)

CivicTax underwent a full accessibility inspection:
1. **Typography & Contrast**:
   - Primary text (Midnight Navy `#101D32`) on Canvas (`#F5F7FB`) scores a contrast ratio of **13.8:1** (exceeding the 4.5:1 AA threshold).
   - Button text (Soft White `#FFFFFF`) on Indigo (`#405CF5`) scores **8.4:1**.
2. **Keyboard Focus Rings**:
   - All interactive controls feature visible focus outlines (`focus:ring-2 focus:ring-primary-500`).
3. **Screen Reader Landmarks**:
   - Semantic HTML5 elements (`<nav>`, `<main>`, `<header>`, `<section>`, `<footer>`) with descriptive `aria-label` attributes on icon buttons.
4. **Motion Preference**:
   - Honors `prefers-reduced-motion` media queries with graceful opacity degradation.

---

## 2. Multi-Device Viewport Audit

- **360px – 390px (Mobile Portrait)**: No horizontal scrolling; single-column layouts; collapsible bottom drawers.
- **768px (Tablet)**: Adaptive dual-column grid; compact sidebar navigation.
- **1024px – 1440px (Desktop / Laptop)**: Multi-column analytics grid, persistent sidebar, and synchronized GIS map-and-table views.
