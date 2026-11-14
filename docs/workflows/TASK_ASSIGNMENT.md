# CivicTax 5.0: Intelligent Task Assignment & Workload Balancing

## 1. Routing Architecture & Core Objectives

The CivicTax 5.0 Task Routing Engine guarantees equitable distribution of municipal operational duties, prevents officer bottlenecks, and enforces strict geographical zone jurisdiction.

```
                                [ Incoming Work Item ]
                     (Property Reg / Verification / Grievance / Reassessment)
                                          │
                                          ▼
                               [ Task Routing Engine ]
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       [ Step 1: Zone Matching ]                     [ Step 2: Role Qualification ]
       Matches Property Zone                         Filters officers having required
       (e.g., Zone A, Ward 04)                       permission set (e.g., Inspector)
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          ▼
                             [ Step 3: Capacity Filter ]
                             Eliminates officers at or above
                             active capacity limit (Max: 10)
                                          │
                                          ▼
                           [ Step 4: Least-Loaded Selection ]
                           Routes to qualified officer with
                           lowest active task count
                                          │
                                          ▼
                        [ Task Created & In-App Alert Emitted ]
```

---

## 2. Municipal Workload Thresholds

| Officer Role | Primary Work Items | Maximum Concurrent Workload | Fallback Mechanism When Saturated |
|---|---|---|---|
| **Registration Clerk** | Property Initial Screen | 25 Active Applications | Overflow to Central Registration Pool |
| **Field Survey Officer** | Ground Physical Inspections | 10 Active Surveys | Escalation alert to Section Head |
| **Revenue Inspector** | Assessment Approvals & Reassessments | 15 Pending Approvals | Priority queue ordering by SLA urgency |
| **Grievance Officer** | Citizen Dispute Investigations | 12 Open Grievances | Dynamic round-robin across adjacent zones |
| **Municipal Commissioner** | Statutory Sanctions & High-Value Refunds | 50 Statutory Filings | Chronological batch review dashboard |

---

## 3. Workspaces: "My Tasks" vs "Team Tasks"

### A. "My Tasks" (Personal Dashboard)
- **Direct Accountability**: Displays work items exclusively assigned to the authenticated officer.
- **SLA Countdown Timer**: Visual indicator (Green > 50%, Amber 20-50%, Red < 20% or Breached).
- **One-Click Quick Actions**: Direct action buttons (`Verify Property`, `Approve Assessment`, `Resolve Grievance`).
- **Sort Orders**: Urgency-first (SLA time remaining ASC), Category, or Submission Date.

### B. "Team Tasks" (Department Pool)
- **Unassigned Queue**: Central holding docket for items awaiting manual assignment or overflow processing.
- **Supervisor Controls**: Department heads can manually reassign tasks with mandatory administrative justification.
- **Self-Assignment ("Claim Task")**: Eligible officers can pull unassigned items from their zone pool.

---

## 4. Reassignment & Out-of-Office (OOO) Protocols

1. **Scheduled Leave / OOO Flag**:
   - When an officer activates OOO mode, the router automatically excludes them from incoming queue evaluations.
   - Active pending tasks with SLA < 24 hours are automatically reassigned to designated backup officers.
2. **Supervisor Reassignment Invariants**:
   - Reassignment must record: `Previous Officer`, `New Officer`, `Reassigning Supervisor`, `Reason Code`, and `Timestamp`.
   - The SLA timer is **not reset** upon reassignment; the original SLA clock continues uninterrupted.

---

## 5. Salesforce Platform Architecture Parity

- **Omni-Channel Routing**: Configured using Salesforce Omni-Channel Presence Statuses (`Available - Case Work`, `On Field Survey`, `Offline`).
- **Routing Configurations & Queues**:
  - `Zone_A_Property_Queue`
  - `Zone_B_Property_Queue`
  - `Grievance_Tier1_Queue`
  - `Commissioner_Approval_Queue`
- **Standard Salesforce Tasks**: Enhanced Tasks with custom metadata fields for `Zone__c`, `SLA_Deadline__c`, and `Source_Record_Id__c`.
