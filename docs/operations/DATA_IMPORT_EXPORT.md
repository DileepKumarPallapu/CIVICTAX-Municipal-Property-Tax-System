# CivicTax Data Import and Export Specification

## 1. Overview & Scope

CivicTax features high-throughput, validated CSV workflows allowing municipal staff to import and export properties, tax rate matrices, zones, and revenue recovery records.

---

## 2. CSV Formula Injection Defense (CSV Injection / Formula Injection)

> [!WARNING]
> Spreadsheets (Excel, Google Sheets, LibreOffice) execute formulas prefixed with `=`, `+`, `-`, `@`, `\t`, or `\r`. Unsanitized exports can trigger formula injection attacks.

### Prevention Protocol
1. **Sanitization on Export**:
   - Any string value starting with `=`, `+`, `-`, `@`, `\t`, or `\r` is automatically prepended with a single quote (`'`) to force the spreadsheet to interpret the cell as literal text.
2. **Import Parsing Protection**:
   - All cell values are trimmed and type-checked against strict regex schemas.
   - Cells containing shell escape characters or executable commands are stripped or rejected.

---

## 3. CSV Import Workflow

```
[ SELECT CSV FILE ]
        |
        v
[ PREVIEW & COLUMN MAPPING ] ---> Map CSV headers to CivicTax entity fields
        |
        v
[ VALIDATION & INTEGRITY CHECK ]
  - Mandatory fields check
  - Type & range verification (e.g. built-up area > 0)
  - Duplicate check against existing database
        |
        +---- Errors Detected? ----> [ DOWNLOAD ERROR REPORT ]
        |
        v No Fatal Errors
[ CONFIRMATION & BULK INGESTION ]
        |
        v
[ IMPORT SUMMARY REPORT ]
```

---

## 4. Supported Data Entities

1. **Properties**: Property Number, Owner Name, Address, Category, Zone, Built-up Area, Registration Date.
2. **Tax Rates**: Category, Rate per SqFt, Effective Start Date, Effective End Date, Active Flag.
3. **Zones**: Zone Code, Zone Name, Ward Count, Contact Email.
4. **Recovery Cases**: Case Number, Property ID, Outstanding Balance, Aging Bucket, Assigned Officer.
