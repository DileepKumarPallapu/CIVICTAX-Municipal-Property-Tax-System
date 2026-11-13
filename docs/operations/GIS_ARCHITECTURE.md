# CivicTax GIS Architecture & Spatial Property Intelligence

## 1. Architectural Overview

CivicTax GIS integrates geospatial mapping to bridge administrative property records with spatial geographic dimensions. The municipal GIS layer runs in the React frontend utilizing Leaflet / React-Leaflet with responsive map rendering, OpenStreetMap geospatial tile servers, and localized municipal coordinate projections.

```
+-------------------------------------------------------------------------+
|                        MUNICIPAL GIS ARCHITECTURE                       |
+-------------------------------------------------------------------------+
                                    |
                 +------------------+------------------+
                 |                                     |
                 v                                     v
     +-----------------------+             +-----------------------+
     |   Leaflet Map Engine  |             |  Filter & Sync Engine |
     | - OSM Tile Provider   |             | - Zone / Category     |
     | - WGS84 Coords (lat/lng)            | - Status & Payment    |
     | - Custom SVG Markers  |             | - Bidirectional Sync  |
     | - GeoJSON Bounds      |             +-----------------------+
     +-----------------------+                         |
                 |                                     |
                 +------------------+------------------+
                                    |
                                    v
                     +-----------------------------+
                     |  Synthetic Coordinates Tag  |
                     |  & Data Integrity Validation|
                     |  - Strict Non-Verified Flag |
                     |  - Bounds Verification      |
                     +-----------------------------+
```

---

## 2. Geospatial Data Invariants & Coordinate Validation

1. **Coordinate System**: WGS-84 coordinate reference system (`EPSG:4326`). Latitude is constrained to valid ranges (`-90.0` to `+90.0`) and Longitude to (`-180.0` to `+180.0`).
2. **Municipal Boundary Invariant**:
   - Greater Chennai Corporation (GCC) Metropolitan Area: Latitude `12.80` to `13.30` N, Longitude `80.00` to `80.35` E.
   - Any property record outside municipal bounds triggers a validation alert.
3. **Synthetic Coordinate Mandate**:
   - Demonstration records feature synthetic or approximate coordinates.
   - **MANDATORY POLICY**: Every demo coordinate is flagged with `isSynthetic: true` and rendered with a visible warning: *"Synthetic Demonstration Coordinate — Not an authoritative or land-registry verified municipal cadastral parcel"*.

---

## 3. Filtering & Map/List Synchronization

- **Zone Filtering**: Restricts map view and synchronized tabular records to Zone 1 (T. Nagar), Zone 2 (Adyar), Zone 3 (Anna Nagar), or Zone 4 (Velachery).
- **Category Filtering**: Color-coded categorization:
  - **Residential**: Emerald Teal (`#13A58B`)
  - **Commercial**: Royal Indigo (`#405CF5`)
  - **Industrial**: Amber Slate (`#D97706`)
- **Verification Status Filtering**:
  - `VERIFIED`: Solid outline with verified checkmark pin.
  - `PENDING`: Dashed border with alert badge.
  - `REJECTED`: Red marker with restriction flag.
- **Payment Status Filtering**:
  - `PAID`: Green ring indicator.
  - `OVERDUE` / `PENDING`: Red / amber ring indicator.
- **Bidirectional Synchronization**:
  - Selecting a parcel in the map pans and focuses the table record.
  - Selecting a row in the property table centers the map and displays the parcel marker popup with built-up area, assessed tax, and payment history.
