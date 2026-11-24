import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  frontendUrl: string;
  sessionSecret: string;
  redisUrl?: string;
  kvUrl?: string;
  upstashRedisRestUrl?: string;
  upstashRedisRestToken?: string;
  salesforce: {
    loginUrl: string;
    clientId: string;
    clientSecret: string;
    expectedOrgId: string;
    gatewayKeyId: string;
    gatewaySecret: string;
    redirectUri: string;
    apiVersion: string;
  };
}

function requireHttpsOrigin(value: string, fieldName: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error(`${fieldName} must be a valid HTTPS origin in production.`);
  }
}

function requireHttpsRedirectUri(value: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.pathname !== '/auth/salesforce/callback' ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error(
      'SF_REDIRECT_URI must be an HTTPS Salesforce OAuth callback URL in production.'
    );
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production' || Boolean(env.VERCEL);
  let loginUrl = env.SF_LOGIN_URL || 'https://login.salesforce.com';
  const clientId = env.SF_CLIENT_ID || '';
  const clientSecret = env.SF_CLIENT_SECRET || '';
  const expectedOrgId = env.SF_EXPECTED_ORG_ID || '';
  const gatewayKeyId = env.CIVICTAX_GATEWAY_KEY_ID || '';
  const gatewaySecret =
    env.CIVICTAX_GATEWAY_SHARED_SECRET || '';
  let redirectUri =
    env.SF_REDIRECT_URI ||
    (isProduction ? '' : 'http://localhost:3001/auth/salesforce/callback');
  const apiVersion = env.SF_API_VERSION || 'v60.0';
  const sessionSecret =
    env.SESSION_SECRET ||
    (isProduction ? '' : 'civictax_dev_secret_key_default_32chars');
  let frontendUrl =
    env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:5173');
  const port = parseInt(env.PORT || '3001', 10);
  const redisUrl = env.REDIS_URL || undefined;
  const kvUrl = env.KV_URL || undefined;
  const upstashRedisRestUrl = env.UPSTASH_REDIS_REST_URL || undefined;
  const upstashRedisRestToken = env.UPSTASH_REDIS_REST_TOKEN || undefined;

  if (sessionSecret.length < 16) {
    throw new Error('SESSION_SECRET must contain at least 16 characters.');
  }

  if (isProduction) {
    if (sessionSecret.length < 32) {
      throw new Error(
        'Production SESSION_SECRET must be explicitly configured with at least 32 characters.'
      );
    }
    if (!clientId) {
      throw new Error('SF_CLIENT_ID must be configured in production.');
    }
    if (!/^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/.test(expectedOrgId)) {
      throw new Error(
        'SF_EXPECTED_ORG_ID must be a 15- or 18-character Salesforce org ID in production.'
      );
    }
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(gatewayKeyId)) {
      throw new Error(
        'CIVICTAX_GATEWAY_KEY_ID must be valid in production.'
      );
    }
    if (gatewaySecret.length < 32) {
      throw new Error(
        'CIVICTAX_GATEWAY_SHARED_SECRET must contain at least 32 characters in production.'
      );
    }
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL must be configured in production.');
    }
    frontendUrl = requireHttpsOrigin(frontendUrl, 'FRONTEND_URL');
    if (!redirectUri) {
      throw new Error('SF_REDIRECT_URI must be configured in production.');
    }
    redirectUri = requireHttpsRedirectUri(redirectUri);
    loginUrl = requireHttpsOrigin(loginUrl, 'SF_LOGIN_URL');
  }

  return {
    port,
    nodeEnv,
    isProduction,
    frontendUrl,
    sessionSecret,
    redisUrl,
    kvUrl,
    upstashRedisRestUrl,
    upstashRedisRestToken,
    salesforce: {
      loginUrl,
      clientId,
      clientSecret,
      expectedOrgId,
      gatewayKeyId,
      gatewaySecret,
      redirectUri,
      apiVersion,
    },
  };
}

export function getAllowedFrontendOrigins(
  settings: Pick<ServerConfig, 'frontendUrl' | 'isProduction'>
): string[] {
  const localOrigins = settings.isProduction
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];
  return Array.from(new Set([settings.frontendUrl, ...localOrigins].filter(Boolean)));
}

export const config = loadConfig();
