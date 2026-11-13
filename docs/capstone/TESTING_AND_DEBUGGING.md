# CivicTax Apex Testing, Debugging & Code Coverage Strategy

## 1. Quality Standards & Coverage Target

Salesforce requires a minimum of $75\%$ Apex test coverage for deployment. CivicTax enforces a strict internal target of **$\ge 85\%$** across all service classes, triggers, and asynchronous jobs.

---

## 2. Test Architecture Best Practices

1. **Isolation (`SeeAllData=false`)**: Tests run in an isolated memory sandbox without dependency on pre-existing org data.
2. **Bulk Data Factories (`CivicTaxTestDataFactory.cls`)**: Centralizes creation of standard Accounts, Contacts, Municipal Zones, Tax Rates, and Properties in batches of 200.
3. **`Test.startTest()` & `Test.stopTest()`**: Resets governor limit counters and forces asynchronous Queueable and Batch jobs to run synchronously to completion before assertions execute.
4. **`System.runAs()`**: Enforces user profile security context when testing `CivicTax_Citizen` and `CivicTax_Officer` permission sets.

---

## 3. Apex Test Matrix

| Test Class | Focus | Assertions Verified |
| :--- | :--- | :--- |
| **`PropertyServiceTest`** | `PropertyService.cls` | Successful parcel insertion, duplicate rejection, and zone inspector assignment. |
| **`TaxCalculationTest`** | `TaxCalculationService.cls` | Base tax formula, early-bird rebate ($5\%$), arrears penalty ($2\%$, $5\%$, $10\%$). |
| **`PaymentServiceTest`** | `PaymentService.cls` | ACID transaction handling, balance reduction, idempotency token validation. |
| **`CivicTaxAsyncJobsTest`** | `CivicTaxAsyncJobs.cls` | Queueable job chaining, Batch assessment scope processing, Schedulable CRON trigger. |
| **`TriggerHandlerTest`** | `PropertyTrigger`, `TaxPaymentTrigger` | Recursion control, before/after event routing, rollup balance updates. |

---

## 4. Debugging & Diagnostic Protocols

When diagnosing Apex or Flow errors:
- Inspect Salesforce Developer Console **Debug Logs** with filters set to `Apex Code: FINEST`, `Validation: INFO`, `Workflow: INFO`.
- Monitor `Application_Audit__c` records for logged system exception stack traces.
