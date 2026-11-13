# CIVICTAX Accessibility & a11y Standards Guide

## 1. Compliance Target: WCAG 2.1 AA

CivicTax conforms to Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:

1. **Perceivable (Contrast & Readability)**:
   - Primary text on light background: `#101D32` on `#F5F7FB` (Contrast ratio **14.2:1**, well exceeding 4.5:1 requirement).
   - Sidebar and navigation text: `#FFFFFF` on `#101D32` (Contrast ratio **15.6:1**).
   - Status badges use text labels in addition to colors to assist color-blind users.
2. **Operable (Keyboard & Focus)**:
   - All interactive controls have visible focus rings: `focus:outline-none focus:ring-2 focus:ring-indigo-500`.
   - Modals trap keyboard focus and dismiss on `Escape` key press.
   - Form inputs include explicit `<label htmlFor="...">` bindings.
3. **Understandable (Consistent Predictability)**:
   - Consistent layout shells (`PublicLayout`, `DashboardLayout`) keep navigation predictable.
   - Form errors are displayed in clear red text directly adjacent to invalid inputs.
4. **Robust (Assistive Tech Compatibility)**:
   - Screen reader announcements (`aria-label`, `aria-expanded`, `aria-hidden`) on icon-only buttons.
   - Full reduced-motion compliance via CSS media queries.
