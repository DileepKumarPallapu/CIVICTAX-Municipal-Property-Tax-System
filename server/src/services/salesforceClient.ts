
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

type SalesforceHttpMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'DELETE';

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
  // 4. BUILD APEX REST URL
  // ============================================================

  private static buildApexUrl(
    instanceUrl: string,
    endpointPath: string
  ): string {
    const baseUrl = instanceUrl.replace(/\/+$/, '');

    const cleanPath = endpointPath
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

    return (
      `${baseUrl}/services/apexrest/civictax/v1/${cleanPath}`
    );
  }

  // ============================================================
  // 5. BUILD REQUEST OPTIONS
  // ============================================================

  private static buildRequestOptions(
    session: SalesforceSessionData,
    method: SalesforceHttpMethod,
    body?: unknown
  ): RequestInit {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: 'application/json',
    };

    const hasBody =
      body !== undefined &&
      (method === 'POST' || method === 'PATCH');

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (hasBody) {
      options.body = JSON.stringify(body);
    }

    return options;
  }

  // ============================================================
  // 6. APEX REST API CALL
  // ============================================================

  public static async callApexRest(
    session: SalesforceSessionData,
    endpointPath: string,
    method: SalesforceHttpMethod = 'GET',
    body?: unknown
  ): Promise<any> {
    if (!session?.accessToken || !session?.instanceUrl) {
      throw new Error(
        'A valid Salesforce session is required.'
      );
    }

    if (!endpointPath?.trim()) {
      throw new Error(
        'Salesforce Apex REST endpoint path is required.'
      );
    }

    let url = this.buildApexUrl(
      session.instanceUrl,
      endpointPath
    );

    let requestOptions = this.buildRequestOptions(
      session,
      method,
      body
    );

    // First API request.
    let response = await fetch(url, requestOptions);

    // ==========================================================
    // 7. AUTOMATIC TOKEN REFRESH AND RETRY
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

      // Update access token.
      session.accessToken = refreshed.access_token;

      // Salesforce may return a new instance URL.
      if (refreshed.instance_url) {
        session.instanceUrl = refreshed.instance_url;
      }

      // Update refresh token only if Salesforce returns one.
      if (refreshed.refresh_token) {
        session.refreshToken = refreshed.refresh_token;
      }

      session.lastActiveAt = new Date().toISOString();

      // Persist refreshed session in central Redis storage.
      await SalesforceConnectionStore.save(session);

      // Rebuild URL using the updated instance URL.
      url = this.buildApexUrl(
        session.instanceUrl,
        endpointPath
      );

      // Rebuild headers using the updated access token.
      requestOptions = this.buildRequestOptions(
        session,
        method,
        body
      );

      // Retry exactly once.
      response = await fetch(url, requestOptions);

      if (response.status === 401) {
        throw new Error(
          'Salesforce authorization failed after token refresh. Reconnect the administrator account.'
        );
      }
    }

    // ==========================================================
    // 8. HANDLE API RESPONSE
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

    // Successful response with no content.
    if (response.status === 204) {
      return null;
    }

    const responseText = await response.text();

    if (!responseText.trim()) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  }
}
