# CivicTax 5.0: Property Registration Automated Pipeline

## 1. Complete Process Timeline (16 Stages)

```
[ Citizen Portal ]
  │  Stage 1: Citizen starts property registration
  │  Stage 2: System creates a draft (Draft ID generated, autosaved)
  │  Stage 3: Citizen enters owner identity information
  │  Stage 4: Citizen enters property dimensions (Plot area & Built-up area)
  │  Stage 5: Citizen selects property category (Res/Comm/Ind) and municipal zone
  │  Stage 6: Citizen uploads deed proof document reference
  ▼
[ Automated Validation Engine ]
  │  Stage 7: System validates mandatory fields and dimensional bounds
  │  Stage 8: Automated duplicate property checks execute (CMP-001)
  │  Stage 9: Citizen reviews and submits application (Unique reference generated: "PROP-*")
  ▼
[ Registration Queue & Initial Review ]
  │  Stage 10: Application enters the Registration Department Queue
  │  Stage 11: Registration Officer reviews deed documents & ownership evidence
  │  Stage 12: Decision: Request clerical corrections OR forward for physical survey
  ▼
[ Field Verification Docket ]
  │  Stage 13: Zonal Field Verification Officer receives an assigned task
  │  Stage 14: Officer records physical survey verification results & measurements
  ▼
[ Statutory Sanction ]
  │  Stage 15: Authorized Officer approves or rejects with mandatory audit notes
  │  Stage 16: Property becomes ACTIVE; automatically unlocked for annual tax billing
```

---

## 2. Invariant Rules & Duplicate Checks

1. **Duplicate Property Reference Guard (CMP-001)**: Rejects duplicate combinations of `Property_Number__c` and `Municipal_Zone__c`.
2. **Plot Bounds Guard**: Built-up area cannot exceed declared plot area.
3. **Audit History Invariance**: Every transition from `Draft` to `Active` logs the acting officer and timestamp in `Application_Audit__c`.
