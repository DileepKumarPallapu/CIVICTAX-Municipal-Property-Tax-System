# Topic 7: Activities, Chatter, Mobile & AppExchange Integration

## 1. Activities & Officer Scheduling
- **`Task`**: Field inspection follow-ups auto-created upon property registration: *"Conduct on-site dimensional verification for parcel CHN-ZN01-WD04-00104"*.
- **`Event`**: Municipal hearing appointments booked via citizen portal: *"In-person grievance hearing with Zonal Officer"*.
- **Activity Timeline**: Unified chronological interaction history on `Property__c` and `Case` record pages.

---

## 2. Chatter Collaboration & Salesforce Files
- **Chatter Groups**: Private collaboration groups: `Zone 1 Revenue Enforcement Team`, `Municipal Valuation Committee`.
- **Record Feeds & Mentions**: Officers can `@mention` engineers directly on a `Reassessment_Request__c` record.
- **Salesforce Files (`ContentDocument` / `ContentVersion`)**: Encrypted document vault for citizen title deeds, land surveys, and digital payment receipt PDFs.

---

## 3. Mobile Optimization & External Client App (AppExchange / OAuth)
- **Salesforce Mobile App**: Optimized Compact Layouts for `Property__c` enabling inspectors to verify parcels from mobile tablets in the field.
- **External Client App**: Configured for OAuth 2.0 PKCE to power the CivicTax React external citizen portal securely without secret leakage.
