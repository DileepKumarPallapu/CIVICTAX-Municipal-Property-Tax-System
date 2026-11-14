# CivicTax 5.0: Property Reassessment Automation Pipeline

## 1. Process Overview & Approval Workflow

The Reassessment Engine governs all structural, dimensional, and usage updates that alter a property's assessed value and annual tax liability.

```
[ Citizen Submission / Municipal Survey Audit ]
  │  Stage 1: Citizen or Field Officer initiates reassessment request
  │  Stage 2: Engine captures Current Parameters vs Proposed Parameters
  │  Stage 3: Supporting documents uploaded (Building plan approval, usage license)
  ▼
[ Preliminary Revenue Review ]
  │  Stage 4: Revenue Clerk checks clerical eligibility and document authenticity
  │  Stage 5: Task routed to Field Survey Officer for physical verification
  ▼
[ Multi-Step Statutory Approval Matrix ]
  │  Stage 6: Field Survey Officer uploads ground measurements & recommendation
  │  Stage 7: Approval Step 1 — Revenue Inspector certifies survey accuracy
  │  Stage 8: Approval Step 2 — Municipal Commissioner grants final statutory approval
  ▼
[ Automated Tax Recalculation & Financial Adjustment ]
  │  Stage 9: Engine executes deterministic tax calculation formula
  │  Stage 10: System computes delta between Old Assessed Tax and Revised Tax
  │  Stage 11: Generation of Credit Note (Refund) OR Supplemental Arrears Bill
  │  Stage 12: Superseded Assessment archived; Version 2 Bill published
```

---

## 2. Parameter Comparison Matrix

The reassessment engine tracks changes across four core valuation vectors:

```
+---------------------+-------------------------+-------------------------+-------------------------+
| Valuation Vector    | Current Baseline Value  | Proposed Revision Value | Impact on Tax Baseline  |
+---------------------+-------------------------+-------------------------+-------------------------+
| Built-up Area       | 1,200 sq.ft.            | 1,650 sq.ft. (+450)     | +37.5% Base Unit Value  |
| Usage Category      | Residential             | Mixed Commercial (GF)   | +80.0% Unit Area Value  |
| Occupancy Status    | Self-Occupied           | Tenant / Rented         | Removal of 10% Rebate   |
| Age Depreciation    | 5 Years (10% rebate)    | 5 Years (10% rebate)    | Pro-rated on new floor  |
+---------------------+-------------------------+-------------------------+-------------------------+
```

---

## 3. Financial Recomputation & Delta Settlement Rules

When an approved reassessment modifies tax liability:

1. **Incremental Liability (New Tax > Old Tax)**:
   - A **Supplemental Arrears Demand Note** is issued with unique bill reference `ARR-YYYY-XXXXX`.
   - Citizen is granted 30 calendar days to settle the delta without penalty.
   - If unpaid after 30 days, standard 1.5% monthly compound interest applies from the effective reassessment date.
2. **Reduced Liability (New Tax < Old Tax)**:
   - If citizen has already paid previous bill: An **Adjustable Municipal Credit Note** is generated (`CRN-YYYY-XXXXX`).
   - The credit balance automatically offsets the upcoming financial year's assessment bill.
   - Direct bank refund can be requested for credit amounts exceeding ₹10,000.

---

## 4. Statutory Approval Matrix

```
                          [ Reassessment Submitted ]
                                     │
                                     ▼
                      [ Step 1: Revenue Inspector ]
                      - Validates survey physical accuracy
                      - Action: [ Approve & Forward ] | [ Reject ]
                                     │
                                     ▼
                    [ Step 2: Municipal Commissioner ]
                    - Grants statutory seal under Municipal Act
                    - Action: [ Final Approval ] | [ Return for Rework ]
                                     │
                                     ▼
                        [ System Recalculation Engine ]
```

- **Clerical Immunity**: No single officer can both survey a property and grant final statutory reassessment approval.
- **Mandatory Justification**: Rejection at any step requires a structured reason code and detailed statutory note.

---

## 5. Salesforce Platform Architecture Parity

- **Custom Object**: `Reassessment_Request__c` with master-detail relationship to `Property__c` and lookup to `Tax_Assessment__c`.
- **Approval Process**: `Reassessment_Statutory_Approval_v1` using native Salesforce Approval Processes with parallel and sequential approvers.
- **Automated Apex Handler**: `ReassessmentTriggerHandler.cls` calling `TaxCalculationService.cls` on final approval state change.
- **History Tracking**: Salesforce Field History Tracking enabled on all dimensional fields.
