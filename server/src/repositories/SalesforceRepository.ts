
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

type SalesforceRecord = Record<string, any>;

type SalesforceHttpMethod = 'GET' | 'POST' | 'PATCH';

export class SalesforceRepository implements ICivicTaxRepository {
  constructor(private readonly session: SalesforceSessionData) {
    if (!session?.accessToken || !session?.instanceUrl) {
      throw new Error('A valid Salesforce session is required.');
    }
  }

  private async call(
    endpoint: string,
    method: SalesforceHttpMethod = 'GET',
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
      `${operation} is not implemented by the current Salesforce Apex REST API.`
    );
  }

  private getNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getString(value: unknown, fallback = ''): string {
    return value === null || value === undefined
      ? fallback
      : String(value);
  }

  private normalizeCategory(value: unknown): IProperty['category'] {
    const category = this.getString(value, 'RESIDENTIAL').toUpperCase();

    const allowed: IProperty['category'][] = [
      'RESIDENTIAL',
      'COMMERCIAL',
      'INDUSTRIAL',
      'AGRICULTURAL',
    ];

    return allowed.includes(category as IProperty['category'])
      ? (category as IProperty['category'])
      : 'RESIDENTIAL';
  }

  private normalizeVerificationStatus(
    value: unknown
  ): IProperty['verificationStatus'] {
    const status = this.getString(value, 'PENDING').toUpperCase();

    const allowed: IProperty['verificationStatus'][] = [
      'PENDING',
      'VERIFIED',
      'RESUBMISSION_REQUIRED',
      'REJECTED',
    ];

    return allowed.includes(
      status as IProperty['verificationStatus']
    )
      ? (status as IProperty['verificationStatus'])
      : 'PENDING';
  }

  private normalizeAssessmentStatus(
    value: unknown
  ): ITaxAssessment['status'] {
    const status = this.getString(value, 'DRAFT').toUpperCase();

    const allowed: ITaxAssessment['status'][] = [
      'DRAFT',
      'APPROVED',
      'PARTIALLY_PAID',
      'PAID',
      'OVERDUE',
    ];

    return allowed.includes(status as ITaxAssessment['status'])
      ? (status as ITaxAssessment['status'])
      : 'DRAFT';
  }

  private mapProperty(record: SalesforceRecord): IProperty {
    /*
     * Both Owner__c and Property_Owner__c are Contact lookups
     * in the supplied Salesforce metadata.
     *
     * Do not use record.OwnerId here: OwnerId identifies the
     * Salesforce record owner, not necessarily the CivicTax citizen.
     */
    const citizenContactId =
      record.Property_Owner__c ??
      record.Owner__c ??
      '';

    const citizenName =
      record.Property_Owner__r?.Name ??
      record.Owner__r?.Name ??
      'Not available';

    return {
      id: this.getString(record.Id),
      propertyNumber: this.getString(
        record.Property_Number__c ?? record.Name
      ),
      ownerId: this.getString(citizenContactId),
      ownerName: this.getString(citizenName, 'Not available'),
      address: this.getString(record.Property_Address__c),
      category: this.normalizeCategory(
        record.Property_Category__c
      ),
      builtUpArea: this.getNumber(record.Built_Up_Area__c),
      zone: this.getString(
        record.Zone__c ?? record.Municipal_Zone__c
      ),
      verificationStatus: this.normalizeVerificationStatus(
        record.Verification_Status__c
      ),
      documentReference: this.getString(
        record.Ownership_Document__c
      ),
      latitude:
        record.Latitude__c == null
          ? undefined
          : this.getNumber(record.Latitude__c),
      longitude:
        record.Longitude__c == null
          ? undefined
          : this.getNumber(record.Longitude__c),
      constructionYear:
        record.Construction_Year__c == null
          ? undefined
          : this.getNumber(record.Construction_Year__c),
      registrationDate: this.getString(
        record.Registration_Date__c
      ),
    };
  }

  private mapAssessment(
    record: SalesforceRecord,
    property?: IProperty
  ): ITaxAssessment {
    const baseTax = this.getNumber(
      record.Base_Tax__c ?? record.Base_Value__c
    );

    const totalTax = this.getNumber(
      record.Total_Tax__c ?? record.Total_Amount__c,
      baseTax
    );

    const amountPaid = this.getNumber(record.Amount_Paid__c);

    const outstandingBalance = this.getNumber(
      record.Outstanding_Amount__c,
      Math.max(0, totalTax - amountPaid)
    );

    return {
      id: this.getString(record.Id),
      assessmentNumber: this.getString(
        record.Assessment_Number__c ?? record.Name ?? record.Id
      ),
      propertyId: this.getString(
        record.Property__c ?? record.Property__r?.Id
      ),
      assessmentYear: this.getString(
        record.Assessment_Year__c
      ),
      category: property?.category ?? '',
      builtUpArea: property?.builtUpArea ?? 0,
      appliedRatePerSqFt: this.getNumber(
        record.Applied_Rate_Per_Sq_Ft__c
      ),
      baseTax,
      penalty: this.getNumber(record.Penalty__c),
      discount: this.getNumber(record.Discount__c),
      totalTax,
      amountPaid,
      outstandingBalance,
      status: this.normalizeAssessmentStatus(
        record.Assessment_Status__c
      ),
      dueDate: this.getString(record.Due_Date__c),
    };
  }

  private mapPayment(record: SalesforceRecord): ITaxPayment {
    const rawStatus = this.getString(
      record.Payment_Status__c,
      'PENDING'
    ).toUpperCase();

    const paymentStatus: ITaxPayment['paymentStatus'] =
      rawStatus === 'SUCCESS' || rawStatus === 'FAILED'
        ? rawStatus
        : 'PENDING';

    return {
      id: this.getString(record.Id),
      assessmentId: this.getString(
        record.Assessment__c ?? record.Assessment__r?.Id
      ),
      amountPaid: this.getNumber(record.Amount_Paid__c),
      paymentDate: this.getString(record.Payment_Date__c),
      paymentMethod: this.getString(record.Payment_Method__c),
      transactionId: this.getString(record.Transaction_ID__c),
      paymentStatus,
      receiptNumber: this.getString(
        record.Receipt_Number__c ?? record.Name ?? record.Id
      ),
    };
  }

  // ---------------------------------------------------------
  // PROPERTIES
  // ---------------------------------------------------------

  public async listProperties(
    filter?: {
      category?: string;
      zone?: string;
      status?: string;
    }
  ): Promise<IProperty[]> {
    const records = await this.call('properties');

    if (!Array.isArray(records)) {
      throw new Error(
        'Unexpected Salesforce properties response. Expected an array.'
      );
    }

    let properties = records.map((record: SalesforceRecord) =>
      this.mapProperty(record)
    );

    if (filter?.category) {
      const category = filter.category.toUpperCase();

      properties = properties.filter(
        property => property.category === category
      );
    }

    if (filter?.zone) {
      const zone = filter.zone.trim().toLowerCase();

      properties = properties.filter(
        property => property.zone.trim().toLowerCase() === zone
      );
    }

    if (filter?.status) {
      const status = filter.status.toUpperCase();

      properties = properties.filter(
        property =>
          property.verificationStatus === status
      );
    }

    return properties;
  }

  public async getPropertyById(
    id: string
  ): Promise<IProperty | null> {
    if (!id?.trim()) {
      return null;
    }

    try {
      const record = await this.call(
        `properties/${encodeURIComponent(id)}`
      );

      return record?.Id ? this.mapProperty(record) : null;
    } catch (error: any) {
      const message = String(error?.message ?? '');

      if (
        message.includes('(404)') ||
        message.includes('NOT_FOUND') ||
        message.includes('NOT_FOUND:')
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
    if (!id?.trim()) {
      throw new Error('Property ID is required.');
    }

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

  // ---------------------------------------------------------
  // ASSESSMENTS
  // ---------------------------------------------------------

  public async listAssessments(
    propertyId?: string
  ): Promise<ITaxAssessment[]> {
    const [records, properties] = await Promise.all([
      this.call('assessments'),
      this.listProperties(),
    ]);

    if (!Array.isArray(records)) {
      throw new Error(
        'Unexpected Salesforce assessments response. Expected an array.'
      );
    }

    const propertyMap = new Map(
      properties.map(property => [property.id, property])
    );

    let assessments = records.map((record: SalesforceRecord) => {
      const relatedPropertyId = this.getString(
        record.Property__c ?? record.Property__r?.Id
      );

      return this.mapAssessment(
        record,
        propertyMap.get(relatedPropertyId)
      );
    });

    if (propertyId) {
      assessments = assessments.filter(
        assessment => assessment.propertyId === propertyId
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
        assessment =>
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

  // ---------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------

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
    if (!payment.assessmentId) {
      throw new Error('Assessment ID is required.');
    }

    if (
      !Number.isFinite(payment.amountPaid) ||
      payment.amountPaid <= 0
    ) {
      throw new Error(
        'Payment amount must be a valid number greater than zero.'
      );
    }

    const currentAssessment = await this.getAssessmentById(
      payment.assessmentId
    );

    if (!currentAssessment) {
      throw new Error('Assessment not found in Salesforce.');
    }

    if (
      payment.amountPaid >
      currentAssessment.outstandingBalance
    ) {
      throw new Error(
        'Payment exceeds the outstanding assessment balance.'
      );
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

    /*
     * The payment endpoint must update the assessment in Apex.
     * The returned assessment below is a local projection.
     * Refresh the assessment from Salesforce for authoritative values.
     */
    const refreshedAssessment = await this.getAssessmentById(
      payment.assessmentId
    );

    if (!refreshedAssessment) {
      throw new Error(
        'Payment was created, but the updated assessment could not be retrieved.'
      );
    }

    return {
      payment: createdPayment,
      assessment: refreshedAssessment,
    };
  }

  // ---------------------------------------------------------
  // GRIEVANCES
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // REASSESSMENTS
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------

  public async getDashboardMetrics(): Promise<IDashboardMetrics> {
    const record = await this.call('dashboard');

    if (!record || typeof record !== 'object') {
      throw new Error(
        'Unexpected Salesforce dashboard response.'
      );
    }

    const totalProperties = this.getNumber(
      record.totalProperties
    );

    const verifiedProperties = this.getNumber(
      record.verifiedProperties
    );

    const pendingVerifications = this.getNumber(
      record.pendingProperties ??
      record.pendingVerifications
    );

    const totalTaxAssessed = this.getNumber(
      record.totalAssessedTax ??
      record.totalTaxAssessed
    );

    const totalRevenueCollected = this.getNumber(
      record.totalRevenueCollected
    );

    const totalOutstandingDues = this.getNumber(
      record.totalOutstandingDues,
      Math.max(
        0,
        totalTaxAssessed - totalRevenueCollected
      )
    );

    const collectionEfficiencyRate =
      totalTaxAssessed > 0
        ? Math.round(
            (totalRevenueCollected / totalTaxAssessed) *
            10000
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

      // The current dashboard Apex response does not provide
      // an authoritative grievance count.
      openGrievances: this.getNumber(
        record.openGrievances,
        0
      ),
    };
  }
}
