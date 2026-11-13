# CiviAssist Rule-Based Civic Assistant Guide

## 1. Assistant Architecture

`CiviAssist.tsx` provides an interactive floating civic assistant accessible across all CivicTax pages:

```mermaid
flowchart TD
    User["Citizen Enters Query / Clicks Topic"] --> Engine{"CiviAssist Knowledge Engine"}
    Engine --> Topic1["Property Registration Guidance"]
    Engine --> Topic2["Tax Formula & Gazette Rates"]
    Engine --> Topic3["Payment & Receipt Downloading"]
    Engine --> Topic4["Grievances & Reassessments"]
    Engine --> Topic5["Municipal Ward Office Contacts"]
    Topic1 & Topic2 & Topic3 & Topic4 & Topic5 --> Response["Contextual Guidance & Deep-Links"]
```

---

## 2. Integrity & Fact-Checking Rule
- **Rule-Based Truth**: CiviAssist operates as a deterministic, rule-based demonstration assistant. It answers questions using active municipal records without hallucinating tax balances or rates.
- **Deep Navigation**: Directly renders deep links to relevant forms (e.g. *"Click here to open the Payment Portal"*).
