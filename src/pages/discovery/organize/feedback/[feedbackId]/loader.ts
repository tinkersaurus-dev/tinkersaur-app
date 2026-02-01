/**
 * Feedback Detail Page Loader
 * Prefetches feedback with children data for SSR
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/lib/query';
import { queryKeys } from '@/shared/lib/query';
import { feedbackApi } from '@/entities/feedback';
import { STALE_TIMES } from '@/shared/lib/query';

export interface FeedbackDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  feedbackId: string;
}

/**
 * Load feedback with children for feedback-detail page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadFeedbackDetail(feedbackId: string): Promise<FeedbackDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.feedbacks.withChildren(feedbackId),
      queryFn: () => feedbackApi.getWithChildren(feedbackId),
      staleTime: STALE_TIMES.feedbacks,
    });
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    feedbackId,
  };
}
