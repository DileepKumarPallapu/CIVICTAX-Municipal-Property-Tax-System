
import { createHmac, randomBytes } from 'node:crypto';
import { config } from '../config/index.js';
import {
  SalesforceOAuthTokenResponse,
  SalesforceSessionData,
} from '../types/index.js';
import { SalesforceConnectionStore } from './salesforceConnectionStore.js';

type SalesforceIdentity = {
  id?: string;
  username: string;
  display_name: string;
  organization_id: string;
  user_id: string;
};

export interface AuthenticatedCivicTaxUser {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
}

const VALID_ROLES = new Set(['CITIZEN', 'OFFICER', 'ADMIN']);

type SalesforceHttpMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'DELETE';

export class SalesforceApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'SalesforceApiError';
  }
}

export class SalesforceClient {
  private static parseSalesforceUrl(value: string): URL {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error('Salesforce returned an invalid identity URL.');
    }

    const host = url.hostname.toLowerCase();
    const isSalesforceHost =
      host === 'salesforce.com' ||
      host.endsWith('.salesforce.com') ||
      host === 'force.com' ||
      host.endsWith('.force.com') ||
      host === 'salesforce.mil' ||
      host.endsWith('.salesforce.mil') ||
      host === 'force.mil' ||
      host.endsWith('.force.mil');
    if (
      url.protocol !== 'https:' ||
      !isSalesforceHost ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error('Salesforce returned an untrusted identity URL.');
    }
    return url;
  }

  private static parseIdentityIds(identityUrl: string): {
    organizationId: string;
    userId: string;
  } {
    const url = this.parseSalesforceUrl(identityUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    if (
      segments.length !== 3 ||
      segments[0] !== 'id' ||
      !/^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/.test(segments[1]) ||
      !/^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/.test(segments[2])
    ) {
      throw new Error('Salesforce returned a malformed identity URL.');
    }
    return { organizationId: segments[1], userId: segments[2] };
  }

  private static sameSalesforceId(left: string, right: string): boolean {
    return left.slice(0, 15) === right.slice(0, 15);
  }

  private static validateOrganizationId(organizationId: string): void {
    if (
      !/^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/.test(organizationId) ||
      (config.salesforce.expectedOrgId &&
        !this.sameSalesforceId(
          organizationId,
          config.salesforce.expectedOrgId
        ))
    ) {
      throw new Error('Salesforce authenticated an unexpected organization.');
    }
  }

  private static validateInstanceUrl(instanceUrl: string): URL {
    const url = this.parseSalesforceUrl(instanceUrl);
    if (url.pathname !== '/' && url.pathname !== '') {
      throw new Error('Salesforce returned an invalid instance URL.');
    }
    return url;
  }

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
      console.error('Salesforce token exchange failed:', response.status);

      throw new Error(
        `Salesforce token exchange failed (${response.status}).`
      );
    }

    const tokenData: unknown = await response.json();
    if (
      typeof tokenData !== 'object' ||
      tokenData === null ||
      !('access_token' in tokenData) ||
      typeof tokenData.access_token !== 'string' ||
      !tokenData.access_token ||
      !('instance_url' in tokenData) ||
      typeof tokenData.instance_url !== 'string' ||
      !('id' in tokenData) ||
      typeof tokenData.id !== 'string'
    ) {
      throw new Error('Salesforce returned an invalid OAuth token response.');
    }
    this.validateInstanceUrl(tokenData.instance_url);
    this.parseIdentityIds(tokenData.id);
    return tokenData as SalesforceOAuthTokenResponse;
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
      console.error('Salesforce token refresh failed:', response.status);

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
    accessToken: string,
    instanceUrl?: string
  ): Promise<SalesforceIdentity> {
    const identityEndpoint = this.parseSalesforceUrl(identityUrl);
    this.parseIdentityIds(identityUrl);
    const configuredIssuerHost = new URL(config.salesforce.loginUrl).hostname.toLowerCase();
    const allowedIssuerHosts = new Set([
      configuredIssuerHost,
      ...(instanceUrl
        ? [this.validateInstanceUrl(instanceUrl).hostname.toLowerCase()]
        : []),
    ]);
    if (!allowedIssuerHosts.has(identityEndpoint.hostname.toLowerCase())) {
      throw new Error('Salesforce identity issuer is not trusted.');
    }
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

    const identity: unknown = await response.json();
    if (
      typeof identity !== 'object' ||
      identity === null ||
      !('organization_id' in identity) ||
      typeof identity.organization_id !== 'string' ||
      !('user_id' in identity) ||
      typeof identity.user_id !== 'string'
    ) {
      throw new Error('Salesforce returned an invalid identity response.');
    }
    const urlIds = this.parseIdentityIds(identityUrl);
    this.validateOrganizationId(identity.organization_id);
    if (
      !this.sameSalesforceId(identity.organization_id, urlIds.organizationId) ||
      !this.sameSalesforceId(identity.user_id, urlIds.userId)
    ) {
      throw new Error('Salesforce identity did not match its trusted identity URL.');
    }
    if (
      'id' in identity &&
      typeof identity.id === 'string' &&
      identity.id !== identityUrl
    ) {
      const responseIds = this.parseIdentityIds(identity.id);
      if (
        !this.sameSalesforceId(responseIds.organizationId, urlIds.organizationId) ||
        !this.sameSalesforceId(responseIds.userId, urlIds.userId)
      ) {
        throw new Error('Salesforce identity response is inconsistent.');
      }
    }
    return identity as SalesforceIdentity;
  }

  public static async resolveAuthenticatedCivicTaxUser(
    tokenData: SalesforceOAuthTokenResponse
  ): Promise<AuthenticatedCivicTaxUser> {
    if (!tokenData.access_token) {
      throw new Error('A Salesforce access token is required.');
    }
    const instanceUrl = this.validateInstanceUrl(tokenData.instance_url);
    const identityUrlIds = this.parseIdentityIds(tokenData.id);
    this.validateOrganizationId(identityUrlIds.organizationId);

    const identity = await this.fetchIdentity(
      tokenData.id,
      tokenData.access_token,
      tokenData.instance_url
    );
    if (!this.sameSalesforceId(identity.user_id, identityUrlIds.userId)) {
      throw new Error('Salesforce user identity is inconsistent.');
    }

    const endpoint = new URL(
      '/services/apexrest/civictax/auth/v1/me',
      instanceUrl.origin
    );
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new SalesforceApiError(
          403,
          'CIVICTAX_IDENTITY_NOT_AUTHORIZED',
          'This Salesforce account does not have an active CivicTax identity mapping.'
        );
      }
      throw new SalesforceApiError(
        502,
        'CIVICTAX_IDENTITY_LOOKUP_FAILED',
        'Salesforce could not resolve the CivicTax identity.'
      );
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('id' in payload) ||
      typeof payload.id !== 'string' ||
      !payload.id.trim() ||
      !('role' in payload) ||
      typeof payload.role !== 'string' ||
      !VALID_ROLES.has(payload.role)
    ) {
      throw new SalesforceApiError(
        403,
        'CIVICTAX_IDENTITY_INVALID',
        'Salesforce returned an invalid CivicTax identity mapping.'
      );
    }

    const name =
      'name' in payload && typeof payload.name === 'string'
        ? payload.name.trim()
        : '';
    const email =
      'email' in payload && typeof payload.email === 'string'
        ? payload.email.trim()
        : '';
    return {
      id: payload.id.trim(),
      name: name || 'CivicTax user',
      email,
      role: payload.role as AuthenticatedCivicTaxUser['role'],
    };
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
    endpointPath: string,
    body: unknown,
    civicTaxUserId: string
  ): RequestInit {
    const userId = civicTaxUserId.trim();
    const keyId = config.salesforce.gatewayKeyId;
    const gatewaySecret = config.salesforce.gatewaySecret;

    if (!userId) {
      throw new Error(
        'An authenticated CivicTax user is required for Salesforce API requests.'
      );
    }

    if (!gatewaySecret || gatewaySecret.length < 32) {
      throw new Error(
        'CIVICTAX_GATEWAY_SHARED_SECRET must be configured with at least 32 characters.'
      );
    }
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(keyId)) {
      throw new Error(
        'CIVICTAX_GATEWAY_KEY_ID must be configured with a valid key identifier.'
      );
    }

    const hasBody =
      body !== undefined &&
      (method === 'POST' || method === 'PATCH');
    const bodyText = hasBody ? JSON.stringify(body) : '';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(32).toString('base64url');
    const canonical = [
      timestamp,
      keyId,
      nonce,
      userId,
      method.toUpperCase(),
      endpointPath,
      bodyText,
    ].join('\n');
    const signature = createHmac('sha256', gatewaySecret)
      .update(canonical, 'utf8')
      .digest('hex');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: 'application/json',
      'X-CivicTax-Key-Id': keyId,
      'X-CivicTax-Nonce': nonce,
      'X-CivicTax-User-Id': userId,
      'X-CivicTax-Timestamp': timestamp,
      'X-CivicTax-Signature': signature,
    };

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (hasBody) {
      options.body = bodyText;
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
    body: unknown = undefined,
    civicTaxUserId: string
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

    const cleanEndpointPath = endpointPath
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');
    const validEndpointPath =
      /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)*$/.test(
        cleanEndpointPath
      );
    if (!validEndpointPath) {
      throw new Error(
        'Salesforce Apex REST endpoint path contains invalid segments.'
      );
    }
    let url = this.buildApexUrl(session.instanceUrl, cleanEndpointPath);

    let requestOptions = this.buildRequestOptions(
      session,
      method,
      cleanEndpointPath,
      body,
      civicTaxUserId
    );

    // First API request.
    let response = await fetch(url, requestOptions);

    // ==========================================================
    // 7. AUTOMATIC TOKEN REFRESH AND RETRY
    // ==========================================================

    if (response.status === 401) {
      const gatewayError = await response
        .clone()
        .json()
        .catch(() => null);
      if (gatewayError?.error === 'GATEWAY_AUTH_FAILED') {
        throw new SalesforceApiError(
          401,
          gatewayError.error,
          gatewayError.message ||
            'Salesforce rejected the CivicTax gateway signature or user mapping.'
        );
      }

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
        cleanEndpointPath,
        body,
        civicTaxUserId
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
      const payload = await response.json().catch(() => null);
      const code =
        typeof payload?.error === 'string'
          ? payload.error
          : 'APEX_REST_ERROR';
      const message =
        typeof payload?.message === 'string'
          ? payload.message
          : `Salesforce Apex API request failed (${response.status}).`;
      const isNotFound =
        code === 'BAD_REQUEST' && /not found/i.test(message);
      const isDuplicate =
        /already registered|already exists|DUPLICATE_VALUE/i.test(message);
      const statusCode = isNotFound
        ? 404
        : isDuplicate
          ? 409
          : code === 'FORBIDDEN'
            ? 403
            : code === 'BAD_REQUEST'
              ? 400
              : response.status;

      console.error('Salesforce Apex API error:', response.status, code);
      throw new SalesforceApiError(statusCode, code, message);
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
