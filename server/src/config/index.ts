import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  sessionSecret: string;
  salesforce: {
    loginUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    apiVersion: string;
  };
}

export function loadConfig(): ServerConfig {
  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
  const clientId = process.env.SF_CLIENT_ID || '';
  const clientSecret = process.env.SF_CLIENT_SECRET || '';
  const redirectUri = process.env.SF_REDIRECT_URI || 'http://localhost:3001/auth/salesforce/callback';
  const apiVersion = process.env.SF_API_VERSION || 'v60.0';
  const sessionSecret = process.env.SESSION_SECRET || 'civictax_dev_secret_key_default_32chars';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const port = parseInt(process.env.PORT || '3001', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    port,
    nodeEnv,
    frontendUrl,
    sessionSecret,
    salesforce: {
      loginUrl,
      clientId,
      clientSecret,
      redirectUri,
      apiVersion,
    },
  };
}

export const config = loadConfig();
