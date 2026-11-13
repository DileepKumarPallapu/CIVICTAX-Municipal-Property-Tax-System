# CivicTax Salesforce Database Entity-Relationship Diagram (ERD)

## 1. Visual Entity-Relationship Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                CIVICTAX ENTITY-RELATIONSHIP MODEL                                 |
+---------------------------------------------------------------------------------------------------+

     [ Account ] (Taxpayer Household / Org)
          |
          | 1:N (Lookup)
          v
     [ Contact ] (Citizen / Owner) <---------------------------- [ User ] (Municipal Officer)
          |                                                            |
          +-----------------------------+                              | Assigned Officer
          |                             |                              | (Lookup)
          | 1:N (Lookup)                | 1:N (Lookup)                 |
          v                             v                              v
    [ Property__c ] <-------------------+----------------------+-------+
          |
          +----------------------------------+----------------------------------+
          | 1:N (Master-Detail)              | 1:N (Lookup)                     | 1:N (Lookup)
          v                                  v                                  v
 [ Tax_Assessment__c ]              [ Reassessment_Request__c ]       [ Property_Transfer_Request__c ]
          |                                  |                                  |
          | 1:N (Master-Detail)              v                                  v
          v                         [ Tax_Assessment__c ]              [ Property_Ownership_History__c ]
  [ Tax_Payment__c ]

  [ Property_Zone__c ] <---------- Lookup ---------- [ Property__c ]
  [ Tax_Rate__c ]      <---------- Lookup ---------- [ Tax_Assessment__c ]
  [ Case ]             <---------- Lookup ---------- [ Contact ] & [ Property__c ]
```

---

## 2. Relationship Semantics & Deletion Policies

### 2.1 Master-Detail Relationships (Financial Cascade Integrity)
1. **`Property__c` $\to$ `Tax_Assessment__c`**:
   - Master-Detail relationship.
   - Deleting a property purges associated assessments (only permitted prior to active tax collection).
   - Deletion is strictly prevented via trigger validation if payment receipts exist.
2. **`Tax_Assessment__c` $\to$ `Tax_Payment__c`**:
   - Master-Detail relationship.
   - Financial ledger integrity: Roll-up summary fields compute `Total_Paid_Amount__c` automatically on the assessment statement.
   - Direct manual deletion of `Tax_Payment__c` records is prohibited by Apex trigger guards.

### 2.2 Lookup Relationships (Decoupled Governance)
1. **`Contact` (Owner) $\to$ `Property__c`**: Lookup relationship allowing property transfer to a new citizen without deleting the physical parcel.
2. **`Property_Zone__c` $\to$ `Property__c`**: Jurisdictional boundary link.
3. **`User` (Officer) $\to$ `Property__c`**: Operational routing link that reassigns when municipal officers transfer wards.
