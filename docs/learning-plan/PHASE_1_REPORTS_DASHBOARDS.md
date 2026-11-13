# Topic 9: Advanced Reports, Dashboards & Analytics

## 1. Native Salesforce Report Types & Reports

CivicTax configures four core Salesforce report formats:

| Report Format | Report Name | Data Source | Grouping & Metrics |
| :--- | :--- | :--- | :--- |
| **Tabular** | Daily Registered Properties List | `Property__c` | Simple tabular list with owner contact and registration date. |
| **Summary** | Zonal Revenue Collection Report | `Tax_Payment__c` with `Property__c` | Grouped by `Municipal_Zone__c.Name`; SUM of `Amount_Paid__c`. |
| **Matrix** | Assessment Performance by Zone & Category | `Tax_Assessment__c` | Rows: `Municipal_Zone__c`; Columns: `Property_Category__c`; Metric: Total Amount. |
| **Joined** | Tax Revenue vs Citizen Grievances | Block 1: `Tax_Payment__c`; Block 2: `Case` | Joined across common `Municipal_Zone__c` dimension. |

---

## 2. Advanced Filtering & Bucketing

- **Overdue Arrears Bucketing**: Bucketed into `Not Due`, `1-30 Days`, `31-60 Days`, `61-90 Days`, `>90 Days`.
- **Cross-Filters**: *Properties with Tax_Assessments* where `Status__c = 'OVERDUE'`.
- **Summary Formulas**: Collection Rate ($\%$) = `(SUM(Tax_Payment__c.Amount_Paid__c) / SUM(Tax_Assessment__c.Total_Amount__c)) * 100`.

---

## 3. CivicTax Executive Dashboard
- Visualizes key performance indicators (KPIs) through gauge, donut, and stacked column components.
- Interactive Dashboard Filters: Filter entire dashboard by **Municipal Zone** or **Fiscal Year**.
