# CivicTax Salesforce Reports & Executive Dashboards

## 1. Native Salesforce Report Types & Reports

CivicTax defines dedicated custom report types joining standard and custom municipal objects.

---

## 2. Implemented Reports Catalog

| Report Name | Base Object | Grouping / Aggregation | Chart Type |
| :--- | :--- | :--- | :--- |
| **`Annual_Tax_Collection_Report`** | `Tax_Payment__c` | Grouped by Calendar Month; Sum of `Amount_Paid__c` | Vertical Column Chart |
| **`Zonal_Revenue_Efficiency_Report`** | `Property__c` with `Tax_Assessment__c` | Grouped by `Municipal_Zone__c.Name`; Net Assessed vs Net Collected | Horizontal Stacked Bar |
| **`Delinquent_Arrears_Aging_Report`** | `Tax_Assessment__c` | Grouped by Overdue Aging Bucket (1-30d, 31-60d, >90d); Sum of Outstanding | Donut Chart |
| **`Property_Verification_Status_Report`**| `Property__c` | Grouped by `Verification_Status__c` (Pending, Verified, Rejected) | Pie Chart |
| **`Grievance_Redressal_SLA_Report`** | `Case` | Grouped by `Priority` and `Status`; Average Resolution Days | Bar Chart |

---

## 3. CivicTax Executive Dashboard Architecture

The native **CivicTax Executive Dashboard** aggregates the reports above into a high-visibility command center for Municipal Commissioners:
- **Component 1 (Top Left)**: Metric card displaying Total Fiscal Collections (₹).
- **Component 2 (Top Right)**: Metric card displaying City-Wide Collection Efficiency (%).
- **Component 3 (Middle Left)**: Zonal Revenue Distribution stacked bar chart.
- **Component 4 (Middle Right)**: Delinquency aging donut chart highlighting critical arrears cases.
- **Component 5 (Bottom)**: Pending Verification and Grievance turnaround table.
