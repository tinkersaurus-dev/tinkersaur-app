/**
 * localStorage utilities for mock API persistence
 */

import type { Diagram } from '../types/Diagram';

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
export function getFromStorage<T extends Record<string, unknown>>(key: string): T[] {
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
    return parsed.map((item: T) => deserializeDates(item));
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

  const keys = ['designWorks', 'diagrams', 'interfaces', 'documents', 'references'];
  keys.forEach((key) => {
    localStorage.removeItem(STORAGE_PREFIX + key);
  });
}

/**
 * Deserialize date strings back to Date objects
 */
function deserializeDates<T extends Record<string, unknown>>(obj: T): T {
  const dateFields = ['createdAt', 'updatedAt'];
  const result = { ...obj } as Record<string, unknown>;

  dateFields.forEach((field) => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string);
    }
  });

  return result as T;
}

/**
 * Validate and repair diagram data structure
 * Ensures critical arrays exist to prevent runtime errors
 */
function validateDiagram(diagram: Partial<Diagram>): Diagram {
  return {
    ...(diagram as Diagram),
    // Ensure shapes array exists
    shapes: Array.isArray(diagram.shapes) ? diagram.shapes : [],
    // Ensure connectors array exists
    connectors: Array.isArray(diagram.connectors) ? diagram.connectors : [],
    // Note: viewport is no longer part of the Diagram entity
    // It's managed by CanvasInstanceStore as ephemeral UI state
  };
}

/**
 * Get diagrams from storage with validation
 * This specialized function ensures all diagrams have required arrays
 */
export function getDiagramsFromStorage(): Diagram[] {
  if (!isBrowser) {
    return [];
  }

  const storageKey = STORAGE_PREFIX + 'diagrams';
  const data = localStorage.getItem(storageKey);

  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);
    // Deserialize dates and validate structure
    return parsed.map((item: Partial<Diagram>) => validateDiagram(deserializeDates(item)));
  } catch (error) {
    console.error(`Error parsing ${storageKey} from localStorage:`, error);
    return [];
  }
}
