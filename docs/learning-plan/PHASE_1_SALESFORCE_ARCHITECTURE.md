# Topic 11: Salesforce Development Fundamentals, Architecture & Streaming

## 1. Core Architecture Principles

CivicTax maps cleanly to the foundational architectural pillars of the Salesforce Platform:

```
+-------------------------------------------------------------------------------+
|                       SALESFORCE PLATFORM ARCHITECTURE                        |
+-------------------------------------------------------------------------------+

   [ Presentation (View) ]    ───> Lightning Web Components (LWC) & React Portal
   [ Business Logic (Ctrl) ]  ───> Apex Services & Single-Trigger Framework
   [ Data Model (Model) ]     ───> Custom Objects (Property__c, Tax_Assessment__c)
   [ Multi-Tenant Security ]  ───> Governor Limits & Metadata-Driven Runtime
```

---

## 2. Multi-Tenancy & Governor Limit Management

Salesforce enforces resource allocation constraints across tenants in shared infrastructure:

| Governor Limit | Synchronous Apex Limit | Asynchronous Apex Limit | CivicTax Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Total SOQL Queries** | 100 queries | 200 queries | Collections outside loops; single SOQL queries fetching bulk maps. |
| **Total SOQL Records** | 50,000 records | 50,000 records | Pagination with `LIMIT` & `OFFSET`; SOQL query filters. |
| **Total DML Statements** | 150 statements | 150 statements | Bulk DML (`insert list` instead of `insert prop` in loops). |
| **Maximum CPU Time** | 10,000 ms (10s) | 60,000 ms (60s) | Efficient Map lookups; offloading heavy tasks to Queueable/Batch. |
| **Maximum Heap Size** | 6 MB | 12 MB | Pruning transient variables; query field minimization. |

---

## 3. Platform Events & Change Data Capture (CDC)

### 3.1 Platform Event: `Property_Verification_Event__e`
- Published when an officer approves a property parcel.
- Subscribed by external Node.js / React listener via CometD or WebSocket to update UI dashboards in real time.

### 3.2 Change Data Capture (CDC)
- Enabled on `Tax_Payment__c` to stream financial settlement transactions to municipal bank audit ledgers.
