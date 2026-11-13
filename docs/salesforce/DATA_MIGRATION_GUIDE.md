# CivicTax Local to Salesforce Data Migration Guide

## 1. Migration Protocol & Philosophy

The CivicTax Data Migration tool provides an administrator-controlled, non-destructive path to synchronize records from the local repository into an authoritative Salesforce instance.

---

## 2. Migration Invariants

1. **Non-Destructive Guarantee**: Local storage and SQLite database records are **never** deleted or truncated during migration.
2. **Explicit Test-Data Labeling**: Simulated demo payment records are flagged with `Is_Demo_Data__c = true` in Salesforce to prevent distorting real municipal ledger accounts.
3. **Idempotency & External ID Mapping**: CivicTax properties use `Property_Number__c` as the External ID with `upsert` semantics to prevent duplicate records upon rerun.

---

## 3. Migration Sequence

```
1. Municipal Zones & Tax Rates Master
       |
       v
2. Citizen Accounts & Contacts (Identity Setup)
       |
       v
3. Properties (Mapped with Owner Contact ID & Zone ID)
       |
       v
4. Tax Assessments (Linked to Master-Detail Property__c)
       |
       v
5. Tax Payments (Linked to Master-Detail Tax_Assessment__c)
       |
       v
6. Grievances & Service Requests
```

---

## 4. Execution via CivicTax Admin UI

1. Log into the CivicTax Admin Portal.
2. Navigate to **System Settings > Salesforce Integration**.
3. Click **"Run Migration Preview"** to inspect mapped counts, validation checks, and potential schema conflicts.
4. Click **"Start Controlled Sync"**. Monitor real-time batch progress and error reports.
