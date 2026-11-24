// server/src/repositories/LocalRepository.ts
import { ICivicTaxRepository } from './ICivicTaxRepository.js';
import {
  IProperty,
  IPropertyDetailsUpdate,
  ITaxAssessment,
  ITaxPayment,
  IGrievance,
  IReassessment,
  IDashboardMetrics,
} from './types.js';

export class LocalRepository implements ICivicTaxRepository {
  private properties: IProperty[] = [
    {
      id: 'prop-001',
      propertyNumber: 'CT-PROP-2024-001',
      ownerId: 'usr-citizen-01',
      ownerName: 'Rajesh Kumar Sharma',
      address: 'Flat 402, Wing B, Shanti Heights, M.G. Road',
      category: 'RESIDENTIAL',
      builtUpArea: 1200,
      zone: 'Z-CENTRAL',
      verificationStatus: 'VERIFIED',
      documentReference: 'DOC-MH-PUN-2018-849201',
      latitude: 18.5204,
      longitude: 73.8567,
      constructionYear: 2018,
      registrationDate: new Date().toISOString(),
    },
    {
      id: 'prop-002',
      propertyNumber: 'CT-PROP-2024-002',
      ownerId: 'usr-citizen-01',
      ownerName: 'Rajesh Kumar Sharma',
      address: 'Shop No. 12, Ground Floor, Central Plaza Mall',
      category: 'COMMERCIAL',
      builtUpArea: 650,
      zone: 'Z-CENTRAL',
      verificationStatus: 'VERIFIED',
      documentReference: 'DOC-MH-PUN-2020-551982',
      latitude: 18.5220,
      longitude: 73.8580,
      constructionYear: 2020,
      registrationDate: new Date().toISOString(),
    },
  ];

  private assessments: ITaxAssessment[] = [
    {
      id: 'asm-001',
      assessmentNumber: 'CT-ASM-2024-001',
      propertyId: 'prop-001',
      assessmentYear: '2024-2025',
      category: 'RESIDENTIAL',
      builtUpArea: 1200,
      appliedRatePerSqFt: 10,
      baseTax: 12000,
      penalty: 500,
      discount: 0,
      totalTax: 12500,
      amountPaid: 6000,
      outstandingBalance: 6500,
      status: 'PARTIALLY_PAID',
      dueDate: '2024-12-31',
    },
    {
      id: 'asm-002',
      assessmentNumber: 'CT-ASM-2024-002',
      propertyId: 'prop-002',
      assessmentYear: '2024-2025',
      category: 'COMMERCIAL',
      builtUpArea: 650,
      appliedRatePerSqFt: 18,
      baseTax: 11700,
      penalty: 0,
      discount: 500,
      totalTax: 11200,
      amountPaid: 0,
      outstandingBalance: 11200,
      status: 'APPROVED',
      dueDate: '2024-11-30',
    },
  ];

  private payments: ITaxPayment[] = [
    {
      id: 'pay-001',
      assessmentId: 'asm-001',
      amountPaid: 6000,
      paymentDate: new Date().toISOString(),
      paymentMethod: 'UPI',
      transactionId: 'TXN-UPI-2024-001',
      paymentStatus: 'SUCCESS',
      receiptNumber: 'RCT-2024-001',
    },
  ];

  private grievances: IGrievance[] = [
    {
      id: 'grv-001',
      grievanceNumber: 'GRV-2024-001',
      propertyId: 'prop-001',
      citizenId: 'usr-citizen-01',
      subject: 'Dispute over applied commercial rate',
      description: 'The property is partly residential and was assessed as purely commercial.',
      priority: 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    },
  ];

  private reassessments: IReassessment[] = [
    {
      id: 'rr-001',
      requestNumber: 'RR-2026-0001',
      propertyId: 'prop-001',
      originalAssessmentId: 'asm-001',
      requestedChange: 'Built-up area reassessment following third-floor balcony enclosure.',
      supportingReason: 'Municipal building plan amendment approval #BP-2025-9982',
      approvalStatus: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    },
  ];

  public async listProperties(filter?: {
    category?: string;
    zone?: string;
    status?: string;
    ownerId?: string;
  }): Promise<IProperty[]> {
    return this.properties.filter((p) => {
      if (filter?.category && p.category !== filter.category) return false;
      if (filter?.zone && p.zone !== filter.zone) return false;
      if (filter?.status && p.verificationStatus !== filter.status) return false;
      if (filter?.ownerId && p.ownerId !== filter.ownerId) return false;
      return true;
    });
  }

  public async getPropertyById(
    id: string,
    requesterId?: string
  ): Promise<IProperty | null> {
    const property = this.properties.find(
      (p) => p.id === id || p.propertyNumber === id
    );
    if (requesterId && property?.ownerId !== requesterId) return null;
    return property || null;
  }

  public async createProperty(prop: Omit<IProperty, 'id' | 'registrationDate'>): Promise<IProperty> {
    const existing = this.properties.find((p) => p.propertyNumber === prop.propertyNumber);
    if (existing) {
      throw new Error(`Property ${prop.propertyNumber} already exists`);
    }
    const newProp: IProperty = {
      ...prop,
      id: `prop-${Date.now()}`,
      registrationDate: new Date().toISOString(),
    };
    this.properties.push(newProp);
    return newProp;
  }

