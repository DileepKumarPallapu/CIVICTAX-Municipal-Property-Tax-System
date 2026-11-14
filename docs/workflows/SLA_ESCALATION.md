# CivicTax 5.0: Service Level Agreement (SLA) & Automated Escalation Engine

## 1. SLA Clock Engine & Business Hours

The CivicTax 5.0 SLA Engine guarantees regulatory compliance by calculating elapsed operational time strictly against municipal statutory working hours.

```
+---------------------------------------------------------------------------------------------------+
|                                  MUNICIPAL BUSINESS HOURS POLICY                                  |
+---------------------------------------------------------------------------------------------------+
|  Statutory Hours    :  09:00 AM - 05:30 PM IST (8.5 Hours per working day)                        |
|  Active Days        :  Monday through Friday                                                      |
|  Excluded Days      :  Saturdays, Sundays, and Gazetted Municipal Public Holidays                 |
|  Clock Behavior     :  Pauses automatically at 05:30 PM and resumes at 09:00 AM next business day |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Multi-Tier Escalation Hierarchy

The engine continuously tracks percentage-of-SLA consumed across all open municipal records:

```
[ Active Work Item Created ]
              │
              ▼
    [ 0% - 74% Elapsed ] ────────► Status: ON TRACK (Normal Queue Priority)
              │
              ▼
    [ 75% - 99% Elapsed ] ───────► TIER 1 WARNING
                                   - In-App Notification Bell to Assigned Officer
                                   - Priority visually highlighted in Amber
                                   - Reminder queued for next morning digest
              │
              ▼
    [ 100% Elapsed ] ────────────► TIER 2 BREACH
                                   - Record flagged as SLA_BREACHED
                                   - Automated Alert sent to Zonal Supervisor / Section Head
                                   - Work item moved to top of Department Queue (Priority: HIGH)
              │
              ▼
    [ +24h Post-Breach ] ────────► TIER 3 EXECUTIVE ESCALATION
                                   - Direct Escalation to Municipal Commissioner
                                   - Record reassigned to Senior Reserve Officer
                                   - Mandatory non-compliance justification logged in Audit Vault
```

---

## 3. SLA Matrix Across Operational Workflows

| Municipal Workflow | Standard Target SLA | Tier 1 Warning (75%) | Tier 2 Breach (100%) | Tier 3 Escalation (+24h) |
|---|---|---|---|---|
| **Property Initial Review** | 3 Business Days | 19.1 Business Hours | 25.5 Business Hours | 49.5 Business Hours |
| **Field Verification Survey** | 5 Business Days | 31.8 Business Hours | 42.5 Business Hours | 66.5 Business Hours |
| **Tax Assessment Publishing** | 2 Business Days | 12.7 Business Hours | 17.0 Business Hours | 41.0 Business Hours |
| **Critical Payment Grievance** | 24 Elapsed Hours | 18.0 Elapsed Hours | 24.0 Elapsed Hours | 48.0 Elapsed Hours |
| **Standard Dispute Grievance** | 5 Business Days | 31.8 Business Hours | 42.5 Business Hours | 66.5 Business Hours |
| **Property Reassessment** | 7 Business Days | 44.6 Business Hours | 59.5 Business Hours | 83.5 Business Hours |

---

## 4. Background SLA Monitor Architecture

In CivicTax, the SLA Engine evaluates running clocks using a dedicated background evaluation loop:

```typescript
export interface SlaEvaluationResult {
  recordId: string;
  workflowType: string;
  assignedOfficerId: string;
  targetSlaHours: number;
  businessHoursElapsed: number;
  percentageConsumed: number;
  slaStatus: 'COMPLIANT' | 'WARNING' | 'BREACHED' | 'CRITICALLY_OVERDUE';
  recommendedAction: 'NONE' | 'EMIT_REMINDER' | 'ALERT_SUPERVISOR' | 'REASSIGN';
}
```

- **Cron Scheduling**: Executes every 15 minutes during business hours.
- **Deduplication Check**: Ensures an officer receives only **one** escalation notification per breach tier to prevent notification flooding.
- **Reporting Metrics**: Computes municipal SLA Compliance Ratio:
  $$\text{SLA Compliance \%} = \left(\frac{\text{Records Resolved Within SLA}}{\text{Total Records Resolved}}\right) \times 100$$

---

## 5. Salesforce Platform Architecture Parity

- **Entitlement Processes**: Standard Salesforce Entitlement Management with business hours linked to `India_Standard_Time_Business_Hours`.
- **Milestones**: Configured with Warning Actions (Field Updates & Email Alerts) and Violation Actions (Escalation to Queue).
- **Case Escalation Rules**: Standard Salesforce Escalation Rules routing overdue cases to `Escalated_Cases_Queue`.
- **Scheduled Apex**: `SlaEscalationBatch.cls` implementing `Database.Batchable<sObject>, Schedulable` running on hourly cron.
