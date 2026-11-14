# CivicTax 6.0: Salesforce DX Deployment Guide & Release Runbook

**Project**: CIVICTAX — Property Tax Assessment and Payment Management System  
**Assigned Use Case**: `USECASE_6` | **Team**: `TEAM_16`  
**Student**: Pallapu Dileep Kumar (**VTU**: `29962`) | **Department**: Computer Science and Engineering  

---

## 1. Salesforce DX Project Architecture

The Salesforce metadata is structured under `salesforce/` conforming to SFDX source format:

```
salesforce/
├── sfdx-project.json
└── force-app/main/default/
    ├── approvalProcesses/
    ├── classes/
    │   ├── CivicTaxPropertyService.cls
    │   ├── CivicTaxAssessmentService.cls
    │   ├── CivicTaxPaymentService.cls
    │   ├── CivicTaxGrievanceService.cls
    │   ├── CivicTaxReassessmentService.cls
    │   ├── CivicTaxDashboardService.cls
    │   ├── CivicTaxSecurityService.cls
    │   ├── CivicTaxIntegrationService.cls
    │   ├── CivicTaxRecursionControl.cls
    │   ├── CivicTaxSuiteTest.cls
    │   └── ...
    ├── flows/
    │   ├── Property_Registration_Flow.flow-meta.xml
    │   └── Payment_Notification_Flow.flow-meta.xml
    ├── objects/
    │   ├── Property__c/
    │   ├── Tax_Assessment__c/
    │   ├── Tax_Payment__c/
    │   ├── Reassessment_Request__c/
    │   └── Grievance__c/
    ├── permissionsets/
    │   ├── CivicTax_Admin.permissionset-meta.xml
    │   ├── CivicTax_Citizen.permissionset-meta.xml
    │   ├── CivicTax_Officer.permissionset-meta.xml
    │   ├── CivicTax_Verification.permissionset-meta.xml
    │   ├── CivicTax_Assessment.permissionset-meta.xml
    │   ├── CivicTax_Revenue.permissionset-meta.xml
    │   ├── CivicTax_Grievance.permissionset-meta.xml
    │   ├── CivicTax_Reassessment.permissionset-meta.xml
    │   └── CivicTax_Auditor.permissionset-meta.xml
    ├── triggers/
    │   ├── PropertyTrigger.trigger
    │   ├── TaxPaymentTrigger.trigger
    │   └── TaxAssessmentTrigger.trigger
    ├── reports/
    └── dashboards/
```

---

## 2. Strict Dependency Deployment Order

Metadata components must be deployed in the following deterministic sequence to satisfy Salesforce compilation constraints:

```
Step 1: Custom Objects & Fields
        (Property__c, Tax_Assessment__c, Tax_Payment__c, Reassessment_Request__c, Grievance__c)
                       │
                       ▼
Step 2: Base Utility & Service Apex Classes
        (CivicTaxRecursionControl, CivicTaxTestDataFactory, CivicTaxPropertyService, etc.)
                       │
                       ▼
Step 3: Apex Triggers & Handler Classes
        (PropertyTrigger, TaxPaymentTrigger, TaxAssessmentTrigger)
                       │
                       ▼
Step 4: Permission Sets & Security Policies
        (CivicTax_Admin, CivicTax_Citizen, Department Permission Sets)
                       │
                       ▼
Step 5: Declarative Automation (Flows & Approval Processes)
        (Property_Registration_Flow, Payment_Notification_Flow)
                       │
                       ▼
Step 6: Reports & Dashboards
```

---

## 3. Step-by-Step Deployment Commands

### A. Authenticate Your Trailhead Playground
```bash
cd salesforce
sf org login web --alias CivicTaxPlayground --set-default
```

### B. Validate Metadata (Check-Only Run)
```bash
sf project deploy validate --target-org CivicTaxPlayground --test-level RunLocalTests
```

### C. Execute Live Deployment
```bash
sf project deploy start --target-org CivicTaxPlayground --test-level RunLocalTests
```

### D. Verify Deployment Status
```bash
sf project deploy report
```
