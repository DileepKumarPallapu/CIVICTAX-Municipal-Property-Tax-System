import { ICivicTaxRepository } from './ICivicTaxRepository.js';
import {
  IProperty,
  ITaxAssessment,
  ITaxPayment,
  IGrievance,
  IReassessment,
  IDashboardMetrics,
} from './types.js';
import { SalesforceSessionData } from '../types/index.js';
import { SalesforceClient } from '../services/salesforceClient.js';

type SalesforceRecord = {
  [key: string]: any;
};

export class SalesforceRepository implements ICivicTaxRepository {
  constructor(private readonly session: SalesforceSessionData) {
    if (!session?.accessToken || !session?.instanceUrl) {
      throw new Error('A valid Salesforce session is required.');
    }
  }

  private async call(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    body?: unknown
  ): Promise<any> {
    return SalesforceClient.callApexRest(
      this.session,
      endpoint,
      method,
      body
    );
  }

  private unsupported(operation: string): never {
    throw new Error(
      `${operation} is not available in the current Salesforce Apex REST API.`
    );
  }

  private mapProperty(record: SalesforceRecord): IProperty {
    const category = String(
      record.Property_Category__c ?? 'RESIDENTIAL'
    ).toUpperCase();

    const validCategories = [
      'RESIDENTIAL',
      'COMMERCIAL',
      'INDUSTRIAL',
      'AGRICULTURAL',
    ];

    const verificationStatus = String(
      record.Verification_Status__c ?? 'PENDING'
    ).toUpperCase();

    const validStatuses = [
      'PENDING',
      'VERIFIED',
      'RESUBMISSION_REQUIRED',
      'REJECTED',
    ];

    return {
      id: record.Id,
      propertyNumber:
        record.Property_Number__c ?? record.Name ?? '',
      ownerId: record.OwnerId ?? record.Property_Owner__c ?? '',
      ownerName:
        record.Property_Owner__r?.Name ??
        record.Owner?.Name ??
        'Not available',
      address: record.Property_Address__c ?? '',
      category: validCategories.includes(category)
        ? category as IProperty['category']
        : 'RESIDENTIAL',
      builtUpArea: Number(record.Built_Up_Area__c ?? 0),
      zone: record.Zone__c ?? record.Municipal_Zone__c ?? '',
      verificationStatus: validStatuses.includes(verificationStatus)
        ? verificationStatus as IProperty['verificationStatus']
        : 'PENDING',
      documentReference: record.Ownership_Document__c ?? '',
      latitude:
        record.Latitude__c == null
          ? undefined
          : Number(record.Latitude__c),
      longitude:
        record.Longitude__c == null
          ? undefined
          : Number(record.Longitude__c),
      constructionYear:
        record.Construction_Year__c == null
          ? undefined
          : Number(record.Construction_Year__c),
      registrationDate: record.Registration_Date__c ?? '',
    };
  }

  private mapAssessment(
    record: SalesforceRecord,
    property?: IProperty
  ): ITaxAssessment {
    const baseTax = Number(
      record.Base_Tax__c ?? record.Base_Value__c ?? 0
    );

    const totalTax = Number(
      record.Total_Tax__c ??
      record.Total_Amount__c ??
      baseTax
    );

    const amountPaid = Number(record.Amount_Paid__c ?? 0);

    const outstandingBalance = Number(
      record.Outstanding_Amount__c ??
      Math.max(0, totalTax - amountPaid)
    );

    const rawStatus = String(
      record.Assessment_Status__c ?? 'DRAFT'
    ).toUpperCase();

    const validStatuses = [
      'DRAFT',
      'APPROVED',
      'PARTIALLY_PAID',
      'PAID',
      'OVERDUE',
    ];

    return {
      id: record.Id,
      assessmentNumber:
        record.Assessment_Number__c ??
        record.Name ??
        record.Id,
      propertyId: record.Property__c ?? '',
      assessmentYear: record.Assessment_Year__c ?? '',
      category: property?.category ?? '',
      builtUpArea: property?.builtUpArea ?? 0,
      appliedRatePerSqFt: Number(
        record.Applied_Rate_Per_Sq_Ft__c ?? 0
      ),
      baseTax,
      penalty: Number(record.Penalty__c ?? 0),
      discount: Number(record.Discount__c ?? 0),
      totalTax,
      amountPaid,
      outstandingBalance,
      status: validStatuses.includes(rawStatus)
        ? rawStatus as ITaxAssessment['status']
        : 'DRAFT',
      dueDate: record.Due_Date__c ?? '',
    };
  }

