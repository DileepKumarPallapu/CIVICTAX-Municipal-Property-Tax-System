# Topic 8: Data Management, Import/Export & Deduplication

## 1. Curriculum Objectives & Tools Demonstrated
- **Data Import Wizard**: Standard UI tool used for non-technical administrator imports of `Property_Zone__c` and `Tax_Rate__c` masters ($< 50,000$ records).
- **Data Loader**: Command-line and GUI batch operations for large-scale cadastral parcel ingestion ($500,000+$ records) with error and success CSV log mapping.
- **Export Data Service**: Weekly automated backup schedule of property tax registers.

---

## 2. Duplicate Management & Matching Rules

### 2.1 Duplicate Rule: `Duplicate_Property_Reference_Prevention`
- **Target Object**: `Property__c`
- **Matching Rule**: Exact match on `Property_Number__c` OR Fuzzy match on (`Door_Number__c` AND `Municipal_Zone__c`).
- **Action**: Alert on Edit; Block on Insert.

### 2.2 Payment Deduplication Guard
- **Target Object**: `Tax_Payment__c`
- **Constraint**: External ID unique constraint on `Transaction_ID__c`.
- **Behavior**: Database rejects concurrent duplicate webhook submissions.

---

## 3. CSV Import/Export & Formula Injection Defense
- **Formula Injection Defense**: Cells starting with `=`, `+`, `-`, `@` are automatically prepended with `'` on export to prevent spreadsheet command execution.
- **Preview & Error Validation**: Column-header mapping and row-level validation reports prior to database ingestion.
