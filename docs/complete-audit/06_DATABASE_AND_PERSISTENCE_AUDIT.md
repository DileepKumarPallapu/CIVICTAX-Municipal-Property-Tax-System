# 06 — CivicTax Database, Data Model & Persistence Audit

## 1. Authoritative Data Storage Architecture

CivicTax utilizes an abstracted persistence architecture via `ServiceFactory.ts` and `StorageService.ts`:
- **Default Authoritative Provider**: `StorageService` operates over localized browser persistent storage and backend SQLite via Express, ensuring 100% offline-first reliability.
- **Enterprise Provider**: `SalesforceServiceAdapter` interacts with Salesforce Core via authenticated REST endpoints when the org is connected.

```
+-------------------------------------------------------------------------------+
|                       DATA PERSISTENCE & LIFECYCLE FLOW                       |
+-------------------------------------------------------------------------------+

 [ React Component ]
          |
          v
 [ ServiceFactory ] ---- Mode: LOCAL ----> [ Local*Service ] ----> [ StorageService ]
          |                                                               |
          |                                                               v
          |                                                      [ Browser Storage / SQLite ]
          |
          +------------- Mode: SALESFORCE -> [ SalesforceServiceAdapter ]
                                                      |
                                                      v
                                             [ Express Gateway (Port 3001) ]
                                                      |
                                                      v
                                             [ Salesforce REST / Apex ]
```

---

## 2. Referential Integrity & Invariants

1. **Cascade & Orphan Prevention**:
   - Every `TaxAssessment` requires a valid parent `propertyId`.
   - Every `TaxPayment` requires a valid parent `assessmentId`.
   - Every `Grievance` requires a valid `citizenId`.
2. **Persistence Verification**:
   - Properties created via `/citizen/register-property` persist across page refresh and new user logins.
   - Payments update the parent assessment balance atomically.
   - Storage corruption checks: Seed data is only initialized if local storage is uninitialized, preventing overwrites of newly added demo records.
