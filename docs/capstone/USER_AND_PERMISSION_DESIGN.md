# CivicTax Salesforce User Management, Roles & Permission Design

## 1. Persona & Profile Architecture

CivicTax establishes distinct operational roles through tailored Salesforce Profiles and Permission Sets adhering to the **Principle of Least Privilege**.

```
+-------------------------------------------------------------------------------+
|                            SALESFORCE ROLE HIERARCHY                          |
+-------------------------------------------------------------------------------+

                      [ Municipal Commissioner (HQ) ]
                                     |
                    [ Zonal Joint Commissioner ]
                                     |
               +---------------------+---------------------+
               |                                           |
    [ Zone 1 Revenue Officer ]                  [ Zone 2 Revenue Officer ]
               |                                           |
    [ Field Tax Inspector 1 ]                   [ Field Tax Inspector 2 ]
```

---

## 2. Dedicated Permission Sets

### 2.1 `CivicTax_Citizen`
- **Assigned To**: External citizen portal users (authenticated via Experience Cloud or External Client App PKCE).
- **Object Permissions**:
  - `Property__c`: Read, Create (scoped to owned records).
  - `Tax_Assessment__c`: Read (scoped to owned property).
  - `Tax_Payment__c`: Read, Create.
  - `Case`: Read, Create.
- **Field-Level Security**: No access to internal officer survey audit fields, internal verification scores, or risk ratings.

### 2.2 `CivicTax_Officer`
- **Assigned To**: Field Revenue Inspectors and Assistant Revenue Officers.
- **Object Permissions**:
  - `Property__c`: Read, Edit (verification workflow).
  - `Tax_Assessment__c`: Read, Create, Edit.
  - `Tax_Payment__c`: Read.
  - `Case`: Read, Edit (inquiry and resolution).
  - `Reassessment_Request__c`: Read, Edit (technical sanction).
- **Scope**: Scoped to the officer's assigned municipal zone through Criteria-Based Sharing Rules.

### 2.3 `CivicTax_Admin`
- **Assigned To**: Municipal IT Administrators and Revenue Directors.
- **Object Permissions**: Full CRUD permissions across all standard and custom objects.
- **System Permissions**: Author of `Tax_Rate__c`, `Property_Zone__c`, and audit logs.
