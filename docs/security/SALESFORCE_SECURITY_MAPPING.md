# CIVICTAX Salesforce Security Architecture & Role Mapping

## 1. Local-to-Salesforce Security Mapping

CivicTax maps local demonstration roles directly to Salesforce platform security constructs:

| CivicTax Local Role | Salesforce Identity Model | Salesforce Permission Set | Organization-Wide Defaults (OWD) | Apex Execution Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen (`CITIZEN`)** | Experience Cloud User / Community Contact | `CivicTax_Citizen` | Private on `Property__c`, `Tax_Assessment__c` | `WITH USER_MODE` (Record ownership restricted) |
| **Municipal Officer (`OFFICER`)**| Standard Salesforce Platform User | `CivicTax_Officer` | Public Read / Controlled by Zone Sharing Rules | `WITH USER_MODE` (Zone-scoped inspection access) |
| **Administrator (`ADMIN`)** | System Administrator Profile | `CivicTax_Admin` | View All / Modify All on municipal custom objects | `WITH USER_MODE` (Administrative oversight) |

---

## 2. Salesforce Platform Security Artifacts

### A. Permission Set: `CivicTax_Officer` (`permissionsets/CivicTax_Officer.permissionset-meta.xml`)
- **Object Permissions**:
  - `Property__c`: Read, Create, Edit. Delete is strictly **disabled**.
  - `Tax_Assessment__c`: Read, Create, Edit. Delete is strictly **disabled**.
  - `Tax_Payment__c`: Read-Only. Direct modification or deletion of financial records is strictly **disabled**.
  - `Grievance__c`: Read, Create, Edit.
- **Field-Level Security (FLS)**:
  - Grants read and edit access to `Verification_Status__c`, `Resolution_Comments__c`, and `Zone__c`.
  - Financial total fields (`Total_Amount__c`, `Amount_Paid__c`) are read-only and calculated authoritatively via triggers and services.

### B. User-Mode DML & Sharing Enforcement
All custom Apex services explicitly declare:
```apex
public with sharing class PropertyService {
    // Queries enforce user permissions and sharing rules
    List<Property__c> props = [SELECT Id FROM Property__c WITH USER_MODE];

    // DML operations enforce object and field-level security
    insert as user prop;
}
```
This guarantees that permissions configured in Salesforce are enforced at the database layer, regardless of any frontend input.
