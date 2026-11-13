# CIVICTAX Database Schema & Relational Specifications

## 1. Relational Integrity & Schema Design

CivicTax prevents cascading loss of financial history by enforcing strict relational constraints:
- **Property to Assessment**: Lookup with Restrict Delete. A property with issued tax bills cannot be deleted.
- **Assessment to Payment**: Master-Detail in Salesforce / Restrict in SQL. Deleting payment receipts is strictly prohibited.
- **Ownership Preservation**: Property ownership transfers append immutable rows to `Property_Ownership_History__c` rather than overwriting prior deeds.

---

## 2. Table & Object Dictionary

### Table: `properties` (`Property__c`)
| Column Name | SQL Type | Salesforce Field | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | `Id` | PRIMARY KEY | Unique record identifier |
| `property_number` | VARCHAR(50) | `Property_Number__c` | UNIQUE, NOT NULL | Municipal property registration code |
| `owner_id` | VARCHAR(36) | `Property_Owner__c` | FOREIGN KEY (users) | Owner citizen identifier |
| `owner_name` | VARCHAR(100) | Formula / Text | NOT NULL | Citizen full legal name |
| `address` | TEXT | `Property_Address__c` | NOT NULL | Physical site address |
| `category` | VARCHAR(20) | `Property_Category__c` | NOT NULL | `RESIDENTIAL`, `COMMERCIAL`, `INDUSTRIAL` |
| `built_up_area` | NUMERIC(10,2) | `Built_Up_Area__c` | CHECK (area > 0) | Built-up area in square feet |
| `zone_id` | VARCHAR(20) | `Zone__c` | FOREIGN KEY (zones) | Municipal administrative zone code |
| `verification_status`| VARCHAR(25) | `Verification_Status__c` | NOT NULL | `PENDING`, `VERIFIED`, `REJECTED` |
| `document_reference` | VARCHAR(100) | `Ownership_Document__c` | NOT NULL | Sub-registrar deed Index-II reference |
| `latitude` | NUMERIC(10,6) | `Latitude__c` | NULLABLE | WGS84 GPS latitude coordinate |
| `longitude` | NUMERIC(10,6) | `Longitude__c` | NULLABLE | WGS84 GPS longitude coordinate |
| `created_at` | TIMESTAMP | `CreatedDate` | DEFAULT NOW() | Record creation timestamp |

---

### Table: `tax_assessments` (`Tax_Assessment__c`)
| Column Name | SQL Type | Salesforce Field | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | `Id` | PRIMARY KEY | Unique assessment identifier |
| `assessment_number` | VARCHAR(50) | `Assessment_Number__c` | UNIQUE, NOT NULL | Assessment bill reference |
| `property_id` | VARCHAR(36) | `Property__c` | FOREIGN KEY (properties) | Target municipal parcel |
| `assessment_year` | VARCHAR(20) | `Assessment_Year__c` | NOT NULL | Fiscal year (e.g. 2024-2025) |
| `base_tax` | NUMERIC(14,2) | `Base_Value__c` | CHECK (>= 0) | Area multiplied by gazetted rate |
| `penalty` | NUMERIC(14,2) | `Penalty_Amount__c` | CHECK (>= 0) | Late settlement surcharge |
| `discount` | NUMERIC(14,2) | `Discount_Amount__c` | CHECK (>= 0) | Early bird incentive rebate |
| `total_tax` | NUMERIC(14,2) | `Total_Amount__c` | CHECK (>= 0) | Final assessed demand payable |
| `amount_paid` | NUMERIC(14,2) | `Amount_Paid__c` | DEFAULT 0 | Cumulative sum of payments |
| `outstanding_balance`| NUMERIC(14,2) | `Outstanding_Amount__c` | CHECK (>= 0) | Remaining unpaid tax demand |
| `status` | VARCHAR(25) | `Assessment_Status__c` | NOT NULL | `APPROVED`, `PARTIALLY_PAID`, `PAID` |
| `due_date` | DATE | `Due_Date__c` | NOT NULL | Statutory deadline for settlement |

---

### Table: `tax_payments` (`Tax_Payment__c`)
| Column Name | SQL Type | Salesforce Field | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | `Id` | PRIMARY KEY | Unique payment receipt identifier |
| `assessment_id` | VARCHAR(36) | `Assessment__c` | FOREIGN KEY (assessments) | Target assessment bill |
| `amount_paid` | NUMERIC(14,2) | `Amount_Paid__c` | CHECK (> 0) | Amount settled in transaction |
| `payment_date` | TIMESTAMP | `Payment_Date__c` | NOT NULL | Timestamp of settlement |
| `payment_method` | VARCHAR(20) | `Payment_Method__c` | NOT NULL | `UPI`, `NET_BANKING`, `CARD` |
| `transaction_id` | VARCHAR(100) | `Transaction_ID__c` | UNIQUE, NOT NULL | Bank or gateway transaction reference |
| `payment_status` | VARCHAR(20) | `Payment_Status__c` | NOT NULL | `SUCCESS`, `FAILED`, `PENDING` |
