/**
 * Common API types for pagination and filtering
 */

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PersonaListParams {
  teamId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  solutionId?: string;
}

export interface UseCaseListParams {
  teamId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  solutionId?: string;
  personaIds?: string[];
}

export interface FeedbackListParams {
  teamId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  solutionId?: string;
  personaIds?: string[];
  useCaseIds?: string[];
}

export interface OutcomeListParams {
  teamId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  solutionId?: string;
}