  private mapPayment(record: SalesforceRecord): ITaxPayment {
    return {
      id: record.Id,
      assessmentId: record.Assessment__c ?? '',
      amountPaid: Number(record.Amount_Paid__c ?? 0),
      paymentDate: record.Payment_Date__c ?? '',
      paymentMethod: record.Payment_Method__c ?? '',
      transactionId: record.Transaction_ID__c ?? '',
      paymentStatus:
        record.Payment_Status__c === 'SUCCESS' ||
        record.Payment_Status__c === 'FAILED'
          ? record.Payment_Status__c
          : 'PENDING',
      receiptNumber: record.Name ?? record.Id,
    };
  }

  // PROPERTIES

  public async listProperties(
    filter?: { category?: string; zone?: string; status?: string }
  ): Promise<IProperty[]> {
    const records = await this.call('properties');

    if (!Array.isArray(records)) {
      throw new Error('Unexpected Salesforce properties response.');
    }

    let properties = records.map((record) =>
      this.mapProperty(record)
    );

    if (filter?.category) {
      properties = properties.filter(
        (property) => property.category === filter.category
      );
    }

    if (filter?.zone) {
      properties = properties.filter(
        (property) => property.zone === filter.zone
      );
    }

    if (filter?.status) {
      properties = properties.filter(
        (property) =>
          property.verificationStatus === filter.status
      );
    }

    return properties;
  }

  public async getPropertyById(
    id: string
  ): Promise<IProperty | null> {
    try {
      const record = await this.call(
        `properties/${encodeURIComponent(id)}`
      );

      return record?.Id ? this.mapProperty(record) : null;
    } catch (error: any) {
      if (
        error.message?.includes('(404)') ||
        error.message?.includes('NOT_FOUND')
      ) {
        return null;
      }

      throw error;
    }
  }

  public async createProperty(
    property: Omit<IProperty, 'id' | 'registrationDate'>
  ): Promise<IProperty> {
    const record = await this.call('properties', 'POST', {
      propertyNumber: property.propertyNumber,
      address: property.address,
      category: property.category,
      builtUpArea: property.builtUpArea,
      zone: property.zone,
      latitude: property.latitude,
      longitude: property.longitude,
      documentReference: property.documentReference,
      constructionYear: property.constructionYear,
    });

    if (!record?.Id) {
      throw new Error(
        'Salesforce did not return the created property record.'
      );
    }

    return this.mapProperty(record);
  }

  public async updatePropertyStatus(
    id: string,
    status: IProperty['verificationStatus']
  ): Promise<IProperty> {
    const record = await this.call('properties', 'PATCH', {
      propertyId: id,
      status,
      notes: '',
    });

    if (!record?.Id) {
      throw new Error(
        'Salesforce did not return the updated property record.'
      );
    }

    return this.mapProperty(record);
  }

  // ASSESSMENTS

  public async listAssessments(
    propertyId?: string
  ): Promise<ITaxAssessment[]> {
    const [records, properties] = await Promise.all([
      this.call('assessments'),
      this.listProperties(),
    ]);

    if (!Array.isArray(records)) {
      throw new Error('Unexpected Salesforce assessments response.');
    }

    const propertyMap = new Map(
      properties.map((property) => [property.id, property])
    );

    let assessments = records.map((record) =>
      this.mapAssessment(
        record,
        propertyMap.get(record.Property__c)
      )
    );

    if (propertyId) {
      assessments = assessments.filter(
        (assessment) => assessment.propertyId === propertyId
      );
    }

    return assessments;
  }

  public async getAssessmentById(
    id: string
  ): Promise<ITaxAssessment | null> {
    const assessments = await this.listAssessments();

    return (
      assessments.find(
        (assessment) =>
          assessment.id === id ||
          assessment.assessmentNumber === id
      ) ?? null
    );
  }

