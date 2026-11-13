/**
 * SALESFORCE ADAPTER STUB
 * 
 * Architectural preparation for Future Phase Salesforce Integration:
 * Custom Objects Mapping:
 * - Property -> Property__c
 * - TaxAssessment -> Tax_Assessment__c
 * - Payment -> Tax_Payment__c
 * - Grievance -> Grievance__c
 * - ReassessmentRequest -> Reassessment_Request__c
 * - MunicipalZone -> Municipal_Zone__c
 * - TaxRate -> Tax_Rate_Setting__c
 * 
 * Apex REST Services:
 * - /services/apexrest/civictax/v1/properties
 * - /services/apexrest/civictax/v1/assessments
 * - /services/apexrest/civictax/v1/payments/process
 * - /services/apexrest/civictax/v1/grievances
 */

import { IPropertyService, IAssessmentService, IPaymentService } from '../interfaces';
import { Property, TaxAssessment, Payment } from '../../types';

export class SalesforcePropertyService implements Partial<IPropertyService> {
  private endpoint = import.meta.env.VITE_SF_API_ENDPOINT || 'https://your-domain.my.salesforce.com/services/apexrest/civictax/v1';

  async getProperties(): Promise<Property[]> {
    console.info(`[Salesforce Service Adapter] Ready for Apex REST call GET ${this.endpoint}/properties`);
    throw new Error('Salesforce integration is scheduled for Phase 2. Currently operating in Local Demo mode.');
  }
}

export class SalesforceAssessmentService implements Partial<IAssessmentService> {
  private endpoint = import.meta.env.VITE_SF_API_ENDPOINT || 'https://your-domain.my.salesforce.com/services/apexrest/civictax/v1';

  async getAssessments(): Promise<TaxAssessment[]> {
    console.info(`[Salesforce Service Adapter] Ready for Apex REST call GET ${this.endpoint}/assessments`);
    throw new Error('Salesforce integration is scheduled for Phase 2. Currently operating in Local Demo mode.');
  }
}

export class SalesforcePaymentService implements Partial<IPaymentService> {
  private endpoint = import.meta.env.VITE_SF_API_ENDPOINT || 'https://your-domain.my.salesforce.com/services/apexrest/civictax/v1';

  async processSimulatedPayment(): Promise<Payment> {
    console.info(`[Salesforce Service Adapter] Ready for Apex REST call POST ${this.endpoint}/payments/process`);
    throw new Error('Salesforce integration is scheduled for Phase 2. Currently operating in Local Demo mode.');
  }
}
