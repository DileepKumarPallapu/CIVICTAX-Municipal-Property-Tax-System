# CivicTax 4.0: Single Source of Truth & Dual-Mode Persistence Architecture

## 1. Single Source of Truth Principle

CivicTax 4.0 enforces a strict **Single Source of Truth (SSOT)** model to prevent split-brain states or conflicting duplicate records between the local storage layer and the enterprise cloud CRM.

```
+---------------------------------------------------------------------------------------------------+
|                        CIVICTAX 4.0 SINGLE SOURCE OF TRUTH (SSOT) PIPELINE                        |
+---------------------------------------------------------------------------------------------------+

                                    [ ServiceFactory.ts ]
                                               │
                                 ┌─────────────┴─────────────┐
                                 │                           │
                     [ Mode: LOCAL DEMO ]          [ Mode: SALESFORCE ]
                                 │                           │
                                 v                           v
                       [ StorageService.ts ]       [ salesforceApiClient.ts ]
                                 │                           │
                                 v                           v
                      [ Browser Storage /          [ Node Express Gateway (Port 3001) ]
                        Local SQLite ]                       │
                                                             v (OAuth 2.0 PKCE)
                                                   [ SALESFORCE CORE PLATFORM ]
                                                   - Property__c
                                                   - Tax_Assessment__c
                                                   - Tax_Payment__c
                                                   - Case
```

---

## 2. Decoupled Presentation Layer

- **React Component Independence**: Frontend pages (`CitizenAssessmentsPage.tsx`, `PropertyManagementPage.tsx`) consume business data exclusively through the `services.*` interface contracts defined in `src/services/interfaces/`.
- **Zero Salesforce Secrets in React**: React components never interact directly with Salesforce credentials, client secrets, or OAuth tokens.
- **Explicit Mode Switching**: When Salesforce mode is toggled in System Settings, the application routes authoritative reads and writes to Salesforce via the Express gateway. If Salesforce is disconnected or unauthenticated, the application displays an explicit connection warning rather than silently falling back to stale demo data.

---

## 3. Authoritative Record Ownership

| Domain Entity | Local Demo Mode Authority | Salesforce Mode Authority | Key External Mapping Field |
| :--- | :--- | :--- | :--- |
| **Properties** | `StorageService` (`civictax_properties`) | Salesforce `Property__c` | `Property_Number__c` (Unique, External ID) |
| **Tax Assessments** | `StorageService` (`civictax_assessments`) | Salesforce `Tax_Assessment__c` | Master-Detail (`Property__c`) |
| **Tax Payments** | `StorageService` (`civictax_payments`) | Salesforce `Tax_Payment__c` | `Transaction_ID__c` (Unique, External ID) |
| **Grievances** | `StorageService` (`civictax_grievances`) | Salesforce Standard `Case` | `CaseNumber` |
| **Reassessments** | `StorageService` (`civictax_reassessments`) | Salesforce `Reassessment_Request__c`| Parent Assessment Lookup |
