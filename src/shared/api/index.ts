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

export {
  createEntityApi,
  createPaginatedEntityApi,
  buildSearchParams,
} from './createEntityApi';

export type { EntityApi, PaginatedEntityApi } from './createEntityApi';

export type {
  PaginatedResponse,
  SortOrder,
  PersonaListParams,
  UserGoalListParams,
  UseCaseListParams,
  FeedbackListParams,
  OutcomeListParams,
} from './types';
