/**
 * Heatmap Page
 * Heatmap visualization of feedback collected during intake.
 * Uses opacity to represent feedback density per type per time period.
 */

import { useMemo } from 'react';
import { PageHeader, PageContent, Card, Spinner, Empty } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useFeedbacksQuery, useFeedbackWithChildrenQuery } from '@/entities/feedback';
import { useSolutionsQuery } from '@/entities/solution';
import { useTagsQuery } from '@/entities/tag';
import { useIntakeSourceDetailsQuery } from '@/entities/intake-source';
import type { SelectOption, MultiSelectOption } from '@/shared/ui';
import { type Feedback } from '@/entities/feedback';
import { useAnalyzeFilterState } from '@/features/feedback-analysis/lib/useAnalyzeFilterState';
import { useTimelineBuckets } from '@/features/feedback-analysis/lib/useTimelineBuckets';
import { FeedbackAnalysisFilters } from '@/features/feedback-analysis/ui/FeedbackAnalysisFilters';
import { FeedbackHeatmap } from '@/features/feedback-analysis/ui/FeedbackHeatmap';
import { FeedbackAnalysisList } from '@/features/feedback-analysis/ui/FeedbackAnalysisList';

export default function HeatmapPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // Data fetching
  const { data: allFeedback = [], isLoading: feedbackLoading } = useFeedbacksQuery(teamId);
  const { data: solutions = [] } = useSolutionsQuery(teamId);
  const { data: tags = [] } = useTagsQuery(teamId);

  // Filter state
  const filters = useAnalyzeFilterState();

  // Fetch intake source details for date resolution and display
  const intakeSourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of allFeedback) {
      if (f.intakeSourceId) ids.add(f.intakeSourceId);
    }
    return ids.size > 0 ? Array.from(ids) : undefined;
  }, [allFeedback]);
  const { dataMap: intakeSourceMap, nameMap: intakeSourceNameMap } =
    useIntakeSourceDetailsQuery(intakeSourceIds);

  // Build a map of intakeSourceId -> date string for timeline bucketing
  const intakeSourceDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [id, source] of Object.entries(intakeSourceMap)) {
      if (source.date) {
        map[id] = source.date;
      }
    }
    return map;
  }, [intakeSourceMap]);

  // Compute child counts from the data (weight field is not reliably populated by the API)
  const childCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of allFeedback) {
      if (f.parentFeedbackId) {
        map.set(f.parentFeedbackId, (map.get(f.parentFeedbackId) ?? 0) + 1);
      }
    }
    return map;
  }, [allFeedback]);

  // Fetch children when a parent feedback is selected
  const selectedFeedback = useMemo(
    () => allFeedback.find((f) => f.id === filters.selectedFeedbackId) ?? null,
    [allFeedback, filters.selectedFeedbackId],
  );
  const isParentSelected =
    selectedFeedback !== null && (childCountMap.get(selectedFeedback.id) ?? 0) > 0;
  const { data: feedbackWithChildren } = useFeedbackWithChildrenQuery(
    isParentSelected ? filters.selectedFeedbackId! : undefined,
  );

  // Build the set of IDs to show when a feedback is selected
  const selectedFeedbackIds = useMemo(() => {
    if (!filters.selectedFeedbackId) return null;

    if (isParentSelected && feedbackWithChildren) {
      return new Set([
        feedbackWithChildren.id,
        ...feedbackWithChildren.children.map((c) => c.id),
      ]);
    }

    // Individual feedback — just the one
    return new Set([filters.selectedFeedbackId]);
  }, [filters.selectedFeedbackId, isParentSelected, feedbackWithChildren]);

  // Apply filters to get chart feedback (includes children for chart data)
  const chartFeedback = useMemo(() => {
    let result: Feedback[] = allFeedback;

    // Type filter
    if (filters.selectedTypes.length > 0) {
      result = result.filter((f) => filters.selectedTypes.includes(f.type));
    }

    // Tag filter (OR logic: feedback matches if it has ANY selected tag)
    if (filters.selectedTags.length > 0) {
      result = result.filter((f) =>
        f.tags.some((tag) => filters.selectedTags.includes(tag)),
      );
    }

    // Solution filter
    if (filters.selectedSolutionId) {
      result = result.filter((f) => f.solutionId === filters.selectedSolutionId);
    }

    // Feedback selection filter (narrows to specific feedback + children)
    if (selectedFeedbackIds) {
      result = result.filter((f) => selectedFeedbackIds.has(f.id));
    }

    return result;
  }, [allFeedback, filters.selectedTypes, filters.selectedTags, filters.selectedSolutionId, selectedFeedbackIds]);

  // Apply filters for the list (excludes the feedback selection filter — list always shows all so user can pick)
  const listFeedback = useMemo(() => {
    let result: Feedback[] = allFeedback;

    if (filters.selectedTypes.length > 0) {
      result = result.filter((f) => filters.selectedTypes.includes(f.type));
    }

    if (filters.selectedTags.length > 0) {
      result = result.filter((f) =>
        f.tags.some((tag) => filters.selectedTags.includes(tag)),
      );
    }

    if (filters.selectedSolutionId) {
      result = result.filter((f) => f.solutionId === filters.selectedSolutionId);
    }

    return result;
  }, [allFeedback, filters.selectedTypes, filters.selectedTags, filters.selectedSolutionId]);

  // Compute timeline buckets from chart feedback (prefer intake source date)
  const buckets = useTimelineBuckets(chartFeedback, filters.granularity, intakeSourceDateMap);

  // Solution options for filter
  const solutionOptions: SelectOption[] = useMemo(
    () => solutions.map((s) => ({ value: s.id, label: s.name })),
    [solutions],
  );

  // Tag options for filter (use name as value since Feedback.tags stores names)
  const tagOptions: MultiSelectOption[] = useMemo(
    () => tags.map((t) => ({ value: t.name, label: t.name })),
    [tags],
  );

  return (
    <>
      <PageHeader title="Heatmap" />

      <PageContent>
        {!teamId ? (
          <Empty description="No team selected. Please create an organization and team first." />
        ) : feedbackLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <FeedbackAnalysisFilters
              selectedTypes={filters.selectedTypes}
              onTypesChange={filters.setSelectedTypes}
              selectedTags={filters.selectedTags}
              onTagsChange={filters.setSelectedTags}
              tagOptions={tagOptions}
              selectedSolutionId={filters.selectedSolutionId}
              onSolutionChange={filters.setSelectedSolutionId}
              granularity={filters.granularity}
              onGranularityChange={filters.setGranularity}
              solutionOptions={solutionOptions}
              hasActiveFilters={filters.hasActiveFilters}
              onClearAll={filters.clearAll}
              selectedFeedbackContent={selectedFeedback?.content ?? null}
              onClearFeedbackSelection={() => filters.setSelectedFeedbackId(null)}
              direction="horizontal"
            />

            <div className="flex gap-6">
              <Card shadow={false} className="flex-1 min-w-0 border-none">
                <FeedbackHeatmap
                  buckets={buckets}
                  selectedTypes={filters.selectedTypes}
                />
              </Card>

              <div className="w-[600px] shrink-0">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
                  Feedback
                </h2>
                <FeedbackAnalysisList
                  feedback={listFeedback}
                  childCountMap={childCountMap}
                  selectedFeedbackId={filters.selectedFeedbackId}
                  onFeedbackClick={filters.setSelectedFeedbackId}
                  intakeSourceMap={intakeSourceMap}
                  intakeSourceNameMap={intakeSourceNameMap}
                  gridClassName="grid-cols-1 md:grid-cols-2"
                />
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
