# CivicTax 5.0: Grievance Redressal Automation Pipeline

## 1. Process Overview & State Machine

The CivicTax 5.0 Grievance Redressal Engine guarantees transparency, accountability, and time-bound resolution for citizen disputes relating to tax assessments, payments, records, and field inspections.

```
[ Citizen Portal / CiviAssist ]
  │  Stage 1: Citizen submits grievance ticket with supporting proof
  │  Stage 2: Engine assigns unique ticket ID (e.g., "GRV-2026-00892")
  ▼
[ Automated Triage & Priority Scoring ]
  │  Stage 3: Classifier assigns Category, Severity, and SLA target
  │  Stage 4: Automated assignment to Zonal Grievance Officer queue
  ▼
[ Investigation & Evidence Gathering ]
  │  Stage 5: Assigned Officer accepts ticket and begins investigation
  │  Stage 6: Officer attaches investigation notes, surveyor report, or financial trace
  ▼
[ Proposed Resolution & Citizen Concurrence ]
  │  Stage 7: Officer records proposed resolution and remedial action
  │  Stage 8: Citizen notified via SMS/Email/In-App alert
  │  Stage 9: Citizen accepts OR lodges appeal within 7 calendar days
  ▼
[ Closure & Quality Audit ]
  │  Stage 10: Automatic ticket closure upon citizen acceptance or 72h inactivity
  │  Stage 11: Citizen CSAT rating collected (1 to 5 stars)
  │  Stage 12: Immutable entry recorded in Application Audit Ledger
```

---

## 2. Classification & SLA Matrix

Every grievance is categorized and assigned an immutable SLA target clock:

| Category Code | Grievance Type | Default Priority | Target Resolution SLA | Escalation Threshold (Level 1) |
|---|---|---|---|---|
| `GRV-CAT-01` | **Assessment Calculation Error** | High (P2) | 48 Business Hours | 36 Hours (75%) |
| `GRV-CAT-02` | **Double Deduction / Payment Failure** | Critical (P1) | 24 Hours | 18 Hours (75%) |
| `GRV-CAT-03` | **Ownership / Title Dispute** | Medium (P3) | 5 Business Days | 3.75 Business Days |
| `GRV-CAT-04` | **Field Survey Discrepancy** | Medium (P3) | 5 Business Days | 3.75 Business Days |
| `GRV-CAT-05` | **Portal & Technical Issues** | Low (P4) | 10 Business Days | 7.5 Business Days |

---

## 3. Investigation Protocol & Evidence Capture

1. **Mandatory Investigation Dossier**:
   - Officer must document at least one detailed investigation log before submitting a resolution proposal.
   - Field disputes require upload of revised survey notes or geotagged photographs.
   - Financial disputes require gateway reconciliation reference (e.g., Razorpay/HDFC UTR number).
2. **Remedial Action Triggers**:
   - If `Assessment Calculation Error` is upheld, the engine automatically generates a draft `Reassessment_Request__c` pre-populated with officer notes.
   - If `Double Deduction` is upheld, the engine triggers an automatic refund authorization workflow to the municipal finance treasury.

---

## 4. Citizen Feedback & Appeal Lifecycle

```
                     [ Proposed Resolution ]
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
       [ Citizen Accepts ]              [ Citizen Appeals ]
               │                                 │
               ▼                                 ▼
        [ CSAT Rating ]                [ Escalate to Commissioner ]
               │                                 │
               ▼                                 ▼
      [ Ticket CLOSED ]                [ Final Determination ]
```

- **Auto-Closure Rule**: If no citizen action is recorded within 72 hours of resolution proposal, the ticket automatically transitions to `Closed - Deemed Accepted`.
- **Right to Appeal**: Citizens may appeal once within 7 calendar days. Appeals bypass the first-level officer and route directly to the Assistant Revenue Commissioner.

---

## 5. Salesforce Platform Architecture Parity

- **Primary Object**: Standard `Case` with Record Types (`Tax_Assessment_Dispute`, `Payment_Dispute`, `Clerical_Dispute`) or custom `Grievance__c`.
- **Entitlement Processes & Milestones**: Standard Salesforce Entitlement Management with Milestone Timers (`First_Response__c`, `Resolution__c`).
- **Assignment**: Salesforce Case Assignment Rules routing to `Zonal_Grievance_Queue`.
- **Omni-Channel**: Live agent workload routing ensuring no officer exceeds 15 concurrent open cases.
