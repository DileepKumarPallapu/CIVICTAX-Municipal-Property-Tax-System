# CIVICTAX Integration Architecture

## 1. Hybrid Integration Topology

CivicTax features a modular abstraction layer (`ServiceFactory`) allowing seamless toggling between local offline persistence and enterprise Salesforce cloud synchronization.

```mermaid
flowchart TD
    subgraph ClientView["React UI Layer"]
        Consumer["UI Components & Pages\n(Consume IPropertyService, ITaxService, etc.)"]
    end

    subgraph AbstractionLayer["ServiceFactory (Dependency Injection)"]
        Factory{"ServiceFactory.get()"}
        LocalImpl["Local Implementations\n(LocalPropertyService, LocalPaymentService)"]
        SFImpl["Salesforce Implementations\n(SalesforceServiceAdapter)"]
    end

    subgraph StorageLayer["Data Storage Engines"]
        LocalStorageEngine["Indexed LocalStorage\n(Seed Data + JSON Serialization)"]
        GatewayProxy["Express Backend Proxy\n(Port 3001)"]
        ApexREST["Salesforce Apex REST API\n(v60.0)"]
    end

    Consumer --> Factory
    Factory -->|Mode = local| LocalImpl
    Factory -->|Mode = salesforce| SFImpl
    LocalImpl --> LocalStorageEngine
    SFImpl --> GatewayProxy
    GatewayProxy --> ApexREST
```

---

## 2. Service Interface Contracts

All services adhere strictly to standard TypeScript interface contracts defined in `src/services/interfaces/index.ts`:

- `IPropertyService`: `registerProperty()`, `getProperty()`, `listProperties()`, `updateVerificationStatus()`.
- `IAssessmentService`: `getAssessments()`, `generateAssessment()`, `getAssessmentById()`.
- `IPaymentService`: `recordPayment()`, `getPaymentHistory()`, `generateReceipt()`.
- `IGrievanceService`: `submitGrievance()`, `listGrievances()`, `resolveGrievance()`.

This guarantees that switching the underlying data provider requires **zero refactoring of React pages, dialogs, or navigation hooks**.
