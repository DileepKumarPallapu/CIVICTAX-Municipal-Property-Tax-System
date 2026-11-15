// CivicTax Backend API Client with environment-aware baseURL
export const BACKEND_BASE =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_BACKEND_URL as string) ||
  'http://localhost:3001';

export class SalesforceApiClient {
  // Check live connection status of Salesforce integration
  public static async checkConnectionStatus() {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/salesforce/status`, {
        credentials: 'include',
      });
      if (!res.ok) {
        return { connected: false, error: `Server status error (${res.status})` };
      }
      return await res.json();
    } catch (err: any) {
      return { connected: false, error: err.message || 'Cannot reach CivicTax backend server' };
    }
  }

  // Trigger live API verification test
  public static async verifyConnection() {
    const res = await fetch(`${BACKEND_BASE}/api/salesforce/verify`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Salesforce API Verification failed');
    }
    return await res.json();
  }

  // Disconnect active session
  public static async disconnect() {
    const res = await fetch(`${BACKEND_BASE}/auth/salesforce/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return await res.json();
  }

  // Call Apex REST Endpoint via secure server proxy
  public static async callApexRest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: any) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const headers: Record<string, string> = {
      'x-civictax-csrf': '1',
    };
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BACKEND_BASE}/api/salesforce/proxy/${cleanEndpoint}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Salesforce Apex API call failed (${res.status})`);
    }

    return await res.json();
  }
}
