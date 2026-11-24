import { afterEach, describe, expect, it, vi } from 'vitest';
import { SalesforcePropertyService } from '../services/SalesforcePropertyService';

const salesforceProperty = {
  id: 'a0B000000000001AAA',
  propertyNumber: 'CT-2026-TEST',
  ownerId: '003000000000001AAA',
  ownerName: 'Test Citizen',
  address: '12 Test Road, Ward 4',
  category: 'RESIDENTIAL',
  builtUpArea: 1250,
  zone: 'Zone 4',
  verificationStatus: 'PENDING',
  documentReference: 'DOC-TEST-2026',
  constructionYear: 2018,
  registrationDate: '2026-01-01T00:00:00.000Z',
};

describe('SalesforcePropertyService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the Salesforce-backed property fields and retains the returned record ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: salesforceProperty }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const service = new SalesforcePropertyService();

    const created = await service.createProperty({
      ownerId: 'usr-citizen-01',
      ownerName: 'Test Citizen',
      ownerEmail: 'citizen@example.test',
      ownerPhone: '',
      address: salesforceProperty.address,
      category: 'RESIDENTIAL',
      zoneId: 'Zone 4',
      zoneName: 'Zone 4',
      builtUpArea: 1250,
      constructionYear: 2018,
      documentReference: 'DOC-TEST-2026',
      contactDetails: '',
      description: '',
    });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      address: salesforceProperty.address,
      category: 'RESIDENTIAL',
      zone: 'Zone 4',
      builtUpArea: 1250,
      documentReference: 'DOC-TEST-2026',
      constructionYear: 2018,
    });
    expect(created.id).toBe(salesforceProperty.id);
    expect(created.propertyNumber).toBe(salesforceProperty.propertyNumber);
  });

  it('does not re-filter Salesforce-scoped properties by mismatched local user IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: [salesforceProperty] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const service = new SalesforcePropertyService();

    const properties = await service.getProperties({
      ownerId: 'usr-citizen-01',
    });

    expect(properties).toHaveLength(1);
    expect(properties[0].ownerId).toBe('003000000000001AAA');
  });

  it('surfaces the backend Salesforce failure message instead of a generic error code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: 'PROPERTY_REGISTRATION_FAILED',
          message: 'Salesforce citizen mapping is unavailable.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const service = new SalesforcePropertyService();

    await expect(
      service.getProperties()
    ).rejects.toThrow('Salesforce citizen mapping is unavailable.');
  });
});
