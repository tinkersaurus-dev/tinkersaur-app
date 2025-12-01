/**
 * Solution Management API Layer
 * Mock API clients with localStorage persistence
 */

import { initializeMockData } from './storage';

// Initialize mock data on module load
initializeMockData();

// Export API clients
export { organizationApi } from './organizationApi';
export { teamApi } from './teamApi';
export { userApi } from './userApi';
export { solutionApi } from './solutionApi';
export { useCaseApi } from './useCaseApi';
export { requirementApi } from './requirementApi';
export { personaApi } from './personaApi';
export { personaUseCaseApi } from './personaUseCaseApi';
