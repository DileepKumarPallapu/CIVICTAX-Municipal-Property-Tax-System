export interface TraceabilityItem {
  id: string;
  category: 'MILESTONE_1_ADMIN' | 'MILESTONE_2_DEV';
  requirement: string;
  concept: string;
  implementation: string;
  targetArtifact: string;
  metadataPath: string;
  testMethod: string;
  status: 'Documented' | 'Implemented Locally' | 'Deployed' | 'Verified';
  vivaNote: string;
}

export const TRACEABILITY_MATRIX: TraceabilityItem[] = [
  {
    id: 'REQ-01',
    category: 'MILESTONE_1_ADMIN',
    requirement: 'Standard & Custom Objects Architecture',
    concept: 'Custom Objects & Schema Design',
    implementation: 'Property__c, Tax_Assessment__c, Tax_Payment__c, Grievance__c, Reassessment_Request__c',
    targetArtifact: 'Property__c.object-meta.xml, Tax_Assessment__c.object-meta.xml',
    metadataPath: 'salesforce/force-app/main/default/objects/*',
    testMethod: 'PropertyServiceTest.testRegisterPropertySuccess',
    status: 'Implemented Locally',
    vivaNote: 'Demonstrates modular schema isolation preventing cascading financial loss.',
  },
  {
    id: 'REQ-02',
    category: 'MILESTONE_1_ADMIN',
    requirement: 'Data Integrity Validation Rules',
    concept: 'Validation Rules & Error Formulas',
    implementation: 'Built-up area > 0, construction year <= current year, non-negative tax amounts',
    targetArtifact: 'Built_Up_Area_Must_Be_Positive.validationRule-meta.xml',
    metadataPath: 'salesforce/force-app/main/default/objects/Property__c/validationRules/*',
    testMethod: 'Negative DML execution test',
    status: 'Implemented Locally',
    vivaNote: 'Enforced at platform level before any database commit takes place.',
  },
  {
    id: 'REQ-03',
    category: 'MILESTONE_1_ADMIN',
    requirement: 'Role-Based Permissions & Security',
    concept: 'Permission Sets & Object/Field Security',
    implementation: 'CivicTax_Officer, CivicTax_Admin, CivicTax_Citizen with strict FLS',
    targetArtifact: 'CivicTax_Officer.permissionset-meta.xml',
    metadataPath: 'salesforce/force-app/main/default/permissionsets/*',
    testMethod: 'System.runAs() execution in Apex tests',
    status: 'Implemented Locally',
    vivaNote: 'Guarantees citizens cannot view other citizens property or tax records.',
  },
  {
    id: 'REQ-04',
    category: 'MILESTONE_2_DEV',
    requirement: 'Authoritative Apex Business Logic',
    concept: 'Apex Service Layer & Decimal Math',
    implementation: 'TaxCalculationService, PropertyService, PaymentService',
    targetArtifact: 'TaxCalculationService.cls, PaymentService.cls',
    metadataPath: 'salesforce/force-app/main/default/classes/*',
    testMethod: 'PropertyServiceTest.testTaxCalculationLogic',
    status: 'Implemented Locally',
    vivaNote: 'Financial amounts are calculated in Apex, never trusted from frontend input.',
  },
  {
    id: 'REQ-05',
    category: 'MILESTONE_2_DEV',
    requirement: 'Database Triggers & Order of Execution',
    concept: 'One-Trigger-Per-Object & Bulk Handlers',
    implementation: 'PropertyTrigger.trigger, TaxPaymentTrigger.trigger',
    targetArtifact: 'PropertyTrigger.trigger, TaxPaymentTrigger.trigger',
    metadataPath: 'salesforce/force-app/main/default/triggers/*',
    testMethod: 'TaxPaymentTrigger bulk execution test',
    status: 'Implemented Locally',
    vivaNote: 'Demonstrates after-insert payment rollup into parent assessment balance.',
  },
  {
    id: 'REQ-06',
    category: 'MILESTONE_2_DEV',
    requirement: 'Asynchronous Apex (Queueable & Batch)',
    concept: 'Asynchronous Processing & Stateful Batch',
    implementation: 'NotificationQueueable, OverdueAssessmentBatch, OverdueAssessmentScheduler',
    targetArtifact: 'CivicTaxAsyncJobs.cls',
    metadataPath: 'salesforce/force-app/main/default/classes/CivicTaxAsyncJobs.cls',
    testMethod: 'Test.startTest() / Test.stopTest() async execution',
    status: 'Implemented Locally',
    vivaNote: 'Separates synchronous user transactions from large overdue batch evaluations.',
  },
  {
    id: 'REQ-07',
    category: 'MILESTONE_2_DEV',
    requirement: 'SOQL Aggregations & SOSL Search',
    concept: 'Relational SOQL & Multi-Object SOSL',
    implementation: 'CivicTaxSearchService with AggregateResult and SOSL FIND queries',
    targetArtifact: 'CivicTaxSearchService.cls',
    metadataPath: 'salesforce/force-app/main/default/classes/CivicTaxSearchService.cls',
    testMethod: 'Search execution unit assertions',
    status: 'Implemented Locally',
    vivaNote: 'Enforces selective indexing and zero SOQL in loops.',
  },
  {
    id: 'REQ-08',
    category: 'MILESTONE_2_DEV',
    requirement: 'Lightning Web Components (LWC)',
    concept: 'Modern Web Component Standards on Platform',
    implementation: 'civicTaxDashboard, propertyRegistration components',
    targetArtifact: 'civicTaxDashboard.html, civicTaxDashboard.js',
    metadataPath: 'salesforce/force-app/main/default/lwc/*',
    testMethod: 'LWC Jest & UI rendering validation',
    status: 'Implemented Locally',
    vivaNote: 'Illustrates native Salesforce UI execution alongside the external React portal.',
  },
];
