# CivicTax 2.0 Responsive Viewport & Multi-Device Test Report

## 1. Responsive Viewport Standards

CivicTax was evaluated across standard enterprise screen dimensions:
1. **Mobile (360px – 390px)**: iPhone SE / 13 / 14 / Android standards.
2. **Tablet (768px)**: iPad Mini / Air portrait layout.
3. **Laptop (1024px)**: MacBook Air / standard corporate laptop.
4. **Desktop (1366px – 1440px)**: Standard FHD desktop monitor.
5. **Wide Display (1920px)**: Ultrawide / high-resolution command center monitor.

---

## 2. Multi-Device Audit Results

| Viewport Width | Navigation Behavior | Table / Card Layout | Horizontal Overflow | Result |
| :--- | :--- | :--- | :--- | :--- |
| **360px – 390px** | Hamburger trigger; slide-in drawer with backdrop blur | Single-column cards; horizontally scrollable tables with sticky headers | Zero overflow (`overflow-x: hidden`) | **PASS** |
| **768px** | Hamburger trigger; compact 2-column KPI grid | 2-column cards; responsive table pagination | Zero overflow | **PASS** |
| **1024px** | Persistent left sidebar (collapsible to 64px) | 3-column / 4-column KPI cards; side-by-side charts | Zero overflow | **PASS** |
| **1440px** | Persistent left sidebar; wide content grid | Full 6-column KPI decks; high-res Leaflet map view | Zero overflow | **PASS** |
| **1920px** | Fixed width max container (`max-w-7xl mx-auto`) | Centered balanced layout; no stretched charts | Zero overflow | **PASS** |
