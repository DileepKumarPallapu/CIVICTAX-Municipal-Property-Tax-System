# CIVICTAX Citizen Service Center Catalog

## 1. Unified Municipal Services Directory

The Citizen Service Center organizes municipal services into distinct civic categories:

| Service Category | Service Name | Required Documents | Eligibility Criteria | Action Path |
| :--- | :--- | :--- | :--- | :--- |
| **Property** | New Parcel Registration | Sub-Registrar Index-II Deed, Sanctioned Plan | Any registered citizen property owner | `/citizen/register-property` |
| **Property** | Property Details Inspection | Property Number | Registered owner of parcel | `/citizen/properties` |
| **Tax** | Annual Tax Assessment Bill | Property Number | Property must be in `VERIFIED` status | `/citizen/assessments` |
| **Payments** | Property Tax Settlement | Assessment Number | Unpaid balance $>0$ | `/citizen/payments` |
| **Documents** | Digital Tax Clearance Receipt | Transaction ID | Successful tax payment settled | `/citizen/payments` |
| **Certificates** | Tax Clearance Certificate | Property ID | All assessments fully `PAID` | `/citizen/profile` |
| **Appointments**| Ward Office Appointment | Citizen ID | Valid municipal query | `/citizen/profile` |
| **Grievances** | Municipal Service Grievance | Property ID, Narrative | Open to all registered citizens | `/citizen/grievances` |
| **Corrections** | Property Correction Request | Survey Drawing / Proof | Registered parcel owner | `/citizen/properties` |
| **Disputes** | Tax Reassessment Appeal | Disputed Assessment Bill | Active assessment with balance due | `/citizen/reassessments` |
