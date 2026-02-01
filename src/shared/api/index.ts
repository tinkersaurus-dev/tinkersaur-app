/**
 * Shared API Infrastructure
 */

export {
  httpClient,
  ApiError,
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
  setTokenExpiry,
  getTokenExpiry,
  clearAuthToken,
  deserializeDates,
  deserializeDatesArray,
} from './httpClient';

export { ssrHttpClient, SsrApiError } from './ssrHttpClient';

export { createEntityApi } from './createEntityApi';

export type {
  PaginatedResponse,
  SortOrder,
  PersonaListParams,
  UseCaseListParams,
  FeedbackListParams,
  OutcomeListParams,
} from './types';
