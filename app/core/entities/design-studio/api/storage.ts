/**
 * localStorage utilities for mock API persistence
 */

const STORAGE_PREFIX = 'tinkersaur_ds_';

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Simulates network delay for realistic API behavior
 */
export async function simulateDelay(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get data from localStorage
 */
export function getFromStorage<T>(key: string): T[] {
  if (!isBrowser) {
    return [];
  }

  const storageKey = STORAGE_PREFIX + key;
  const data = localStorage.getItem(storageKey);

  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);
    // Deserialize dates
    return parsed.map((item: any) => deserializeDates(item));
  } catch (error) {
    console.error(`Error parsing ${storageKey} from localStorage:`, error);
    return [];
  }
}

/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: string, data: T[]): void {
  if (!isBrowser) {
    return;
  }

  const storageKey = STORAGE_PREFIX + key;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${storageKey} to localStorage:`, error);
  }
}

/**
 * Clear all design studio data from localStorage
 */
export function clearAllStorage(): void {
  if (!isBrowser) {
    return;
  }

  const keys = ['designWorks', 'diagrams', 'interfaces', 'documents'];
  keys.forEach((key) => {
    localStorage.removeItem(STORAGE_PREFIX + key);
  });
}

/**
 * Deserialize date strings back to Date objects
 */
function deserializeDates<T extends Record<string, any>>(obj: T): T {
  const dateFields = ['createdAt', 'updatedAt'];
  const result = { ...obj };

  dateFields.forEach((field) => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field]);
    }
  });

  return result;
}
