# CivicTax 6.0: Salesforce Object Field Mapping & Schema Specification

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Custom Objects Specification

### 1.1 `Property__c` (Municipal Property Registry)
| API Name | Field Label | Data Type | Requirements / Options |
|---|---|---|---|
| `Property_Number__c` | Property Number | Text(50) | Unique, External ID, Mandatory |
| `Owner__c` | Citizen Owner | Lookup(Contact) | Relationship: `Properties_Owned` |
| `Property_Address__c` | Property Address | Text(255) | Mandatory |
| `Zone__c` | Municipal Zone | Text(50) | e.g. Zone 01, Zone 02 |
| `Property_Category__c` | Property Category | Picklist | Residential, Commercial, Industrial, Agricultural |
| `Built_Up_Area__c` | Built-Up Area | Number(12, 2) | Square feet (> 0) |
| `Land_Area__c` | Land Area | Number(12, 2) | Plot dimension in sq.ft |
| `Verification_Status__c` | Verification Status | Picklist | Pending, In Progress, Verified, Resubmission Required, Rejected |
| `Registration_Status__c` | Registration Status | Picklist | Draft, Submitted, Under Verification, Verified, Active, Rejected |

### 1.2 `Tax_Assessment__c` (Annual Statutory Assessment)
| API Name | Field Label | Data Type | Requirements / Options |
|---|---|---|---|
| `Assessment_Number__c` | Assessment Number | Text(50) | Unique, External ID |
| `Property__c` | Property | Master-Detail(`Property__c`) | Cascade on delete |
| `Assessment_Year__c` | Assessment Year | Text(20) | Format: `YYYY-YYYY` (e.g. `2026-2027`) |
| `Base_Tax__c` | Base Tax | Currency(18, 2) | Unit Area Value baseline |
| `Penalty__c` | Penalty | Currency(18, 2) | Overdue surcharge |
| `Discount__c` | Discount / Rebate | Currency(18, 2) | Early payment discount |
| `Total_Tax__c` | Total Tax | Currency(18, 2) | Final payable amount |
| `Due_Date__c` | Due Date | Date | Statutory payment cut-off |
| `Assessment_Status__c` | Assessment Status | Picklist | Draft, Pending Approval, Approved, Partially Paid, Paid, Overdue |

### 1.3 `Tax_Payment__c` (Financial Transaction Ledger)
| API Name | Field Label | Data Type | Requirements / Options |
|---|---|---|---|
| `Payment_Reference__c` | Payment Reference | Text(50) | Unique, External ID |
| `Assessment__c` | Assessment | Master-Detail(`Tax_Assessment__c`) | Rollup enabled |
| `Amount__c` | Amount | Currency(18, 2) | Strictly > 0 |
| `Payment_Date__c` | Payment Date | Date/Time | UTC transaction timestamp |
| `Payment_Method__c` | Payment Method | Picklist | UPI, NetBanking, Credit Card, Debit Card, Challan |
| `Transaction_Status__c` | Transaction Status | Picklist | Initiated, Success, Failed, Refunded |
| `Gateway_Reference__c` | Gateway Reference | Text(100) | Bank UTR / Razorpay payment ID |

### 1.4 `Reassessment_Request__c` (Valuation Revision Docket)
| API Name | Field Label | Data Type | Requirements / Options |
|---|---|---|---|
| `Request_Number__c` | Request Number | Text(50) | Unique, External ID |
| `Property__c` | Property | Lookup(`Property__c`) | Target property |
| `Original_Assessment__c` | Original Assessment | Lookup(`Tax_Assessment__c`) | Baseline assessment |
| `Requested_Change__c` | Requested Change | LongTextArea(32768) | Proposed dimension/category delta |
| `Supporting_Reason__c` | Supporting Reason | Text(255) | Statutory justification |
| `Approval_Status__c` | Approval Status | Picklist | Submitted, Under Review, Recommended, Approved, Rejected |
| `Decision_Comments__c` | Decision Comments | LongTextArea(32768) | Approver remarks & audit notes |

---

## 2. Standard Object Roles in CivicTax

- **`Contact`**: Represents individual citizens/property owners with national identifiers, email, and phone.
- **`User`**: Represents municipal employees (Verification Officers, Revenue Inspectors, Commissioners).
- **`Case`**: Represents citizen grievances, assessment disputes, and billing queries.
- **`Task`**: Represents assigned operational duties (Field surveys, manual review dockets).
- **`ContentDocument` / `ContentVersion`**: Represents encrypted digital title deeds, building plans, and survey photos.
