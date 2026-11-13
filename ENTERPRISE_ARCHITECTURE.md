# CIVICTAX 4.0 — Enterprise Architecture & Integration Specification

## 1. System Overview
CIVICTAX 4.0 is a production-grade municipal property tax administration platform designed for Urban Local Bodies (Municipal Corporations). It facilitates the complete end-to-end tax lifecycle:

```
┌─────────────────┐       ┌────────────────────┐       ┌───────────────────┐
│ Citizen Portal  │ <---> │ Municipal Services │ <---> │ Officer & Admin   │
│ • Registration  │       │ • Business Rules   │       │ • Verification    │
│ • Self-Service  │       │ • Audit Engine     │       │ • Assessment Gen  │
│ • Payments      │       │ • Search Index     │       │ • Revenue Ops     │
└─────────────────┘       └────────────────────┘       └───────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │ Reactive LocalStore │
                         │ (Salesforce Ready)  │
                         └─────────────────────┘
```

---

## 2. Advanced Role-Based Workspaces

### 🏛️ Citizen Portal (`/citizen`)
- **Self-Service Property Registration**: Multi-section form with deed validation and automated duplicate detection.
- **Verification Tracking**: Real-time inspection state alerts with officer feedback.
- **Annual Assessments**: Formula-driven breakdown of base tax, early discounts, and overdue penalties.
- **Simulated Online Checkout**: UPI, Card, and Net Banking simulation with overpayment safeguards and official PDF/Printable receipts.
- **5-Stage Grievance Tracking**: Stage milestones with timeline updates.
- **Traceable Reassessment Disputes**: Side-by-side comparative dispute submission.

### 👮 Municipal Officer Portal (`/officer`)
- **Zone Inspection Queue**: Inspection queue for assigned municipal zones.
- **Deed Verification Engine**: Approve, flag, or reject submissions with recorded officer reasons.
- **Assessment Generation**: Instant annual bill calculation using municipal gazette rates.
- **Adjudication Workspace**: Adjudicate citizen reassessments with traceable adjustment records.
- **Grievance Triage**: Stage progression, internal officer remarks, and resolution closures.

### 💼 Administrator Portal (`/admin`)
- **Global Revenue Analytics**: Corporation-wide revenue tracking with Recharts.
- **Municipal Zone Governance**: Ward demarcation, officer allocations, and revenue targets.
- **Gazette Tax Rate Configuration**: Category-wise and zone-wise rate schedules (`₹/sq ft`).
- **Immutable Audit Trail Ledger**: Chronological log of all administrative actions, payments, and approvals.
- **Sanitized Report Generator**: Sanitized CSV exports preventing spreadsheet formula injection.

---

## 3. Business Rule Engine & Data Consistency

All mutating operations run through the centralized **Business Rule Engine (`src/services/businessRules.ts`)**:
1. **Duplicate Property Safeguard**: Blocks registration of identical title deeds or duplicate parcels in the same zone.
2. **Verification Gate**: Strictly forbids generating annual tax bills for unverified or rejected properties.
3. **Discount Clamping**: Early payment rebates are clamped so they never exceed the base tax.
4. **Overpayment & Balance Protection**: Rejects payment amounts exceeding the outstanding balance.
5. **Traceable Reassessments**: Approved reassessments issue a revised assessment (`-R`) rather than overwriting historical financial records.
6. **Immutable Audit Logging**: Every critical action automatically appends an entry to `StorageService.recordAuditLog()`.
