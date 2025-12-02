const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
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
