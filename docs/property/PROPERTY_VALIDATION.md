# CIVICTAX Property Validation Rules & Constraints

## 1. Validation Logic Matrix

| Field | Validation Rule | Enforcement Layer | Error Response |
| :--- | :--- | :--- | :--- |
| `builtUpArea` | Must be strictly positive ($> 0$) | React Form + LocalService + Apex / Validation Rule | *"Built-up area must be strictly greater than zero square feet."* |
| `constructionYear` | Cannot be in future ($\le \text{Year}(Now)$) | React Form + LocalService + Apex / Validation Rule | *"Construction year cannot be in the future."* |
| `documentReference`| Non-empty string ($\ge 4\text{ chars}$) | React Form + LocalService + Apex Rule | *"Title deed index reference number is mandatory."* |
| `propertyNumber` | Unique across entire municipal registry | Storage Service + Salesforce External ID | *"Property number is already registered in municipal database."* |
| `category` | Must belong to allowed enum | React Select + Salesforce Picklist | *"Invalid property zoning classification selected."* |
| `zoneId` | Must match valid municipal zone | React Select + Foreign Key Check | *"Selected municipal administrative zone does not exist."* |
| `latitude` / `longitude`| Valid WGS84 range ($-90$ to $90$, $-180$ to $180$) | React GIS Inspector + Apex Decimal | *"Geospatial coordinates must fall within valid geographic bounds."* |

---

## 2. Deletion Guard & Referential Integrity
- **Financial Protection Rule**: Properties cannot be deleted if any associated `TaxAssessment` or `TaxPayment` records exist.
- In `LocalPropertyService.ts`, attempting to delete a parcel with financial history throws:
  ```typescript
  if (assessments.some(a => a.propertyId === id)) {
    throw new Error('Cannot delete property: active municipal tax assessments or payment history are linked.');
  }
  ```
- In Salesforce, deletion is blocked by Master-Detail relational integrity and `CivicTax_Officer` permission set restrictions.
