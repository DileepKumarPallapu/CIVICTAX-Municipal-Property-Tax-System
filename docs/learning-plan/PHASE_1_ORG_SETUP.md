# Topic 1: Org Setup & Company Settings Specification

## 1. Curriculum Objective & Municipal Alignment
Demonstrates core Salesforce Company Settings tailored to a municipal governance entity:
- **Company Information**: Greater Chennai Municipal Corporation (GCC) CivicTax Platform.
- **Fiscal Year**: April 1 to March 31 (Indian Municipal Standard).
- **Business Hours & Holidays**: 09:00 to 18:00 IST, Monday to Friday; official Tamil Nadu / Indian statutory municipal holidays.
- **Language & Locale**: English & Tamil (`ta_IN`), Locale: `en_IN`.
- **Currency**: Indian Rupee (`INR` - ₹) with 2-decimal formatting.
- **Themes & Branding**: Institutional Midnight Navy (`#101D32`) and Royal Indigo (`#405CF5`).
- **Lightning App Builder & Navigation**: CivicTax Lightning App with custom tabs for Properties, Assessments, Payments, Grievances, and Command Center.

---

## 2. Implementation & Setup Reference

```
Setup > Company Settings > Company Information
├── Organization Name: Greater Chennai Corporation - CivicTax
├── Default Fiscal Year: Starts April (Standard Fiscal Year)
├── Currency: INR - Indian Rupee (₹)
├── Default Language: English
└── Default Time Zone: (GMT+05:30) India Standard Time (Asia/Kolkata)

Setup > Apps > App Manager > CivicTax Lightning App
├── App Name: CivicTax Administration Portal
├── Navigation Items: 
│   ├── Home (Command Center Dashboard)
│   ├── Property__c (Properties)
│   ├── Tax_Assessment__c (Assessments)
│   ├── Tax_Payment__c (Payment Receipts)
│   ├── Case (Citizen Grievances)
│   └── Reports & Dashboards
```

---

## 3. Status & Evidence

- **Status**: Implemented Locally / Staged in DX Metadata (`salesforce/force-app/main/default/`).
- **Evidence Reference**: App definition and tab metadata staged under `force-app/main/default/applications/` and `tabs/`.
