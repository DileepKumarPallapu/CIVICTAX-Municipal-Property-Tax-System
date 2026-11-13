# CIVICTAX 3.0 — Known Limitations & Salesforce Phase 2 Roadmap

## 1. Intentional Demonstration Scope (Phase 1)
CivicTax 3.0 is built as an enterprise academic prototype demonstrating how an urban local body (municipal corporation) administers digital property taxation. As specified in project requirements:
1. **No Real Banking Credentials**: The online payment portal simulates transaction processing (UPI VPAs, mock card verification, mock net banking) to demonstrate ledger settlement and receipt generation without handling sensitive credit card numbers, CVVs, or OTPs.
2. **Local Persistence Adapter**: Demo data is stored locally in the browser's `localStorage` via `StorageService`. While fully persistent across page refreshes and browser tabs, it is isolated to the client environment.

---

## 2. Salesforce Phase 2 Transition Roadmap
The application is pre-architected for a seamless shift to a live Salesforce backend:
- **Custom Objects Prepared**: Data models map 1:1 with Salesforce Custom Objects (`Property__c`, `Tax_Assessment__c`, `Payment_Transaction__c`, `Citizen_Grievance__c`).
- **Service Factory Switch**: In `src/services/serviceFactory.ts`, replacing `LocalServiceFactory` with the included `SalesforceServiceAdapter.ts` will direct all CRUD operations to Salesforce Apex REST endpoints without modifying any React view.
- **Enterprise Identity**: Ready to connect with Salesforce Identity / Experience Cloud for Single Sign-On (SSO).
