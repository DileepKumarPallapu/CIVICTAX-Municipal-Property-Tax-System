import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import express, { Request, Response, NextFunction } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackendServiceFactory } from '../repositories/ServiceFactory.js';
import { ICivicTaxRepository } from '../repositories/ICivicTaxRepository.js';
import { LocalRepository } from '../repositories/LocalRepository.js';
import { IProperty } from '../repositories/types.js';
import { municipalApiRouter } from '../modules/municipalRoutes.js';
import { SalesforceApiError } from '../services/salesforceClient.js';

const citizen = {
  id: 'usr-citizen-01',
  email: 'citizen@civictax.demo',
  name: 'Test Citizen',
  role: 'CITIZEN' as const,
};

const validRegistration = {
  address: '12 Test Road, Ward 4',
  category: 'RESIDENTIAL',
  builtUpArea: 1250,
  zone: 'Zone 4',
  documentReference: 'DOC-TEST-2026',
  constructionYear: 2018,
  ownerId: 'usr-another-citizen',
  ownerName: 'Untrusted Request Owner',
};

function createProperty(overrides: Partial<IProperty> = {}): IProperty {
  return {
    id: 'a0B000000000001AAA',
    propertyNumber: 'CT-2026-TEST',
    ownerId: '003000000000001AAA',
    ownerName: 'Test Citizen',
    address: validRegistration.address,
    category: 'RESIDENTIAL',
    builtUpArea: 1250,
    zone: 'Zone 4',
    verificationStatus: 'PENDING',
    documentReference: 'DOC-TEST-2026',
    constructionYear: 2018,
    registrationDate: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function requestAs(
  user: typeof citizen | null,
  path: string,
  method = 'GET',
  body?: unknown
): Promise<{ status: number; body: any }> {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = {
      civicTaxUser: user ?? undefined,
      authProvider: user ? 'demo' : undefined,
    };
    next();
  });
  app.use(municipalApiRouter);

  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}${path}`,
      {
        method,
        headers: {
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          'x-civictax-csrf': '1',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }
    );
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

describe('Salesforce-backed citizen property persistence', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires an authenticated citizen and derives ownership from the session', async () => {
    const repository = {
      createProperty: vi.fn(async (property: any) => ({
        ...property,
        id: 'a0B000000000001AAA',
        registrationDate: '2026-01-01T00:00:00.000Z',
      })),
    };
    const repositorySpy = vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockResolvedValue(repository as unknown as ICivicTaxRepository);

    const anonymous = await requestAs(
      null,
      '/api/properties',
      'POST',
      validRegistration
    );
    expect(anonymous.status).toBe(401);
    expect(repository.createProperty).not.toHaveBeenCalled();

    const result = await requestAs(
      citizen,
      '/api/properties',
      'POST',
      validRegistration
    );

    expect(result.status).toBe(201);
    expect(result.body.success).toBe(true);
    expect(result.body.data.id).toBe('a0B000000000001AAA');
    expect(repositorySpy).toHaveBeenCalledWith(citizen.id);
    expect(repository.createProperty).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: citizen.id,
        ownerName: citizen.name,
        address: validRegistration.address,
        category: validRegistration.category,
        builtUpArea: validRegistration.builtUpArea,
        zone: validRegistration.zone,
        documentReference: validRegistration.documentReference,
        constructionYear: validRegistration.constructionYear,
      })
    );
  });

  it('rejects missing registration fields before Salesforce is called', async () => {
    const repository = { createProperty: vi.fn() };
    vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockResolvedValue(repository as unknown as ICivicTaxRepository);

    const result = await requestAs(citizen, '/api/properties', 'POST', {
      ...validRegistration,
      documentReference: '',
    });

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(repository.createProperty).not.toHaveBeenCalled();
  });

  it('reports Salesforce insert failures and duplicate property numbers accurately', async () => {
    const failureRepository = {
      createProperty: vi.fn().mockRejectedValue(
        new SalesforceApiError(502, 'APEX_REST_ERROR', 'Salesforce insert failed.')
      ),
    };
    vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockResolvedValue(failureRepository as unknown as ICivicTaxRepository);

    const failed = await requestAs(
      citizen,
      '/api/properties',
      'POST',
      validRegistration
    );
    expect(failed.status).toBe(502);
    expect(failed.body.success).toBe(false);

    const duplicateRepository = {
      createProperty: vi.fn().mockRejectedValue(
        new SalesforceApiError(409, 'DUPLICATE_VALUE', 'Property number already exists.')
      ),
    };
    vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockRestore();
    vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockResolvedValue(duplicateRepository as unknown as ICivicTaxRepository);

    const duplicate = await requestAs(
      citizen,
      '/api/properties',
      'POST',
      validRegistration
    );
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toBe('PROPERTY_ALREADY_REGISTERED');
  });

  it('lists and retrieves properties using the authenticated identity on new requests', async () => {
    const property = createProperty();
    const repository = {
      listProperties: vi.fn().mockResolvedValue([property]),
      getPropertyById: vi.fn().mockResolvedValue(property),
    };
    const repositorySpy = vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockResolvedValue(repository as unknown as ICivicTaxRepository);

    const listed = await requestAs(citizen, '/api/properties');
    const retrieved = await requestAs(
      citizen,
      `/api/properties/${property.id}`
    );

    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    expect(retrieved.status).toBe(200);
    expect(retrieved.body.data.id).toBe(property.id);
    expect(repositorySpy).toHaveBeenNthCalledWith(1, citizen.id);
    expect(repositorySpy).toHaveBeenNthCalledWith(2, citizen.id);
  });

  it('prevents a citizen from retrieving or modifying another citizen property', async () => {
    const repository = {
      getPropertyById: vi.fn().mockRejectedValue(
        new SalesforceApiError(403, 'FORBIDDEN', 'Access denied.')
      ),
      updatePropertyDetails: vi.fn().mockRejectedValue(
        new SalesforceApiError(403, 'FORBIDDEN', 'Access denied.')
      ),
    };
    vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockResolvedValue(repository as unknown as ICivicTaxRepository);

    const retrieved = await requestAs(
      citizen,
      '/api/properties/a0B000000000099AAA'
    );
    const updated = await requestAs(
      citizen,
      '/api/properties/a0B000000000099AAA',
      'PATCH',
      { address: '99 Other Owner Street' }
    );

    expect(retrieved.status).toBe(403);
    expect(retrieved.body.error).toBe('FORBIDDEN');
    expect(updated.status).toBe(403);
    expect(updated.body.error).toBe('FORBIDDEN');
    expect(updated.body.success).toBe(false);
  });

  it('only updates whitelisted Salesforce property fields', async () => {
    const property = createProperty({ address: '14 Updated Road' });
    const repository = {
      updatePropertyDetails: vi.fn().mockResolvedValue(property),
    };
    vi.spyOn(BackendServiceFactory, 'getRepository')
      .mockResolvedValue(repository as unknown as ICivicTaxRepository);

    const result = await requestAs(
      citizen,
      `/api/properties/${property.id}`,
      'PATCH',
      {
        address: '14 Updated Road',
        ownerId: '003-another-citizen',
        verificationStatus: 'VERIFIED',
      }
    );

    expect(result.status).toBe(200);
    expect(result.body.data.address).toBe('14 Updated Road');
    expect(repository.updatePropertyDetails).toHaveBeenCalledWith(
      property.id,
      { address: '14 Updated Road' },
      citizen.id
    );
  });

  it('scopes the development repository to the authenticated citizen', async () => {
    const repository = new LocalRepository();

    const owned = await repository.listProperties({
      ownerId: 'usr-citizen-01',
    });
    const crossCitizen = await repository.getPropertyById(
      'prop-001',
      'usr-citizen-02'
    );

    expect(owned.length).toBeGreaterThan(0);
    expect(owned.every((property) => property.ownerId === 'usr-citizen-01')).toBe(true);
    expect(crossCitizen).toBeNull();
    await expect(
      repository.updatePropertyDetails(
        'prop-001',
        { address: '99 Other Owner Street' },
        'usr-citizen-02'
      )
    ).rejects.toThrow('Access Denied');
  });
});
