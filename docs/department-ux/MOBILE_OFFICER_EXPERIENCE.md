# CivicTax 3.0 Mobile & Field Officer Experience Specification

## 1. Field Operational Context

Municipal revenue inspectors and property surveyors operate on mobile tablets and smartphones under varied outdoor conditions (direct sunlight, touch-first interactions, intermittent mobile network connectivity).

---

## 2. Mobile-Optimized Field Officer Workflows

### 2.1 Inspection Docket & Cadastral Mapping
- **Mobile Responsive Drawer**: Compact collapsible drawer providing full-width workspace on mobile screens.
- **Assigned Inspection List**: Organize parcels by physical proximity or inspection urgency.
- **GIS Map Navigation**: Tap a parcel marker on the Leaflet map to inspect property address, survey number, and declared dimensions.

### 2.2 On-Site Verification & Decision Logging
- **Dimensional Verification**: Compare physical tape measurements against citizen-declared built-up area.
- **Deed Preview**: High-speed image and document viewer for checking title deeds in the field.
- **One-Tap Verification Decisions**:
  - `Approve & Certify`: Transitions status to `VERIFIED` and enables assessment generation.
  - `Reject with Notes`: Captures mandatory surveyor discrepancy notes (e.g. *"Commercial shop operating on residential permit"*).

### 2.3 Field Data Safeguards
- **Touch-Friendly Controls**: Minimum $44\text{px} \times 44\text{px}$ touch targets for all primary buttons.
- **Network Awareness**: Clear offline indicators informing officers if connectivity is interrupted; prevents silent data loss.
