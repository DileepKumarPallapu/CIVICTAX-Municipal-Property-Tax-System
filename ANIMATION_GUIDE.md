# CIVICTAX 3.0 — Animation & Motion Design Guide

## 1. Motion Principles
Animations in CivicTax 3.0 are designed to be **cinematic, functional, and performance-conscious**:
1. **Subtle & Controlled**: No exaggerated spring physics or cartoonish bouncing.
2. **Performance First**: Motion operates exclusively on hardware-accelerated CSS properties (`transform: translate3d/scale`, `opacity`). Layout thrashing (`width`, `height`, `margin`) is strictly avoided.
3. **Respecting Reduced Motion**: Adheres to user OS preferences for `prefers-reduced-motion`.

---

## 2. Reusable Motion Variants (`src/utils/animations.ts`)

| Variant | Target Elements | Timing & Easing | Purpose |
| :--- | :--- | :--- | :--- |
| `pageVariants` | Route transitions | `duration: 0.35s`, `easeOut` | Prevents jarring route flashes |
| `staggerContainer` | Grids & Lists | `staggerChildren: 0.06s` | Creates progressive cognitive intake |
| `cardVariants` | Feature cards, Stat cards | `y: 16 -> 0`, `duration: 0.4s` | Smooth entrance on viewport trigger |
| `modalVariants` | Dialogs, Receipt Viewer | `scale: 0.96 -> 1`, `duration: 0.28s` | Elegant backdrop pop entrance |
| `dropdownVariants`| Notifications, Profile | `scale: 0.95 -> 1`, `duration: 0.2s` | Fast, responsive menu disclosure |
| `floatingBadge` | Hero indicators | `y: 0 -> -6 -> 0`, repeat infinity | Adds alive, ambient depth to landing page |

---

## 3. Micro-Interactions & Numerical Count-Up
- **Count-Up Component (`CountUp.tsx`)**: Uses `requestAnimationFrame` with quartic ease-out curve to animate dashboard statistics and live landing page counters smoothly without external heavy libraries.
- **Interactive Feedback**:
  - Buttons feature active scale states (`scale-[0.98]`) and subtle shadow glow transitions.
  - Form inputs activate clean focus rings (`ring-2 ring-[#405CF5]`).
  - Successful payments trigger lightweight canvas confetti celebrations.
