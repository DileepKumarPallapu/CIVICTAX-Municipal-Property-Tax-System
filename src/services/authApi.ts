import { BACKEND_BASE } from './salesforceApiClient';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BACKEND_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Authentication failed (${response.status})`);
  }

  return data as T;
}

export const AuthApi = {
  login(email: string, password: string) {
    return request<{ success: boolean; user: BackendUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser() {
    return request<{ authenticated: boolean; user: BackendUser | null }>('/api/auth/me');
  },

  logout() {
    return request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  },
};
