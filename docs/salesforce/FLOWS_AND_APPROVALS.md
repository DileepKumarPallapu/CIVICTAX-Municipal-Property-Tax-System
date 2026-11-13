# CivicTax Flows and Formal Approval Processes

## 1. Automated Salesforce Flows

CivicTax features declarative flows to automate routine municipal actions without requiring custom code overhead:

| Flow Name | Trigger Type | Execution Criteria | Action Taken |
| :--- | :--- | :--- | :--- |
| **`Property_Registration_Notification`** | Record-Triggered (After Insert) | `Property__c` created | Dispatches citizen acknowledgement SMS/Email with registration ID and assigned zone details. |
| **`Assessment_Due_Date_Reminder`** | Schedule-Triggered | Due Date within 15 days, Status is `FINALIZED` or `PARTIALLY_PAID` | Enqueues proactive notification reminder with early bird discount information. |
| **`Payment_Confirmation_Receipt`** | Record-Triggered (After Insert) | `Tax_Payment__c` created with `Payment_Status__c = 'SUCCESS'` | Issues digital receipt notification and updates parcel assessment status. |
| **`Grievance_Assignment_Routing`** | Record-Triggered (After Insert) | `Grievance__c` created | Auto-assigns the grievance to the Zonal Grievance Redressal Officer based on property zone. |

---

## 2. Multi-Step Municipal Approval Processes

### 2.1 Property Verification Approval Process
- **Entry Criteria**: `Verification_Status__c = 'PENDING'` AND `Built_Up_Area__c > 0`.
- **Approver**: Zonal Field Inspector / Revenue Officer.
- **Initial Submission Action**: Locks record; sets `Verification_Status__c = 'PENDING'`.
- **Approval Action**: Sets `Verification_Status__c = 'VERIFIED'`; unlocks record for tax assessment generation.
- **Rejection Action**: Sets `Verification_Status__c = 'REJECTED'`; captures mandatory inspector rejection comments.

### 2.2 Reassessment Request Approval Process
- **Entry Criteria**: Citizen-requested area or classification change.
- **Step 1 (Technical Verification)**: Assistant Engineer reviews architectural plan or survey doc.
- **Step 2 (Financial Approval)**: Executive Officer sanctions rate adjustment if deviation exceeds $10\%$.
- **Final Approval**: Triggers automatic re-computation of `Tax_Assessment__c` and issues revised demand bill.
