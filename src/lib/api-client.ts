import { mobileAuth } from './mobile-auth';
import { Capacitor } from '@capacitor/core';

// Use deployed API URL for mobile, relative paths for web
const API_BASE = Capacitor.isNativePlatform()
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://quest-manas-pradhans-projects.vercel.app')
  : '';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await mobileAuth.getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json();

    if (response.status === 401) {
      await mobileAuth.clearToken();
      // Could emit an event here for app to redirect to login
      return { error: 'Unauthorized' };
    }

    if (!response.ok) {
      return { error: result.error || 'Request failed' };
    }

    return { data: result };
  } catch (error) {
    console.error('API Client Error:', error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Convenience methods
export const api = {
  get<T>(endpoint: string, options?: RequestInit) {
    return apiClient<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit) {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
