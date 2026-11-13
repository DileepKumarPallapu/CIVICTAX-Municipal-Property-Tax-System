# CivicTax Page Layouts & Record Types Architecture

## 1. Record Types (`Property__c`)

`Property__c` features three distinct Record Types tailoring picklist values, required fields, and page layout assignments:

| Record Type | Description | Key Attributes / Picklists | Applicable Layout |
| :--- | :--- | :--- | :--- |
| **`Residential`** | Citizen residential dwellings, apartments, villas | Property Type: Individual House, Flat, Villa. Eligible for early-bird residential rebates. | Citizen / Officer Property Layout |
| **`Commercial`** | Retail shops, corporate offices, malls | Property Type: Retail, Office, Multiplex, Hotel. Higher base rate per sq ft; fire NOC required. | Commercial Property Layout |
| **`Industrial`** | Factories, warehouses, manufacturing units | Property Type: Manufacturing, Warehouse, Processing. Environmental clearance doc required. | Industrial Property Layout |

---

## 2. Page Layout Specifications

### 2.1 Citizen Property Layout
- **Visible Sections**: Property Overview (Read-Only Status, Property Number), Property Dimensions, Registered Address, Active Assessments Related List, Payment History Related List.
- **Hidden / Restricted**: Internal officer risk scores, field survey notes, inspector re-assignment history.

### 2.2 Officer Verification Layout
- **Visible Sections**: Citizen Declaration, Uploaded Ownership Deed Preview, Field Survey Inspection Checklist, Verification Decision Actions (`Approve & Certify`, `Reject with Notes`).
- **Related Lists**: Previous verification attempts, inspection logs, grievance history.

### 2.3 Tax Assessment & Payment Layouts
- **Assessment Layout**: Assessment Header, Tax Computation Formula Breakdown (Base Tax, Penalty, Rebate, Outstanding Balance), Payment Transactions Related List.
- **Payment Layout**: Transaction ID, Amount Paid, Payment Date, Payment Method (UPI, Net Banking, Card, POS), Parent Assessment link.
