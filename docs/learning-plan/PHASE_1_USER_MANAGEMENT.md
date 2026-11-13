# Topic 2: User Management, Licenses & Permission Sets

## 1. Curriculum Objectives & Licensing Safeguards
- **License Types**: Salesforce Platform License (for municipal field officers and administrators) and Customer Community / Identity License (for external citizen access).
- **Profiles**: `CivicTax Municipal Administrator`, `CivicTax Revenue Officer`, `CivicTax Standard Citizen`.
- **Permission Sets**:
  - `CivicTax_Admin`: Full administrative CRUD on property masters, tax rates, and system settings.
  - `CivicTax_Officer`: Field verification edit rights, assessment creation, grievance investigation.
  - `CivicTax_Citizen`: Scoped read-only on owned properties, creation of payments and grievance cases.
- **Login Governance**: Login IP ranges restricted to municipal WAN for officers; standard session timeout set to 2 hours.

---

## 2. Dedicated Permission Set Mappings

```
Setup > Users > Permission Sets
├── CivicTax_Admin
│   ├── Custom Object Permissions: Property__c (CRUD), Tax_Assessment__c (CRUD), Tax_Payment__c (CR)
│   └── System Permissions: View Setup, Manage Custom Permissions, Export Reports
├── CivicTax_Officer
│   ├── Custom Object Permissions: Property__c (Read/Edit), Tax_Assessment__c (Read/Create), Case (Read/Edit)
│   └── Field Permissions: Access to Field_Survey_Notes__c, Verification_Status__c
└── CivicTax_Citizen
    ├── Custom Object Permissions: Property__c (Read/Create), Tax_Assessment__c (Read), Tax_Payment__c (Read/Create)
    └── Field Permissions: Read-only on Verified_Status__c, Tax_Amount__c
```

---

## 3. Status & Evidence

- **Status**: Implemented Locally / Staged in DX Metadata (`salesforce/force-app/main/default/permissionsets/`).
- **Files**: `CivicTax_Officer.permissionset-meta.xml`, `CivicTax_Citizen.permissionset-meta.xml`.
