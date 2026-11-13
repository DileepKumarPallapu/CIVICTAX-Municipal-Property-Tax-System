# CivicTax Service Level Agreement (SLA) Engine

## 1. SLA Architecture & Policy Framework

The CivicTax SLA Engine enforces statutory municipal citizen charter deadlines. It calculates working days, excludes public holidays and official weekends, monitors active remaining duration, and flags overdue breaches.

---

## 2. Statutory Turnaround Targets

| Service Type | Statutory SLA (Working Days) | Grace Period | Escalation Officer |
| :--- | :--- | :--- | :--- |
| **Property Registration & Verification** | 7 Working Days | 2 Days | Assistant Revenue Officer |
| **Tax Assessment Review / Grievance** | 10 Working Days | 3 Days | Zonal Revenue Officer |
| **Reassessment Inspection & Decision** | 14 Working Days | 3 Days | Executive Engineer |
| **Ownership Transfer / Title Mutation** | 15 Working Days | 5 Days | Municipal Commissioner |
| **Property Information Correction** | 5 Working Days | 1 Day | Superintendent |
| **Citizen Appointment Booking** | 2 Working Days | 0 Days | Helpdesk Lead |

---

## 3. Working Days Calculation & Completion Rule

1. **Working Days Formula**:
   - Skips Saturdays and Sundays.
   - Skips configured official municipal holidays.
2. **Authoritative Completion Rule**:
   - An SLA is **never** recorded as met or breached without an **immutable completion timestamp** (`completedAt`).
   - If an item is in progress and $\text{Current Date} > \text{SLA Due Date}$, status is `BREACHED_PENDING`.
   - If completed on or before $\text{SLA Due Date}$, status is `MET_ON_TIME`.
   - If completed after $\text{SLA Due Date}$, status is `MET_DELAYED`.
