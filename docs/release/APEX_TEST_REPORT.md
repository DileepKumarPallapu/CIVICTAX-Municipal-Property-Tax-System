# CivicTax Apex Test Strategy & Execution Specification

## 1. Test Architecture Overview

All Apex test classes are designed following Salesforce best practices:
1. `SeeAllData=false` to guarantee test isolation.
2. Use of `@TestSetup` methods for bulk test data instantiation.
3. Strict assertions verifying positive flows, boundary negative conditions, and bulk governor limits.

---

## 2. Apex Test Matrix & Coverage Targets

| Apex Test Class | Target Component | Scenarios Tested | Expected Coverage |
| :--- | :--- | :--- | :--- |
| **`PropertyServiceTest`** | `PropertyService.cls` | Registration, validation, duplicate prevention, zone assignment. | $91\%$ |
| **`TaxCalculationTest`** | `TaxCalculationService.cls` | Residential/Commercial rates, rebate discounts, overdue penalty math. | $96\%$ |
| **`PaymentServiceTest`** | `PaymentService.cls` | Full payment balance zeroing, partial payments, idempotency. | $88\%$ |
| **`CivicTaxRestResourceTest`** | `CivicTaxRestResource.cls` | REST GET/POST handling, serialization, status codes. | $85\%$ |
| **`CivicTaxAsyncJobsTest`** | `CivicTaxAsyncJobs.cls` | Queueable dispatch, Batch assessment run, Scheduled execution. | $89\%$ |
| **`TriggerHandlerTest`** | `PropertyTrigger`, `TaxPaymentTrigger` | Before/After event routing, recursion prevention. | $92\%$ |

---

## 3. Execution Command in Playground

```bash
sf apex run test --target-org CivicTaxPlayground --code-coverage --result-format human
```
