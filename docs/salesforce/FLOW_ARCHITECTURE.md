# CivicTax 6.0: Declarative Automation & Salesforce Flow Architecture

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Flow Ecosystem Overview

CivicTax 6.0 leverages Salesforce Lightning Flow Builder to deliver automated, event-driven municipal processing without writing unnecessary custom Apex code.

```
+---------------------------------------------------------------------------------------------------+
|                                 CIVICTAX 6.0 FLOW INVENTORY (7 FLOWS)                             |
+---------------------------------------------------------------------------------------------------+
| 1. Property Registration Flow       : Record-triggered on Property__c CREATE. Generates survey task|
| 2. Property Verification Flow       : Record-triggered on Verification_Status__c = 'Verified'.     |
| 3. Assessment Approval Flow         : Evaluates threshold; routes high-value bills to Commissioner |
| 4. Payment Notification Flow        : Record-triggered on Tax_Payment__c SUCCESS. Emits receipt    |
| 5. Grievance Assignment Flow        : Matches ticket zone to queue; assigns SLA target milestone   |
| 6. Reassessment Review Flow         : Routes valuation disputes to Field Surveyor for inspection   |
| 7. Department Task Assignment Flow  : Auto-routes pending dockets to least-loaded zonal officers   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Patterns

1. **Record-Triggered After-Save Optimization**:
   - Field updates on related objects (e.g. creating `Task` linked to `Property__c` or updating `Tax_Assessment__c` balances) execute in the **After-Save** phase (`triggerType: RecordAfterSave`) to ensure the initiating record ID exists.
2. **Formula-Based Decision Guards**:
   - Every flow incorporates entry condition filters (e.g., `Transaction_Status__c = 'Success'`) so the flow runs only when relevant criteria are met.
3. **Fault Paths & Exception Logging**:
   - DML elements include explicit fault connectors routing database exceptions to an administrative compliance log (`Application_Audit__c`).
4. **Recursion & Infinite Loop Prevention**:
   - Flow entry criteria enforce strict `Only when a record is updated to meet the condition requirements`, preventing re-entrant cascading updates.
