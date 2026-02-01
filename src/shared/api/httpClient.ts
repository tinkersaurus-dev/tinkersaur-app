// Handle both client (VITE_API_URL) and server (process.env) environments
// Called at request time to pick up runtime environment variables
const getApiBaseUrl = (): string => {
  // Server-side: use process.env (checked at runtime)
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:5062';
  }
  // Client-side: use import.meta.env (baked in at build time)
  return import.meta.env.VITE_API_URL || 'http://localhost:5062';
};

const AUTH_TOKEN_KEY = 'tinkersaur_auth_token';
const REFRESH_TOKEN_KEY = 'tinkersaur_refresh_token';
const TOKEN_EXPIRY_KEY = 'tinkersaur_token_expiry';

// Buffer time before expiry to trigger refresh (5 minutes)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export function setRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function setTokenExpiry(expiry: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry);
  }
}

export function getTokenExpiry(): Date | null {
  if (typeof window !== 'undefined') {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? new Date(expiry) : null;
  }
  return null;
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
}

function isTokenExpiringSoon(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return expiry.getTime() - Date.now() < TOKEN_REFRESH_BUFFER_MS;
}

// Track if a refresh is in progress to prevent concurrent refreshes
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuthToken();
        return false;
      }

      const data = await response.json();
      setAuthToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setTokenExpiry(data.accessTokenExpiry);
      return true;
    } catch {
      clearAuthToken();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;

  // Proactively refresh token if it's expiring soon (but not for auth endpoints)
  if (!endpoint.startsWith('/api/auth/') && isTokenExpiringSoon() && getRefreshToken()) {
    await refreshAccessToken();
  }

  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - try to refresh token and retry once
    if (response.status === 401 && !isRetry && !endpoint.startsWith('/api/auth/')) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        return request<T>(endpoint, options, true);
      }
    }

    // If refresh failed or this is already a retry, clear auth and throw
    if (response.status === 401) {
      clearAuthToken();
    }
    throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const httpClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string) =>
    request<void>(url, { method: 'DELETE' }),
};

/**
 * Deserialize date strings from API responses to Date objects
 */
export function deserializeDates<T extends Record<string, unknown>>(obj: T): T {
  const dateFields = ['createdAt', 'updatedAt'];

  for (const key of Object.keys(obj)) {
    if (dateFields.includes(key) && typeof obj[key] === 'string') {
      (obj as Record<string, unknown>)[key] = new Date(obj[key] as string);
    }
  }

  return obj;
}

/**
 * Deserialize an array of objects with date fields
 */
export function deserializeDatesArray<T extends Record<string, unknown>>(arr: T[]): T[] {
  return arr.map(deserializeDates);
}
