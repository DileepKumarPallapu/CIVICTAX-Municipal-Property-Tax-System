# CivicTax 5.0: Property Verification & Field Survey Workflow

## 1. Field Inspection Operational Lifecycle

```
[ Active Inspection Docket ] ──> Inspector checks daily assigned properties in municipal zone
            │
            ▼
[ On-Site Field Survey ]     ──> Physical tape inspection of built-up dimensions
            │
            ▼
[ Photograph & Deed Match ]  ──> Documents matched against physical site characteristics
            │
            ▼
[ Decision Gate ]
  ├── Recommendation: APPROVE ──> Verification Status: 'VERIFIED'
  │                               (Unlocks property for annual tax billing generation)
  └── Recommendation: REJECT  ──> Verification Status: 'REJECTED'
                                  (Requires non-empty discrepancy reason; triggers citizen alert)
```

---

## 2. Verification Data Fields Captured
- `Inspection_Date__c`: Timestamp of physical on-site visit.
- `Measured_Built_Up_Area__c`: Physical surveyor measurement (sq ft).
- `Dimension_Variance_Percentage__c`: Automatic formula calculating deviation from declared area.
- `Field_Survey_Notes__c`: Descriptive qualitative assessment.
- `Assigned_Inspector__c`: Lookup to authenticated municipal officer.
