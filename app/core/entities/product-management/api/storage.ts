import type { Solution, Feature, Change, Requirement } from '../types';

/**
 * localStorage utilities for mock API persistence
 */

const STORAGE_PREFIX = 'tinkersaur_pm_';

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
 * Clear all solution management data from localStorage
 */
export function clearAllStorage(): void {
  if (!isBrowser) {
    return;
  }

  const keys = ['solutions', 'features', 'changes', 'requirements'];
  keys.forEach((key) => {
    localStorage.removeItem(STORAGE_PREFIX + key);
  });
}

/**
 * Deserialize date strings back to Date objects
 */
function deserializeDates<T extends Record<string, unknown>>(obj: T): T {
  const dateFields = ['createdAt', 'updatedAt', 'lockedAt'];
  const result = { ...obj } as Record<string, unknown>;

  dateFields.forEach((field) => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string);
    }
  });

  return result as T;
}

/**
 * Initialize localStorage with mock data if empty
 */
export function initializeMockData(): void {
  // Skip if not in browser
  if (!isBrowser) {
    return;
  }

  // Only initialize if storage is empty
  if (getFromStorage('solutions').length > 0) {
    return;
  }

  // Mock solutions
  const mockSolutions: Solution[] = [
    {
      id: 'sol-1',
      organizationId: 'org-1',
      name: 'Customer Portal',
      description: 'Self-service portal for customers to manage their accounts',
      type: 'product',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'sol-2',
      organizationId: 'org-1',
      name: 'Admin Dashboard',
      description: 'Internal dashboard for managing users and configurations',
      type: 'product',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
  ];

  // Mock features
  const mockFeatures: Feature[] = [
    {
      id: 'feat-1',
      solutionId: 'sol-1',
      name: 'User Authentication',
      description: 'Login, logout, password reset functionality',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
    },
    {
      id: 'feat-2',
      solutionId: 'sol-1',
      name: 'Profile Management',
      description: 'Users can view and edit their profile information',
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
    },
    {
      id: 'feat-3',
      solutionId: 'sol-2',
      name: 'User Management',
      description: 'Admin can create, update, and delete users',
      createdAt: new Date('2024-02-02'),
      updatedAt: new Date('2024-02-02'),
    },
  ];

  // Mock changes
  const mockChanges: Change[] = [
    {
      id: 'change-1',
      featureId: 'feat-1',
      name: 'Initial Authentication Implementation',
      description: 'Basic login and logout functionality',
      status: 'implemented',
      version: '1.0.0',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'change-2',
      featureId: 'feat-1',
      name: 'Add Password Reset',
      description: 'Email-based password reset flow',
      status: 'in-design',
      version: '1.1.0',
      parentChangeId: 'change-1',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
    },
    {
      id: 'change-3',
      featureId: 'feat-2',
      name: 'Profile Page UI',
      description: 'Initial profile page with view mode',
      status: 'draft',
      version: '1.0.0',
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-15'),
    },
  ];

  // Mock requirements
  const mockRequirements: Requirement[] = [
    {
      id: 'req-1',
      changeId: 'change-2',
      text: 'User must be able to request a password reset via email',
      type: 'functional',
      priority: 1,
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
    {
      id: 'req-2',
      changeId: 'change-2',
      text: 'Reset link must expire after 24 hours',
      type: 'functional',
      priority: 2,
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
    {
      id: 'req-3',
      changeId: 'change-2',
      text: 'System must validate new password meets complexity requirements',
      type: 'constraint',
      priority: 1,
      createdAt: new Date('2024-02-11'),
      updatedAt: new Date('2024-02-11'),
    },
  ];

  // Save all mock data
  saveToStorage('solutions', mockSolutions);
  saveToStorage('features', mockFeatures);
  saveToStorage('changes', mockChanges);
  saveToStorage('requirements', mockRequirements);
}
