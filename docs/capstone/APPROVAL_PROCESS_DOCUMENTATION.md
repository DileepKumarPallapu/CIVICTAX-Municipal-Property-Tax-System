# CivicTax Multi-Step Approval Processes Documentation

## 1. Governance Approval Framework

Certain municipal transactions require formal statutory approvals before taking effect. CivicTax implements native Salesforce Multi-Step Approval Processes.

---

## 2. Implemented Approval Processes

### 2.1 Property Verification Approval Process (`Property_Verification_Approval`)
- **Target Object**: `Property__c`
- **Entry Criteria**: `Verification_Status__c = 'PENDING'` AND `Built_Up_Area__c > 0`.
- **Initial Submission Actions**:
  - Sets `Verification_Status__c = 'UNDER_REVIEW'`.
  - Record Lock: Prevents citizen from editing dimensions while under review.
- **Approver Assignment**: Zonal Assistant Revenue Officer based on `Municipal_Zone__c`.
- **Approval Actions**:
  - Updates `Verification_Status__c = 'VERIFIED'`.
  - Unlocks record for tax billing generation.
- **Rejection Actions**:
  - Sets `Verification_Status__c = 'REJECTED'`.
  - Records mandatory officer rejection comment.
  - Unlocks record for citizen correction and resubmission.

---

### 2.2 Reassessment Request Approval Process (`Reassessment_Approval_Process`)
- **Target Object**: `Reassessment_Request__c`
- **Entry Criteria**: `Approval_Status__c = 'SUBMITTED'`.
- **Step 1 (Technical Verification)**:
  - Approver: Municipal Assistant Engineer.
  - Criteria: Validates surveyor report and architectural blueprint.
  - Approved $\to$ Advances to Step 2; Rejected $\to$ Final Rejection.
- **Step 2 (Financial Sanction)**:
  - Approver: Zonal Revenue Officer / Executive Engineer.
  - Criteria: Required if requested tax liability adjustment exceeds $10\%$ deviation.
- **Final Approval Actions**:
  - Sets `Approval_Status__c = 'APPROVED'`.
  - Triggers automated re-computation of parent `Tax_Assessment__c`.
  - Issues updated assessment demand statement.
