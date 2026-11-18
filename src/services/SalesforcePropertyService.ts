import {
  Property,
  PropertyCategory,
  PropertyFilterOptions,
  PropertyVerificationStatus,
} from '../types';
import { IPropertyService } from './interfaces';
import { BACKEND_BASE } from './salesforceApiClient';

interface BackendProperty {
  id: string;
  propertyNumber?: string;
  ownerId?: string;
  ownerName?: string;
  address?: string;
  category?: string;
  builtUpArea?: number;
  zone?: string;
  verificationStatus?: string;
  documentReference?: string;
  latitude?: number;
  longitude?: number;
  constructionYear?: number;
  registrationDate?: string;
}

export class SalesforcePropertyService implements IPropertyService {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BACKEND_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(
        result.error || result.message || `CivicTax API error (${response.status})`
      );
    }

    return result as T;
  }

  private mapProperty(record: BackendProperty): Property {
    const category = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'].includes(
      record.category || ''
    )
      ? (record.category as PropertyCategory)
      : 'RESIDENTIAL';

    const validStatuses: PropertyVerificationStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'PENDING',
      'VERIFIED',
      'REJECTED',
      'RESUBMISSION_REQUIRED',
    ];

    const status = validStatuses.includes(
      record.verificationStatus as PropertyVerificationStatus
    )
      ? (record.verificationStatus as PropertyVerificationStatus)
      : 'PENDING';

    const zone = record.zone || '';

    return {
      id: record.id,
      propertyNumber: record.propertyNumber || '',
      ownerId: record.ownerId || '',
      ownerName: record.ownerName || 'Not available',
      ownerEmail: '',
      ownerPhone: '',
      address: record.address || '',
      category,
      zoneId: zone,
      zoneName: zone,
      builtUpArea: Number(record.builtUpArea || 0),
      constructionYear: Number(record.constructionYear || 0),
      documentReference: record.documentReference || '',
      contactDetails: '',
      description: '',
      verificationStatus: status,
      registrationDate: record.registrationDate || '',
      updatedAt: record.registrationDate || '',
      latitude: record.latitude,
      longitude: record.longitude,
      revisions: [],
    };
  }

  public async getProperties(filter?: PropertyFilterOptions): Promise<Property[]> {
    const result = await this.request<{ data: BackendProperty[] }>(
      '/api/properties'
    );

    let properties = (result.data || []).map((record) =>
      this.mapProperty(record)
    );

    if (filter?.search) {
      const query = filter.search.toLowerCase().trim();
      properties = properties.filter((property) =>
        [
          property.propertyNumber,
          property.ownerName,
          property.address,
          property.documentReference,
        ].some((value) => value.toLowerCase().includes(query))
      );
    }

    if (filter?.category && filter.category !== 'ALL') {
      properties = properties.filter(
        (property) => property.category === filter.category
      );
    }

    if (filter?.zoneId && filter.zoneId !== 'ALL') {
      properties = properties.filter(
        (property) => property.zoneId === filter.zoneId
      );
    }

    if (filter?.verificationStatus && filter.verificationStatus !== 'ALL') {
      properties = properties.filter(
        (property) =>
          property.verificationStatus === filter.verificationStatus
      );
    }

    if (filter?.ownerId) {
      properties = properties.filter(
        (property) => property.ownerId === filter.ownerId
      );
    }

    return properties;
  }

  public async getPropertyById(id: string): Promise<Property | null> {
    try {
      const result = await this.request<{ data: BackendProperty }>(
        `/api/properties/${encodeURIComponent(id)}`
      );
      return result.data ? this.mapProperty(result.data) : null;
    } catch (error: any) {
      if (error.message?.includes('(404)')) return null;
      throw error;
    }
  }

  public async getPropertyByNumber(propertyNumber: string): Promise<Property | null> {
    const properties = await this.getProperties();
    return (
      properties.find(
        (property) =>
          property.propertyNumber.toUpperCase() === propertyNumber.toUpperCase()
      ) || null
    );
  }

  ppublic async createProperty(
  data: Omit<
    Property,
    'id' | 'propertyNumber' | 'registrationDate' |
    'updatedAt' | 'verificationStatus'
  >
): Promise<Property> {
  const result = await this.request<{ data: BackendProperty }>(
    '/api/properties',
    {
      method: 'POST',
      body: JSON.stringify({
        ownerId: data.ownerId,
        ownerName: data.ownerName,
        address: data.address,
        category: data.category,
        zone: data.zoneName || data.zoneId,
        builtUpArea: data.builtUpArea,
        documentReference: data.documentReference,
        constructionYear: data.constructionYear,
        verificationStatus: 'PENDING',
      }),
    }
  );

  if (!result.data) {
    throw new Error('Salesforce did not return the registered property.');
  }

  return this.mapProperty(result.data);
}

