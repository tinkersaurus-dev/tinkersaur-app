/**
 * Solution Management API Layer
 * Mock API clients with localStorage persistence
 */

import { initializeMockData } from './storage';

// Initialize mock data on module load
initializeMockData();

// Export API clients
export { solutionApi } from './solutionApi';
export { featureApi } from './featureApi';
export { changeApi } from './changeApi';
export { requirementApi } from './requirementApi';
