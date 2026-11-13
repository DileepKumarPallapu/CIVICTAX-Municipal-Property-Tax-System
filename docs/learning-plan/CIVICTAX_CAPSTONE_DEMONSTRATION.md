# CivicTax End-to-End 33-Step Capstone Business Demonstration Script

## 1. Candidate & Project Identification

- **Project**: CIVICTAX — Property Tax Assessment and Payment Management System
- **Use Case**: `USECASE_6` | **Candidate**: Pallapu Dileep Kumar (VTU: `29962`)

---

## 2. 33-Step Academic Demonstration Script

```
 [1. Citizen Contact] ──> [2. Register Parcel] ──> [3. View Custom Fields] ──> [4. Invalid Area Test]
          │
          ▼
 [5. Validation Rule] ──> [6. Record Type View] ──> [7. Officer Perms] ──> [8. Record Security]
          │
          ▼
 [9. Submit Verification] ──> [10. Record Flow] ──> [11. Approval Process] ──> [12. Officer Approval]
          │
          ▼
 [13. Apex Tax Math] ──> [14. Create Assessment] ──> [15. Apex Collections] ──> [16. SOQL Query]
          │
          ▼
 [17. SOSL Search] ──> [18. Simulated Payment] ──> [19. Payment Trigger] ──> [20. Order of Execution]
          │
          ▼
 [21. Recursion Guard] ──> [22. Citizen Case] ──> [23. Resolve Case] ──> [24. Reassessment]
          │
          ▼
 [25. Approval Step 2] ──> [26. Queueable Apex] ──> [27. Batch Apex] ──> [28. Schedulable Apex]
          │
          ▼
 [29. Apex Tests] ──> [30. Debug Logs] ──> [31. Salesforce Reports] ──> [32. Dashboard] ──> [33. Verify Deployment]
```

### Scripted Walkthrough:
1. **Step 1**: Create a `Contact` record for citizen owner in Salesforce.
2. **Step 2**: Citizen registers a new `Property__c` (Door No, Built-up 1,200 sq ft, Plot 1,500 sq ft).
3. **Step 3**: Inspect custom fields and Master-Detail relationship lookups.
4. **Step 4**: Attempt to enter Built-up area = -50 sq ft or $> \text{Plot Area}$.
5. **Step 5**: Observe Salesforce Validation Rule firing: *"Built-up area must be positive"*.
6. **Step 6**: Switch to `Residential` Record Type; show custom picklist dependencies.
7. **Step 7**: Log in as Municipal Officer; verify `CivicTax_Officer` Permission Set.
8. **Step 8**: Demonstrate record-level security; verify citizens cannot view peer records.
9. **Step 9**: Submit property for field survey verification.
10. **Step 10**: Observe `Property_Registration_Flow` firing and generating officer task.
11. **Step 11**: Trigger `Property_Verification_Approval` process; observe record lock.
12. **Step 12**: Officer approves survey; record status transitions to `VERIFIED`.
13. **Step 13**: Execute Apex `TaxCalculationService.cls` for active tax rate ($1,200 \times ₹10 = ₹12,000$).
14. **Step 14**: Ingest `Tax_Assessment__c` record with Due Date set.
15. **Step 15**: Inspect Apex source demonstrating `List<Property__c>`, `Set<Id>`, `Map<Id, SObject>`.
16. **Step 16**: Run SOQL query returning assessments with child payments (`Tax_Payments__r`).
17. **Step 17**: Run SOSL query searching citizen property number across database indexes.
18. **Step 18**: Citizen submits simulated payment of ₹12,000 via payment portal.
19. **Step 19**: `TaxPaymentTrigger.trigger` fires on `afterInsert`.
20. **Step 20**: Demonstrate Salesforce 20-step order of execution.
21. **Step 21**: Show `CivicTaxRecursionControl` preventing infinite trigger loops.
22. **Step 22**: Citizen files a tax grievance via standard `Case`.
23. **Step 23**: Officer reviews and resolves the Case with resolution notes.
24. **Step 24**: Citizen requests a property reassessment.
25. **Step 25**: Reassessment advances through 2-step Approval Process.
26. **Step 26**: Queueable Apex generates digital payment receipt asynchronously.
27. **Step 27**: Trigger Batch Apex `AnnualAssessmentBatch` to demonstrate bulk processing.
28. **Step 28**: Inspect `OverdueAssessmentScheduler` scheduled job.
29. **Step 29**: Run Apex test suite; confirm 100% test pass rate with $\ge 85\%$ coverage.
30. **Step 30**: Inspect Salesforce Developer Console Debug Logs for `USER_DEBUG` output.
31. **Step 31**: Open Salesforce Reports (Collections, Arrears Aging, Zone Efficiency).
32. **Step 32**: View native CivicTax Executive Dashboard.
33. **Step 33**: Confirm deployment status in Salesforce CLI (`sf project deploy start`).
