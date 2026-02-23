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
  userGoals: 5 * 60 * 1000,     // 5 min - discovery data
  useCases: 5 * 60 * 1000,      // 5 min
  requirements: 5 * 60 * 1000,  // 5 min
  personas: 10 * 60 * 1000,     // 10 min - reference data
  organizations: 10 * 60 * 1000, // 10 min
  teams: 10 * 60 * 1000,        // 10 min
  users: 10 * 60 * 1000,        // 10 min
  currentUser: 30 * 60 * 1000,  // 30 min - auth data
  tags: 10 * 60 * 1000,         // 10 min - reference data
  feedbacks: 5 * 60 * 1000,     // 5 min - discovery data
  outcomes: 5 * 60 * 1000,      // 5 min - discovery data
  intakeSources: 10 * 60 * 1000, // 10 min - reference data
  personaUseCases: 5 * 60 * 1000, // 5 min - junction data
  feedbackPersonas: 5 * 60 * 1000, // 5 min - junction data
  feedbackUseCases: 5 * 60 * 1000, // 5 min - junction data
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
 * Check if an error is an auth error that shouldn't be retried
 */
function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('401') || message.includes('403') ||
           message.includes('unauthorized') || message.includes('forbidden');
  }
  return false;
}

/**
 * Create and configure the QueryClient with global defaults
 * @param isServer - Whether this is running on the server (SSR)
 */
export function createQueryClient(isServer = false): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - can be overridden per query
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Retry configuration - disabled during SSR to avoid delays
        // Don't retry auth errors (401/403) since they won't succeed without login
        retry: isServer ? false : (failureCount, error) => {
          if (isAuthError(error)) return false;
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch behavior
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Keep previous data while loading new
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Retry mutations on failure (but not auth errors)
        retry: (failureCount, error) => {
          if (isAuthError(error)) return false;
          return failureCount < 1;
        },
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
  // Server: always create a new query client with retries disabled
  if (typeof window === 'undefined') {
    return createQueryClient(true);
  }

  // Browser: reuse the same query client with retries enabled
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient(false);
  }

  return browserQueryClient;
}
