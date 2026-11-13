# CivicTax Revenue Recovery Engine & Arrears Aging Specification

## 1. Arrears Aging Architecture

CivicTax features an automated Arrears Aging and Delinquency Analysis engine that continuously analyzes property tax dues against scheduled statutory assessment payment dates.

```
+-------------------------------------------------------------------------------+
|                       DELINQUENCY AGING TIMELINE BUCKETS                      |
+-------------------------------------------------------------------------------+

 Current Due Date
        |
        v
  [ NOT DUE ] ----->  [ 1 - 30 DAYS ] -----> [ 31 - 60 DAYS ] -----> [ 61 - 90 DAYS ] -----> [ > 90 DAYS ]
   Active Period      Initial Notice         Urgent Notice           Formal Demand          Distraint Warrant
   No Late Penalty     2% Flat Late Fee       5% Cumulative Fee       10% Interest           Legal Attachment
```

---

## 2. Dynamic Delinquency Bucketing Logic

The aging calculation is computed dynamically based on the authoritative due date of the assessment:

$$\text{Days Overdue} = \max\left(0, \left\lfloor \frac{\text{Current Date} - \text{Assessment Due Date}}{86400000} \right\rfloor\right)$$

| Aging Bucket | Days Overdue Range | Penalty Rule | Automated Enforcement Action |
| :--- | :--- | :--- | :--- |
| **Not Due** | $\le 0$ days | Nil ($0\%$) | Courtesy SMS & Email Reminder prior to deadline |
| **1–30 Days** | $1 \text{ to } 30$ days | $2\%$ late penalty | First Payment Advisory Notice (Soft Reminder) |
| **31–60 Days** | $31 \text{ to } 60$ days | $5\%$ late penalty | Formal Demand Notice (Officer Follow-up Assigned) |
| **61–90 Days** | $61 \text{ to } 90$ days | $10\%$ statutory interest | Escalated Recovery Case opened; In-person Inspection |
| **>90 Days** | $\ge 91$ days | $18\%$ per annum compound | Legal Notice for Distraint & Utility Attachment |

---

## 3. Recovery Case Lifecycle

```
[ IDENTIFIED DELINQUENCY ]
            |
            v
[ RECOVERY CASE CREATED ] ---> Priority: LOW (1-30d), MEDIUM (31-60d), HIGH (61-90d), CRITICAL (>90d)
            |
            v
[ OFFICER ASSIGNMENT ] ------> Assigned to Revenue Inspector based on Municipal Zone
            |
            v
[ HEARING / NOTICE ISSUED ] -> Notice generation with tracking ID & QR code verification
            |
            v
   +--------+--------+
   |                 |
   v                 v
[ SETTLED IN FULL ]  [ ESCALATED / LEGAL ACTION ]
```

1. **Case Creation**: Generated when an assessment reaches $>30$ days delinquency or balance exceeds ₹25,000.
2. **Prioritization**:
   - `CRITICAL`: Dues $> 90$ days AND Balance $> ₹50,000$.
   - `HIGH`: Dues $61 - 90$ days OR Balance $> ₹25,000$.
   - `MEDIUM`: Dues $31 - 60$ days.
   - `LOW`: Dues $1 - 30$ days.
3. **Officer Assignment**: Automatically routed to the designated Revenue Officer for the property's zone.
4. **Follow-up Scheduling**: Officers schedule physical visits or telephonic hearings with mandatory logged notes.
5. **Recovery History**: Immutable chronological audit log of all communications, partial payments, and status transitions.
