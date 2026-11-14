# CivicTax 5.0: Multi-Channel Notification Engine

## 1. Notification Architecture & Channels

The CivicTax 5.0 Notification Engine provides timely, reliable, and auditable communications to citizens and municipal staff across three integrated channels:

```
                                  [ Municipal Event Trigger ]
                         (Payment Success / Bill Generated / SLA Alert)
                                                │
                                                ▼
                                    [ Notification Engine ]
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          ▼                     ▼                     ▼
                 [ In-App Bell ]         [ Simulated SMS ]      [ Simulated Email ]
                 - Real-time banner      - 160-char SMS         - Rich HTML receipt
                 - Unread badge counter  - DND compliant        - Attached PDF link
                 - Click to navigate     - Gateway log entry    - Statutory notice
                          │                     │                     │
                          └─────────────────────┼─────────────────────┘
                                                ▼
                                    [ Delivery State Tracker ]
                               (Queued -> Dispatched -> Delivered -> Read)
```

---

## 2. Event Triggers & Notification Templates

| Event Code | Trigger Description | Target Recipient | Channel | Template Summary |
|---|---|---|---|---|
| `NOTIF-EVT-01` | Property Application Submitted | Citizen | In-App + SMS | "Your property registration [PROP-ID] has been received. Track status online." |
| `NOTIF-EVT-02` | Field Verification Scheduled | Citizen | SMS + In-App | "Municipal Surveyor will visit your property on [Date] between 10am-1pm." |
| `NOTIF-EVT-03` | Tax Bill Published | Citizen | Email + In-App | "Annual Property Tax Bill for FY 2026-27 is ready. Pay before April 30 for 5% rebate." |
| `NOTIF-EVT-04` | Payment Confirmed | Citizen | SMS + Email | "Receipt [RCT-ID] generated. ₹[Amount] received with thanks for Property [PROP-ID]." |
| `NOTIF-EVT-05` | Grievance Resolution Proposal | Citizen | SMS + In-App | "Resolution proposed for [GRV-ID]. Review and accept within 72h." |
| `NOTIF-EVT-06` | SLA Tier-1 Warning | Assigned Officer | In-App | "Warning: Task [ID] has reached 75% of statutory SLA. Action required." |
| `NOTIF-EVT-07` | SLA Tier-2 Breach Escalation | Supervisor | In-App + Email | "Breach Alert: Record [ID] is overdue. Immediate supervisory review required." |

---

## 3. Delivery State Lifecycle & Schema

Every notification records its transmission state through an immutable lifecycle:

```typescript
export interface MunicipalNotification {
  notificationId: string;       // e.g. "NOTIF-2026-09281"
  recipientUserId: string;
  recipientRole: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  channel: 'IN_APP' | 'SMS' | 'EMAIL';
  eventCategory: 'REGISTRATION' | 'ASSESSMENT' | 'PAYMENT' | 'GRIEVANCE' | 'SLA_ALERT';
  headline: string;
  body: string;
  actionUrl?: string;           // Direct deep-link to record
  status: 'QUEUED' | 'DISPATCHED' | 'DELIVERED' | 'READ' | 'FAILED';
  queuedAt: string;
  deliveredAt?: string;
  readAt?: string;
  idempotencyKey: string;       // Prevents duplicate sends
}
```

---

## 4. Anti-Spam, Deduplication & Throttling Rules

1. **Idempotency Guard**:
   - Each event calculates a deterministic key: `hash(recordId + eventType + targetState)`.
   - Re-triggering the same event state within 24 hours will skip dispatch without creating duplicate alerts.
2. **Batch Digesting for Officers**:
   - Non-critical notifications (e.g., standard assignment notices) are batched into a morning digest if volume exceeds 5 items within an hour.
3. **Escalation Channel Cascade**:
   - If a citizen has not opened a critical In-App alert within 24 hours, the engine automatically escalates to a transactional SMS dispatch.

---

## 5. Salesforce Platform Architecture Parity

- **Custom Notifications**: Defined via `CustomNotificationType` in Salesforce Setup, dispatched using `Messaging.CustomNotification` in Apex.
- **Platform Events**: `CivicTax_Notification__e` with publish-subscribe pattern decoupling transaction logic from messaging.
- **Apex Email Service**: Single email messaging with `Messaging.SingleEmailMessage`, using Visualforce/Lightning Email Templates.
- **Omni-Channel Alerts**: Audible and visual popups in Salesforce Service Console when new work is routed to an officer.
