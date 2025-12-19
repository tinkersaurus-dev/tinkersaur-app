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

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
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
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
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
    // Handle 401 Unauthorized - clear token
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
