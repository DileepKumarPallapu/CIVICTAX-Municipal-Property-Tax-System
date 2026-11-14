# CivicTax 6.0: Modular Apex Architecture & Service Layer Design

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Service Layer Catalog

CivicTax 6.0 establishes eight specialized Apex services implementing enterprise software patterns:

```
+---------------------------------------------------------------------------------------------------+
|                                 CIVICTAX 6.0 APEX SERVICE ECOSYSTEM                              |
+---------------------------------------------------------------------------------------------------+
| 1. CivicTaxPropertyService     : Registration validations, plot boundary guards & verification    |
| 2. CivicTaxAssessmentService   : Unit Area Value math engine, prompt rebate & status lifecycle    |
| 3. CivicTaxPaymentService      : Atomic ledger settlement, anti-duplicate lock & balance updates  |
| 4. CivicTaxGrievanceService    : Citizen ticket intake, priority SLA assignment & officer reviews |
| 5. CivicTaxReassessmentService : Multi-step approval submission & statutory recalculation         |
| 6. CivicTaxDashboardService    : Direct SOQL aggregation of executive municipal KPIs              |
| 7. CivicTaxSecurityService     : Granular CRUD, FLS and Security.stripInaccessible enforcements  |
| 8. CivicTaxIntegrationService  : External REST normalization, error handling & payload routing   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Architectural Best Practices Implemented

1. **Strict `with sharing` Enclosure**:
   - All classes enforce user sharing rules and organizational boundaries.
2. **Zero SOQL / DML Inside Loops**:
   - Every database query and manipulation is bulkified using Sets, Maps, and list collections.
3. **Defense-in-Depth Field-Level Security**:
   - Employs `WITH SECURITY_ENFORCED` on SOQL queries and `Security.stripInaccessible()` on DML operations.
4. **Deterministic Exception Handling**:
   - Custom typed exception classes (`PropertyServiceException`, `PaymentException`, `AssessmentException`) guarantee structured error messaging to the API gateway.
