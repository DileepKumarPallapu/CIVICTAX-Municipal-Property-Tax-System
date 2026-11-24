import { describe, expect, it } from 'vitest';
import {
  getAllowedFrontendOrigins,
  loadConfig,
} from '../config/index.js';

const validProductionEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://civictax-municipal-property-tax-sys.vercel.app',
  SESSION_SECRET: 'test-session-secret-with-more-than-32-characters',
  SF_CLIENT_ID: 'test-client-id',
  SF_EXPECTED_ORG_ID: '00D000000000001AAA',
  SF_REDIRECT_URI:
    'https://civictax-municipal-property-tax-system.onrender.com/auth/salesforce/callback',
  CIVICTAX_GATEWAY_KEY_ID: 'test-key-id',
  CIVICTAX_GATEWAY_SHARED_SECRET:
    'test-gateway-secret-with-more-than-32-characters',
};

describe('production configuration', () => {
  it('fails closed when the production session secret is missing', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(
      /SESSION_SECRET/
    );
  });

  it('requires an HTTPS frontend origin and OAuth callback', () => {
    expect(() =>
      loadConfig({
        ...validProductionEnvironment,
        FRONTEND_URL: 'http://localhost:5173',
      })
    ).toThrow(/FRONTEND_URL/);

    expect(() =>
      loadConfig({
        ...validProductionEnvironment,
        SF_REDIRECT_URI: 'http://localhost:3001/auth/salesforce/callback',
      })
    ).toThrow(/SF_REDIRECT_URI/);
  });

  it('requires an explicit, valid Salesforce authentication org in production', () => {
    expect(() =>
      loadConfig({
        ...validProductionEnvironment,
        SF_EXPECTED_ORG_ID: '',
      })
    ).toThrow(/SF_EXPECTED_ORG_ID/);

    expect(() =>
      loadConfig({
        ...validProductionEnvironment,
        SF_EXPECTED_ORG_ID: 'not-an-org-id',
      })
    ).toThrow(/SF_EXPECTED_ORG_ID/);
  });

  it('allows only the explicitly configured production frontend origin', () => {
    const productionConfig = loadConfig(validProductionEnvironment);

    expect(
      getAllowedFrontendOrigins(productionConfig)
    ).toEqual(['https://civictax-municipal-property-tax-sys.vercel.app']);
  });

  it('keeps localhost origins limited to development configuration', () => {
    const developmentConfig = loadConfig({ NODE_ENV: 'development' });

    expect(getAllowedFrontendOrigins(developmentConfig)).toContain(
      'http://localhost:5173'
    );
    expect(getAllowedFrontendOrigins(developmentConfig)).toContain(
      'http://127.0.0.1:5173'
    );
  });
});
