import { config } from '../config/index.js';
import { SalesforceOAuthTokenResponse, SalesforceSessionData } from '../types/index.js';

export class SalesforceClient {
  // Exchange PKCE Authorization Code for Access and Refresh Tokens
  public static async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<SalesforceOAuthTokenResponse> {
    const tokenEndpoint = `${config.salesforce.loginUrl}/services/oauth2/token`;

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: config.salesforce.clientId,
      redirect_uri: config.salesforce.redirectUri,
      code_verifier: codeVerifier,
    });

    if (config.salesforce.clientSecret) {
      bodyParams.append('client_secret', config.salesforce.clientSecret);
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Salesforce Token Exchange Failed (${response.status}): ${errText}`);
    }

    const tokenData = (await response.json()) as SalesforceOAuthTokenResponse;
    return tokenData;
  }

  // Refresh expired Access Token using Refresh Token
  public static async refreshToken(refreshToken: string): Promise<SalesforceOAuthTokenResponse> {
    const tokenEndpoint = `${config.salesforce.loginUrl}/services/oauth2/token`;

    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.salesforce.clientId,
    });

    if (config.salesforce.clientSecret) {
      bodyParams.append('client_secret', config.salesforce.clientSecret);
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Salesforce Token Refresh Failed (${response.status}): ${errText}`);
    }

    return (await response.json()) as SalesforceOAuthTokenResponse;
  }

  // Fetch Salesforce User Identity (User ID, Org ID, Username, Display Name)
  public static async fetchIdentity(identityUrl: string, accessToken: string) {
    const response = await fetch(identityUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Salesforce identity (${response.status})`);
    }

    return await response.json();
  }

  // Execute Apex REST API Call
  public static async callApexRest(
    session: SalesforceSessionData,
    endpointPath: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const cleanPath = endpointPath.startsWith('/') ? endpointPath.slice(1) : endpointPath;
    const url = `${session.instanceUrl}/services/apexrest/civictax/v1/${cleanPath}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: 'application/json',
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && session.refreshToken) {
      // Refresh token and retry once
      const refreshed = await this.refreshToken(session.refreshToken);
      session.accessToken = refreshed.access_token;
      headers['Authorization'] = `Bearer ${session.accessToken}`;

      const retryRes = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!retryRes.ok) {
        const err = await retryRes.text();
        throw new Error(`Apex REST Error after token refresh (${retryRes.status}): ${err}`);
      }
      return await retryRes.json();
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Apex REST API Error (${response.status}): ${err}`);
    }

    return await response.json();
  }
}
