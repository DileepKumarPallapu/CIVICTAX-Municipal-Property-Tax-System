# CivicTax Salesforce Flow Builder Documentation

## 1. Declarative Automation Overview

CivicTax utilizes Salesforce Record-Triggered and Schedule-Triggered Flows to orchestrate business events without custom trigger overhead for standard communications.

---

## 2. Flow Specifications

### 2.1 `Property_Registration_Flow`
- **Trigger**: Record-Triggered (After Insert on `Property__c`).
- **Entry Conditions**: None (fires on all new property registrations).
- **Decisions**: Checks if `Verification_Status__c = 'PENDING'`.
- **Actions**:
  1. Creates an automated in-app notification for the citizen.
  2. Creates a task for the Zonal Officer: *"Conduct physical field inspection for parcel {!$Record.Property_Number__c}"*.

### 2.2 `Assessment_Notification_Flow`
- **Trigger**: Record-Triggered (After Insert/Update on `Tax_Assessment__c`).
- **Entry Conditions**: `Status__c` changed to `FINALIZED`.
- **Actions**:
  1. Sends email notification to property owner (`Contact.Email`) with assessment breakdown and early-bird discount eligibility.
  2. Generates citizen portal alert.

### 2.3 `Payment_Confirmation_Flow`
- **Trigger**: Record-Triggered (After Insert on `Tax_Payment__c`).
- **Entry Conditions**: `Payment_Status__c = 'SUCCESS'`.
- **Actions**:
  1. Triggers asynchronous receipt PDF generation.
  2. Dispatches SMS/Email confirmation containing payment transaction UTR and digital receipt link.

### 2.4 `Grievance_Assignment_Flow`
- **Trigger**: Record-Triggered (After Insert on `Case`).
- **Entry Conditions**: `RecordType = 'Grievance'`.
- **Actions**:
  1. Evaluates `Property__c.Municipal_Zone__c`.
  2. Auto-assigns the Case to the corresponding Zonal Grievance Queue or Revenue Inspector.
