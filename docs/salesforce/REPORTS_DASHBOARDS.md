# CivicTax 6.0: Municipal Reports & Executive Lightning Dashboard

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Municipal Operational Reports Catalog

CivicTax configures eight official reports in the `CivicTax_Reports` folder:

| Report Name | Primary Object | Report Format | Groupings & Metrics | Purpose |
|---|---|---|---|---|
| **Property Registration Report** | `Property__c` | Summary | Grouped by `Zone__c`, `Property_Category__c` | Tracks new registrations across municipal wards. |
| **Property Verification Report** | `Property__c` | Matrix | `Verification_Status__c` vs `Zone__c` | Identifies surveyor inspection backlogs. |
| **Tax Assessment Report** | `Tax_Assessment__c` | Summary | Grouped by `Assessment_Year__c`, `Category__c` | Sum of `Total_Tax__c`, Base Tax, and Discounts. |
| **Revenue Collection Report** | `Tax_Payment__c` | Summary | Grouped by `Payment_Method__c`, Month | Sum of `Amount__c` collected across payment channels. |
| **Outstanding Dues Report** | `Tax_Assessment__c` | Tabular | Filter: `Outstanding_Amount__c > 0` | Delinquency list for recovery notices. |
| **Grievance Resolution Report** | `Grievance__c` | Summary | Grouped by `Priority__c`, `Status__c` | Measures dispute resolution timelines against SLA. |
| **Reassessment Docket Report** | `Reassessment_Request__c`| Summary | Grouped by `Approval_Status__c` | Audit of valuation modifications and appeals. |
| **Department Performance Report**| `Task` | Matrix | `Owner.Name` vs `Status` | Officer throughput and SLA compliance ratio. |

---

## 2. Municipal Executive Lightning Dashboard (`CivicTax_Executive_Dashboard`)

The executive dashboard renders 8 real-time visual analytics components:

1. **Revenue Collection Gauge**: Shows current collections against the municipal annual target (e.g. ₹4.2M / ₹5.0M).
2. **Collection Trends Line Chart**: Monthly revenue velocity comparing current FY against prior FY.
3. **Zone-Wise Assessment Bar Chart**: Distribution of assessed property taxes across Municipal Zones (North, South, Central).
4. **Property Registration Donut Chart**: Breakdown by Category (Residential: 65%, Commercial: 25%, Industrial: 10%).
5. **Grievance Health Metric**: Count of currently open grievances color-coded by SLA urgency (Red: Breached, Green: Compliant).
6. **Verification Backlog Metric**: Count of properties awaiting ground inspection.
7. **Payment Channels Funnel**: UPI (58%), NetBanking (24%), Cards (12%), Challan (6%).
8. **Recent High-Value Audit Table**: Live feed of the top 10 tax settlements recorded in the last 24 hours.
