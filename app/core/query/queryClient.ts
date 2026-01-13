import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Stale time configuration by entity type
 */
export const STALE_TIMES = {
  diagrams: 2 * 60 * 1000,      // 2 min - actively edited
  designWorks: 2 * 60 * 1000,   // 2 min - actively edited
  documents: 2 * 60 * 1000,     // 2 min - actively edited
  interfaces: 2 * 60 * 1000,    // 2 min - actively edited
  references: 2 * 60 * 1000,    // 2 min - actively edited
  solutions: 5 * 60 * 1000,     // 5 min
  solutionFactors: 5 * 60 * 1000, // 5 min - strategy data
  useCases: 5 * 60 * 1000,      // 5 min
  requirements: 5 * 60 * 1000,  // 5 min
  personas: 10 * 60 * 1000,     // 10 min - reference data
  organizations: 10 * 60 * 1000, // 10 min
  teams: 10 * 60 * 1000,        // 10 min
  users: 10 * 60 * 1000,        // 10 min
  currentUser: 30 * 60 * 1000,  // 30 min - auth data
  feedbacks: 5 * 60 * 1000,     // 5 min - discovery data
  outcomes: 5 * 60 * 1000,      // 5 min - discovery data
} as const;

/**
 * Refetch interval configuration for background polling
 */
export const REFETCH_INTERVALS = {
  diagrams: 3 * 60 * 1000,      // 3 min - actively edited
  designWorks: 3 * 60 * 1000,   // 3 min - actively edited
  documents: 3 * 60 * 1000,     // 3 min - actively edited
  interfaces: 3 * 60 * 1000,    // 3 min - actively edited
  references: 3 * 60 * 1000,    // 3 min - actively edited
} as const;

/**
 * Global error handler for mutations
 */
function handleMutationError(error: Error) {
  console.error('Mutation error:', error);
  toast.error(error.message || 'An error occurred while saving data');
}

/**
 * Create and configure the QueryClient with global defaults
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - can be overridden per query
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Retry configuration with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch behavior
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Keep previous data while loading new
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Retry mutations on failure
        retry: 1,
        retryDelay: 1000,
        onError: handleMutationError,
      },
    },
  });
}

/**
 * Singleton query client for SSR prefetching in loaders
 * This ensures the same client is used across server and client
 */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  // Server: always create a new query client
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  // Browser: reuse the same query client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}
