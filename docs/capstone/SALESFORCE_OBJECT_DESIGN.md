# CivicTax Salesforce Object Design Specification

## 1. Object Architecture & Separation of Concerns

CivicTax maps municipal governance entities into a combination of Salesforce Standard Objects and custom objects (`__c`), respecting data governance and relationship semantics.

---

## 2. Standard Objects Justification

| Standard Object | Municipal Entity Mapped | Architectural Justification |
| :--- | :--- | :--- |
| **`Account`** | Municipal Household / Corporate Taxpayer Entity | Leverages standard account rollups, contact associations, and address structures for taxpayer organizations and household groups. |
| **`Contact`** | Individual Citizen / Property Owner | Manages personal identities, communication emails, phone numbers, and owner profiles without exposing raw national PII. |
| **`User`** | Municipal Revenue Inspector / Commissioner | Native Salesforce authentication, role hierarchies, territory management, and permission sets. |
| **`Case`** | Citizen Service Grievance | Utilizes standard case queues, assignment rules, escalation paths, and SLA milestone tracking. |
| **`ContentVersion` / `ContentDocument`** | Municipal Title Deeds & Tax Receipts | Native Salesforce Files storage with encrypted file repositories, virus scanning, and preview capability. |

---

## 3. Custom Objects Specification

1. **`Property__c`**: Primary cadastral parcel entity.
   - Master reference for land parcels, door numbers, built-up areas, categories, and verification status.
2. **`Tax_Assessment__c`**: Financial tax liability statement.
   - Master-Detail child of `Property__c`. Cascades deletion permissions; captures base tax, early rebate discount, overdue penalty, and outstanding balances.
3. **`Tax_Payment__c`**: Authoritative payment receipt record.
   - Master-Detail child of `Tax_Assessment__c`. Holds immutable transaction hashes, payment amounts, timestamps, and gateway methods.
4. **`Tax_Rate__c`**: Configurable tax rate matrix.
   - Standalone lookup master. Configures rate per square foot by category (`Residential`, `Commercial`, `Industrial`) with effective date validity intervals.
5. **`Property_Zone__c`**: Administrative municipal zone entity.
   - Represents zonal jurisdictions (Zone 1 T. Nagar, Zone 2 Adyar, etc.) with ward counts and assigned zonal revenue officers.
6. **`Reassessment_Request__c`**: Citizen appeal record.
   - Linked to `Property__c` and `Tax_Assessment__c`; tracks requested area revisions, architectural plans, and multi-step engineering approvals.
7. **`Property_Transfer_Request__c`**: Title mutation and ownership transfer tracking.
8. **`Property_Ownership_History__c`**: Immutable audit ledger recording deed mutation history and transfer dates.
9. **`Property_Correction_Request__c`**: Clerical amendment request for address or dimension corrections.
10. **`Municipal_Appointment__c`**: Desk hearing slot booking for citizen-officer consultations.
