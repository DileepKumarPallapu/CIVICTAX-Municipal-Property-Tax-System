# CivicTax Salesforce Security, OWD & Sharing Configuration

## 1. Security & Identity Architecture

CivicTax maintains strict data privacy barriers between external citizens and municipal employees.

```
+-------------------------------------------------------------------------------+
|                      CIVICTAX SHARING & AUTHORIZATION MATRIX                  |
+-------------------------------------------------------------------------------+

                       +---------------------------------+
                       |  Organization-Wide Defaults     |
                       |  - Property__c: Private         |
                       |  - Tax_Assessment__c: Controlled|
                       |  - Grievance__c: Private        |
                       +---------------------------------+
                                       |
                 +---------------------+---------------------+
                 |                                           |
                 v                                           v
    [ Citizen Access Layer ]                     [ Officer / Admin Layer ]
    - User/Contact Match Only                    - Role Hierarchy Inheritance
    - Cannot view peer properties                - Criteria-based Sharing Rules
    - Cannot modify assessments                  - Zonal Inspector Scope
```

---

## 2. Organization-Wide Defaults (OWD)

| Object | Default Internal Access | Default External Access | Grant Access Using Hierarchies |
| :--- | :--- | :--- | :--- |
| **`Property__c`** | Private | Private | Yes (Internal) |
| **`Tax_Assessment__c`** | Controlled by Parent (`Property__c`) | Controlled by Parent | N/A |
| **`Tax_Payment__c`** | Controlled by Parent (`Tax_Assessment__c`)| Controlled by Parent | N/A |
| **`Tax_Rate__c`** | Public Read Only | Public Read Only | No |
| **`Grievance__c`** | Private | Private | Yes (Internal) |

---

## 3. Permission Sets & Profiles

1. **`CivicTax_Citizen`**:
   - Object Read/Create on `Property__c` (scoped to owned records).
   - Object Read on `Tax_Assessment__c`.
   - Object Read/Create on `Tax_Payment__c`.
   - Object Read/Create on `Grievance__c`.
2. **`CivicTax_Officer`**:
   - Read/Edit on assigned `Property__c` records.
   - Read/Edit/Create on `Tax_Assessment__c`.
   - Read on `Tax_Payment__c`.
   - Read/Edit on `Grievance__c`.
3. **`CivicTax_Admin`**:
   - Full CRUD permissions on all CivicTax municipal custom objects.
   - Author of `Tax_Rate__c` and `Property_Zone__c` masters.
