# Topic 4: Object Architecture, Relationships & Schema Builder

## 1. Curriculum Objectives & Entity Model
Demonstrates standard and custom objects, master-detail rollups, nullable lookups, deletion constraints, and junction objects.

---

## 2. Implemented Entity Relationships

```
+-------------------------------------------------------------------------------+
|                       SALESFORCE OBJECT RELATIONSHIP MODEL                    |
+-------------------------------------------------------------------------------+

     [ Account ] (Taxpayer Household)
          |
          | 1:N Lookup
          v
     [ Contact ] (Citizen / Owner) <──────────── [ User ] (Municipal Officer)
          |                                            |
          +─────────────────────────────+              | Assigned Officer
          |                             |              | (Lookup)
          | 1:N Lookup                  | 1:N Lookup   |
          v                             v              v
    [ Property__c ] <───────────────────+──────────────+
          |
          +─────────────────────────────+
          | 1:N Master-Detail           | 1:N Lookup
          v                             v
 [ Tax_Assessment__c ]         [ Reassessment_Request__c ]
          |
          | 1:N Master-Detail
          v
  [ Tax_Payment__c ]
```

### Relationship Invariants:
1. **Master-Detail (`Property__c` $\to$ `Tax_Assessment__c`)**: Ensures tax assessments cannot exist orphaned without a physical parcel; cascades security permissions.
2. **Master-Detail (`Tax_Assessment__c` $\to$ `Tax_Payment__c`)**: Enforces roll-up summary capability for `Total_Paid_Amount__c` and prevents unrecorded payment deletions.
3. **Lookup (`Contact` $\to$ `Property__c`)**: Allows title ownership mutation without deleting the parcel history.
4. **Junction Object Demonstration**: `Property_Officer_Assignment__c` (Junction between `Property__c` and `User` for multi-inspector verification panels).

---

## 3. Status & Evidence

- **Status**: Implemented Locally / Staged in DX Metadata (`salesforce/force-app/main/default/objects/`).
- **Files**: `Property__c.object-meta.xml`, `Tax_Assessment__c.object-meta.xml`, `Tax_Payment__c.object-meta.xml`.
