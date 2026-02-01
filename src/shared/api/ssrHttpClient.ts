/**
 * SSR-compatible HTTP client for use in route loaders
 * Uses process.env for server-side, falls back to import.meta.env for client
 */

function getApiBaseUrl(): string {
  // Server-side: use process.env
  if (typeof process !== 'undefined' && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // Client-side: use import.meta.env
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
}

export class SsrApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'SsrApiError';
  }
}

async function ssrRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new SsrApiError(response.status, `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const ssrHttpClient = {
  get: <T>(url: string) => ssrRequest<T>(url),
};