  public async createAssessment(
    _assessment: Omit<ITaxAssessment, 'id'>
  ): Promise<ITaxAssessment> {
    return this.unsupported('Assessment creation');
  }

  // PAYMENTS

  public async listPayments(
    _assessmentId?: string
  ): Promise<ITaxPayment[]> {
    return this.unsupported('Payment history retrieval');
  }

  public async createPayment(
    payment: Omit<ITaxPayment, 'id' | 'receiptNumber'>
  ): Promise<{
    payment: ITaxPayment;
    assessment: ITaxAssessment;
  }> {
    const currentAssessment = await this.getAssessmentById(
      payment.assessmentId
    );

    if (!currentAssessment) {
      throw new Error('Assessment not found in Salesforce.');
    }

    if (payment.amountPaid <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    if (payment.amountPaid > currentAssessment.outstandingBalance) {
      throw new Error('Payment exceeds the outstanding assessment balance.');
    }

    const record = await this.call('payments', 'POST', {
      assessmentId: payment.assessmentId,
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
    });

    if (!record?.Id) {
      throw new Error(
        'Salesforce did not return the created payment record.'
      );
    }

    const createdPayment = this.mapPayment(record);

    // Apex PaymentService updates the assessment balance atomically.
    // Reflect the confirmed payment in the returned assessment.
    const updatedAssessment: ITaxAssessment = {
      ...currentAssessment,
      amountPaid:
        Math.round(
          (currentAssessment.amountPaid + createdPayment.amountPaid) *
          100
        ) / 100,
      outstandingBalance:
        Math.round(
          (currentAssessment.outstandingBalance -
            createdPayment.amountPaid) *
          100
        ) / 100,
      status:
        currentAssessment.outstandingBalance -
          createdPayment.amountPaid <= 0
          ? 'PAID'
          : 'PARTIALLY_PAID',
    };

    return {
      payment: createdPayment,
      assessment: updatedAssessment,
    };
  }

  // GRIEVANCES

  public async listGrievances(
    _citizenId?: string
  ): Promise<IGrievance[]> {
    return this.unsupported('Grievance retrieval');
  }

  public async createGrievance(
    _grievance: Omit<
      IGrievance,
      'id' | 'grievanceNumber' | 'createdAt'
    >
  ): Promise<IGrievance> {
    return this.unsupported('Grievance creation');
  }

  public async resolveGrievance(
    _id: string,
    _comments: string
  ): Promise<IGrievance> {
    return this.unsupported('Grievance resolution');
  }

  // REASSESSMENTS

  public async listReassessments(
    _propertyId?: string
  ): Promise<IReassessment[]> {
    return this.unsupported('Reassessment retrieval');
  }

  public async createReassessment(
    _reassessment: Omit<
      IReassessment,
      'id' | 'requestNumber' | 'createdAt'
    >
  ): Promise<IReassessment> {
    return this.unsupported('Reassessment creation');
  }

  // DASHBOARD

  public async getDashboardMetrics(): Promise<IDashboardMetrics> {
    const record = await this.call('dashboard');

    if (!record || typeof record !== 'object') {
      throw new Error('Unexpected Salesforce dashboard response.');
    }

    const totalProperties = Number(record.totalProperties ?? 0);
    const verifiedProperties = Number(
      record.verifiedProperties ?? 0
    );
    const pendingVerifications = Number(
      record.pendingProperties ?? 0
    );
    const totalTaxAssessed = Number(
      record.totalAssessedTax ??
      record.totalTaxAssessed ??
      0
    );
    const totalRevenueCollected = Number(
      record.totalRevenueCollected ?? 0
    );

    const totalOutstandingDues = Math.max(
      0,
      totalTaxAssessed - totalRevenueCollected
    );

    const collectionEfficiencyRate =
      totalTaxAssessed > 0
        ? Math.round(
            (totalRevenueCollected / totalTaxAssessed) * 10000
          ) / 100
        : 0;

    return {
      totalProperties,
      verifiedProperties,
      pendingVerifications,
      totalTaxAssessed,
      totalRevenueCollected,
      totalOutstandingDues,
      collectionEfficiencyRate,

      // The current Apex dashboard does not expose grievance metrics.
      // This is a placeholder, not an authoritative grievance count.
      openGrievances: 0,
    };
  }
}
