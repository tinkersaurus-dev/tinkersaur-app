/**
 * Hook for fetching and filtering feedback (suggestions & problems) for a user goal
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useFeedbacksPaginatedQuery } from '@/entities/feedback';
import { queryKeys } from '@/shared/lib/query';
import { intakeSourceApi } from '@/entities/intake-source';
import { SOURCE_TYPES, type SourceTypeKey } from '@/entities/source-type';
import type { Feedback } from '@/entities/feedback';
import type { QuoteWithSource } from '@/entities/quote';

export interface FeedbackRow {
  id: string;
  content: string;
  quotes: QuoteWithSource[];
  sourceName: string;
  weight: number;
}

export interface UserGoalFeedbackResult {
  suggestions: FeedbackRow[];
  problems: FeedbackRow[];
  suggestionsCount: number;
  problemsCount: number;
  isLoading: boolean;
}

export function useUserGoalFeedback(
  teamId: string | undefined,
  userGoalId: string | undefined,
): UserGoalFeedbackResult {
  const { data: feedbackData, isLoading: isFeedbackLoading } = useFeedbacksPaginatedQuery(
    teamId && userGoalId
      ? {
          teamId,
          userGoalIds: [userGoalId],
          pageSize: 100,
        }
      : null,
  );

  const rawSuggestions = useMemo(
    () => feedbackData?.items.filter((f: Feedback) => f.type === 'suggestion') ?? [],
    [feedbackData],
  );
  const rawProblems = useMemo(
    () => feedbackData?.items.filter((f: Feedback) => f.type === 'problem') ?? [],
    [feedbackData],
  );

  // Get unique intake source IDs from feedback
  const feedbackIntakeSourceIds = useMemo(() => {
    const ids = new Set<string>();
    feedbackData?.items.forEach((f: Feedback) => {
      if (f.intakeSourceId) {
        ids.add(f.intakeSourceId);
      }
    });
    return Array.from(ids);
  }, [feedbackData]);

  // Fetch intake sources for feedback
  const feedbackIntakeSourceQueries = useQueries({
    queries: feedbackIntakeSourceIds.map((id: string) => ({
      queryKey: queryKeys.intakeSources.detail(id),
      queryFn: () => intakeSourceApi.get(id),
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    })),
  });

  // Create a map of intakeSourceId -> display name for feedback
  const feedbackIntakeSourceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    feedbackIntakeSourceQueries.forEach((query, index) => {
      if (query.data) {
        const source = query.data;
        if (source.meetingName) {
          map[feedbackIntakeSourceIds[index]] = source.meetingName;
        } else if (source.surveyName) {
          map[feedbackIntakeSourceIds[index]] = source.surveyName;
        } else if (source.ticketId) {
          map[feedbackIntakeSourceIds[index]] = `Ticket ${source.ticketId}`;
        } else {
          const sourceType = source.sourceType as SourceTypeKey;
          map[feedbackIntakeSourceIds[index]] = SOURCE_TYPES[sourceType]?.label || sourceType;
        }
      }
    });
    return map;
  }, [feedbackIntakeSourceQueries, feedbackIntakeSourceIds]);

  const suggestions = useMemo(
    (): FeedbackRow[] => {
      return rawSuggestions
        .map((f: Feedback) => ({
          id: f.id,
          content: f.content,
          quotes: f.quotes,
          sourceName: f.intakeSourceId ? feedbackIntakeSourceNameMap[f.intakeSourceId] || '—' : '—',
          weight: f.weight,
        }))
        .sort((a, b) => b.weight - a.weight);
    },
    [rawSuggestions, feedbackIntakeSourceNameMap],
  );

  const problems = useMemo(
    (): FeedbackRow[] => {
      return rawProblems
        .map((f: Feedback) => ({
          id: f.id,
          content: f.content,
          quotes: f.quotes,
          sourceName: f.intakeSourceId ? feedbackIntakeSourceNameMap[f.intakeSourceId] || '—' : '—',
          weight: f.weight,
        }))
        .sort((a, b) => b.weight - a.weight);
    },
    [rawProblems, feedbackIntakeSourceNameMap],
  );

  const isLoading = isFeedbackLoading || feedbackIntakeSourceQueries.some((q) => q.isLoading);

  return {
    suggestions,
    problems,
    suggestionsCount: rawSuggestions.length,
    problemsCount: rawProblems.length,
    isLoading,
  };
}