  public async updatePropertyDetails(
    id: string,
    updates: IPropertyDetailsUpdate,
    requesterId?: string
  ): Promise<IProperty> {
    const prop = await this.getPropertyById(id);
    if (!prop) throw new Error('Property not found');
    if (requesterId && prop.ownerId !== requesterId) {
      throw new Error('Access Denied: You do not own this property.');
    }
    if (prop.verificationStatus === 'VERIFIED') {
      throw new Error(
        'Verified properties cannot be edited directly. Submit a reassessment request.'
      );
    }

    Object.assign(prop, updates);
    return prop;
  }

  public async updatePropertyStatus(id: string, status: IProperty['verificationStatus']): Promise<IProperty> {
    const prop = await this.getPropertyById(id);
    if (!prop) throw new Error('Property not found');
    prop.verificationStatus = status;
    return prop;
  }

  public async listAssessments(propertyId?: string): Promise<ITaxAssessment[]> {
    if (propertyId) {
      return this.assessments.filter((a) => a.propertyId === propertyId);
    }
    return this.assessments;
  }

  public async getAssessmentById(id: string): Promise<ITaxAssessment | null> {
    return this.assessments.find((a) => a.id === id || a.assessmentNumber === id) || null;
  }

  public async createAssessment(asm: Omit<ITaxAssessment, 'id'>): Promise<ITaxAssessment> {
    const newAsm: ITaxAssessment = {
      ...asm,
      id: `asm-${Date.now()}`,
    };
    this.assessments.push(newAsm);
    return newAsm;
  }

  public async listPayments(assessmentId?: string): Promise<ITaxPayment[]> {
    if (assessmentId) {
      return this.payments.filter((p) => p.assessmentId === assessmentId);
    }
    return this.payments;
  }

  public async createPayment(pmt: Omit<ITaxPayment, 'id' | 'receiptNumber'>): Promise<{ payment: ITaxPayment; assessment: ITaxAssessment }> {
    const asm = await this.getAssessmentById(pmt.assessmentId);
    if (!asm) throw new Error('Target assessment not found');

    if (pmt.amountPaid <= 0) throw new Error('Payment amount must be greater than zero');
    if (pmt.amountPaid > asm.outstandingBalance) {
      throw new Error(`Payment amount (₹${pmt.amountPaid}) exceeds remaining balance (₹${asm.outstandingBalance})`);
    }

    const dup = this.payments.find((p) => p.transactionId === pmt.transactionId);
    if (dup) throw new Error(`Duplicate transaction ID: ${pmt.transactionId}`);

    const newPayment: ITaxPayment = {
      ...pmt,
      id: `pay-${Date.now()}`,
      receiptNumber: `RCT-${Date.now()}`,
    };
    this.payments.push(newPayment);

    // Atomically update assessment balance
    asm.amountPaid = Math.round((asm.amountPaid + pmt.amountPaid) * 100) / 100;
    asm.outstandingBalance = Math.round((asm.totalTax - asm.amountPaid) * 100) / 100;
    asm.status = asm.outstandingBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    return { payment: newPayment, assessment: asm };
  }

  public async listGrievances(citizenId?: string): Promise<IGrievance[]> {
    if (citizenId) {
      return this.grievances.filter((g) => g.citizenId === citizenId);
    }
    return this.grievances;
  }

  public async createGrievance(grv: Omit<IGrievance, 'id' | 'grievanceNumber' | 'createdAt'>): Promise<IGrievance> {
    const newGrv: IGrievance = {
      ...grv,
      id: `grv-${Date.now()}`,
      grievanceNumber: `GRV-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.grievances.push(newGrv);
    return newGrv;
  }

  public async resolveGrievance(id: string, comments: string): Promise<IGrievance> {
    const grv = this.grievances.find((g) => g.id === id || g.grievanceNumber === id);
    if (!grv) throw new Error('Grievance not found');
    grv.status = 'RESOLVED';
    grv.resolutionComments = comments;
    grv.resolutionDate = new Date().toISOString();
    return grv;
  }

  public async listReassessments(propertyId?: string): Promise<IReassessment[]> {
    if (propertyId) {
      return this.reassessments.filter((r) => r.propertyId === propertyId);
    }
    return this.reassessments;
  }

  public async createReassessment(reassessment: Omit<IReassessment, 'id' | 'requestNumber' | 'createdAt'>): Promise<IReassessment> {
    const newReassessment: IReassessment = {
      ...reassessment,
      id: `rr-${Date.now()}`,
      requestNumber: `RR-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.reassessments.push(newReassessment);
    return newReassessment;
  }

  public async getDashboardMetrics(): Promise<IDashboardMetrics> {
    const totalProperties = this.properties.length;
    const verifiedProperties = this.properties.filter((p) => p.verificationStatus === 'VERIFIED').length;
    const pendingVerifications = this.properties.filter((p) => p.verificationStatus === 'PENDING').length;
    
    let totalTaxAssessed = 0;
    let totalRevenueCollected = 0;
    let totalOutstandingDues = 0;

    for (const a of this.assessments) {
      totalTaxAssessed += a.totalTax;
      totalRevenueCollected += a.amountPaid;
      totalOutstandingDues += a.outstandingBalance;
    }

    const collectionEfficiencyRate = totalTaxAssessed > 0 
      ? Math.round((totalRevenueCollected / totalTaxAssessed) * 10000) / 100
      : 0;

    const openGrievances = this.grievances.filter((g) => g.status === 'OPEN').length;

    return {
      totalProperties,
      verifiedProperties,
      pendingVerifications,
      totalTaxAssessed,
      totalRevenueCollected,
      totalOutstandingDues,
      collectionEfficiencyRate,
      openGrievances,
    };
  }
}
