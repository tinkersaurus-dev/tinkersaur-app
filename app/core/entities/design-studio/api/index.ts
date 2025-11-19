/**
 * Design Studio API Layer
 *
 * This module exports all API clients for the Design Studio entities.
 * These clients handle data persistence and can be swapped for real backend APIs.
 */

export { designWorkApi } from './designWorkApi';
export { diagramApi } from './diagramApi';
export { interfaceApi } from './interfaceApi';
export { documentApi } from './documentApi';
export { initializeMockData } from './mockData';
