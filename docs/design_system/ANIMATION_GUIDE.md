# CIVICTAX Motion & Animation Specification

## 1. Principles of Municipal Motion

Animations in CivicTax are purposeful, subtle, and functional:
- **No Decorative Overhead**: Avoid gratuitous loops or distracting transitions.
- **Fast & Responsive**: Transitions complete within 150ms to 250ms to prevent perceived latency.
- **Respect User Accessibility**: Respects `prefers-reduced-motion` settings.

---

## 2. Standardized Animation Variants (`src/utils/animations.ts`)

```typescript
export const ANIMATION_VARIANTS = {
  // Page entry fade & slide
  pageTransition: 'transition-all duration-200 ease-out',
  // Dialog / Modal reveal
  modalReveal: 'transition-all duration-300 ease-out transform',
  // Metric Card Hover Elevation
  cardHover: 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
  // Dropdown Expansion
  dropdownFade: 'transition-opacity duration-150 ease-in-out',
  // KPI Count-Up
  countUpDuration: 1200 // milliseconds
};
```

---

## 3. Reduced-Motion Implementation

In `src/index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
This guarantees that users who experience vestibular discomfort can navigate CivicTax safely without unwanted movement.
