
import { config } from '../config/index.js';
import {
  SalesforceOAuthTokenResponse,
  SalesforceSessionData,
} from '../types/index.js';
import { SalesforceConnectionStore } from './salesforceConnectionStore.js';

type SalesforceIdentity = {
  username: string;
  display_name: string;
  organization_id: string;
  user_id: string;
};

export class SalesforceClient {
  // ============================================================
  // 1. EXCHANGE AUTHORIZATION CODE FOR TOKENS
  // ============================================================

  public static async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<SalesforceOAuthTokenResponse> {
    const tokenEndpoint =
      `${config.salesforce.loginUrl}/services/oauth2/token`;

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.salesforce.clientId,
      redirect_uri: config.salesforce.redirectUri,
      code_verifier: codeVerifier,
    });

    if (config.salesforce.clientSecret) {
      bodyParams.append(
        'client_secret',
        config.salesforce.clientSecret
      );
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
      const errorText = await response.text();

      console.error(
        'Salesforce token exchange failed:',
        response.status,
        errorText
      );

      throw new Error(
        `Salesforce token exchange failed (${response.status}).`
      );
    }

    return (await response.json()) as SalesforceOAuthTokenResponse;
  }

  // ============================================================
  // 2. REFRESH ACCESS TOKEN
  // ============================================================

  public static async refreshToken(
    refreshToken: string
  ): Promise<SalesforceOAuthTokenResponse> {
    const tokenEndpoint =
      `${config.salesforce.loginUrl}/services/oauth2/token`;

    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.salesforce.clientId,
    });

    if (config.salesforce.clientSecret) {
      bodyParams.append(
        'client_secret',
        config.salesforce.clientSecret
      );
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
      const errorText = await response.text();

      console.error(
        'Salesforce token refresh failed:',
        response.status,
        errorText
      );

      throw new Error(
        `Salesforce token refresh failed (${response.status}).`
      );
    }

    return (await response.json()) as SalesforceOAuthTokenResponse;
  }

  // ============================================================
  // 3. FETCH SALESFORCE IDENTITY
  // ============================================================

  public static async fetchIdentity(
    identityUrl: string,
    accessToken: string
  ): Promise<SalesforceIdentity> {
    const response = await fetch(identityUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Salesforce identity request failed (${response.status}).`
      );
    }

    return (await response.json()) as SalesforceIdentity;
  }

  // ============================================================
  // 4. APEX REST API CALL
  // ============================================================

  public static async callApexRest(
    session: SalesforceSessionData,
    endpointPath: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const cleanPath = endpointPath.replace(/^\/+/, '');

    const baseUrl = session.instanceUrl.replace(/\/+$/, '');

    const url =
      `${baseUrl}/services/apexrest/civictax/v1/${cleanPath}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: 'application/json',
    };

    if (body !== undefined && ['POST', 'PATCH'].includes(method)) {
      headers['Content-Type'] = 'application/json';
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined && ['POST', 'PATCH'].includes(method)) {
      requestOptions.body = JSON.stringify(body);
    }

    // First API request.
    let response = await fetch(url, requestOptions);

    // ==========================================================
    // 5. AUTOMATIC TOKEN REFRESH AND RETRY
    // ==========================================================

    if (response.status === 401) {
      if (!session.refreshToken) {
        throw new Error(
          'Salesforce session expired. Administrator must reconnect Salesforce.'
        );
      }

      const refreshed = await this.refreshToken(
        session.refreshToken
      );

      if (!refreshed.access_token) {
        throw new Error(
          'Salesforce did not return a refreshed access token.'
        );
      }

      // Update the shared session.
      session.accessToken = refreshed.access_token;

      if (refreshed.instance_url) {
        session.instanceUrl = refreshed.instance_url;
      }

      if (refreshed.refresh_token) {
        session.refreshToken = refreshed.refresh_token;
      }

      session.lastActiveAt = new Date().toISOString();

      // Persist the refreshed token in central encrypted Redis storage.
      await SalesforceConnectionStore.save(session);

      // Retry the original request exactly once.
      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${session.accessToken}`,
      };

      const retryOptions: RequestInit = {
        method,
        headers: retryHeaders,
      };

      if (body !== undefined && ['POST', 'PATCH'].includes(method)) {
        retryOptions.body = JSON.stringify(body);
      }

      response = await fetch(url, retryOptions);

      if (response.status === 401) {
        throw new Error(
          'Salesforce authorization failed after token refresh. Reconnect the administrator account.'
        );
      }
    }

    // ==========================================================
    // 6. HANDLE API RESPONSE
    // ==========================================================

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        'Salesforce Apex API error:',
        response.status,
        errorText
      );

      throw new Error(
        `Salesforce Apex API request failed (${response.status}).`
      );
    }

    // Some successful responses contain no body.
    if (response.status === 204) {
      return null;
    }

    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  }
}
