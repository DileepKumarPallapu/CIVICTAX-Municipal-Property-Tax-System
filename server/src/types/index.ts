export interface SalesforceOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  signature?: string;
  scope?: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
}

export interface SalesforceSessionData {
  accessToken: string;
  refreshToken?: string;
  instanceUrl: string;
  identityUrl: string;
  userId?: string;
  orgId?: string;
  username?: string;
  displayName?: string;
  connectedAt: string;
  lastActiveAt: string;
}

export interface SalesforceStatusResponse {
  connected: boolean;
  instanceUrl?: string;
  orgId?: string;
  username?: string;
  displayName?: string;
  apiVersion: string;
  authMode: 'PKCE_EXTERNAL_CLIENT_APP';
  error?: string;
  lastSync?: string;
}
