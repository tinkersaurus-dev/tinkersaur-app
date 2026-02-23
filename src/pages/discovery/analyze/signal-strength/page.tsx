/**
 * Signal Strength Page
 * Three-column view showing tag-based signal strength,
 * persona/user-goal pain radars, and filtered feedback.
 */

import { useMemo } from 'react';
import { PageHeader, PageContent, Spinner, Empty } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useFeedbacksQuery } from '@/entities/feedback';
import { useTagsQuery } from '@/entities/tag';
import { usePersonasQuery } from '@/entities/persona';
import { useUserGoalsByTeamQuery } from '@/entities/user-goal';
import {
  useSignalStrengthData,
  useSignalStrengthFilterState,
  useFilteredFeedback,
  TagSignalCard,
  PainRadar,
  SignalFeedbackList,
} from '@/features/signal-strength';

export default function SignalStrengthPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // Data fetching
  const { data: allFeedback = [], isLoading: feedbackLoading } = useFeedbacksQuery(teamId);
  const { data: tags = [] } = useTagsQuery(teamId);
  const { data: personas = [] } = usePersonasQuery(teamId);
  const { data: userGoals = [] } = useUserGoalsByTeamQuery(teamId);

  // Signal strength computation
  const tagSignals = useSignalStrengthData(allFeedback, tags);

  // Filter state
  const { selectedTag, toggleTag, clearTag } = useSignalStrengthFilterState();

  // Child count map (for feedback list display)
  const childCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of allFeedback) {
      if (f.parentFeedbackId) {
        map.set(f.parentFeedbackId, (map.get(f.parentFeedbackId) ?? 0) + 1);
      }
    }
    return map;
  }, [allFeedback]);

  // Filtered data based on selected tag
  const {
    filteredParents,
    personaRadarData,
    userGoalRadarData,
    maxRadarCount,
  } = useFilteredFeedback(allFeedback, personas, userGoals, selectedTag);

  return (
    <>
      <PageHeader title="Signal Strength" />

      <PageContent>
        {!teamId ? (
          <Empty description="No team selected. Please create an organization and team first." />
        ) : feedbackLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="flex gap-4 h-[calc(100vh-140px)] overflow-hidden">
            {/* Left Column: Tag Signal Cards */}
            <div className="w-[260px] shrink-0 overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--text)]">
                  Tags
                </h2>
                {selectedTag && (
                  <button
                    onClick={clearTag}
                    className="text-[10px] text-[var(--primary)] hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              {tagSignals.length === 0 ? (
                <Empty description="No tags found." />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {tagSignals.map((signal) => (
                    <TagSignalCard
                      key={signal.tagName}
                      signal={signal}
                      isSelected={selectedTag === signal.tagName}
                      onClick={() => toggleTag(signal.tagName)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Middle Column: Pain Radars */}
            <div className="flex-1 min-w-0 overflow-y-auto space-y-4">
              <PainRadar
                title="Persona Pain Radar"
                badge={`${personaRadarData.length} personas`}
                data={personaRadarData}
                maxCount={maxRadarCount}
              />
              <PainRadar
                title="User Goal Pain Radar"
                badge={`${userGoalRadarData.length} user goals`}
                data={userGoalRadarData}
                maxCount={maxRadarCount}
              />
            </div>

            {/* Right Column: Feedback List */}
            <div className="w-[360px] shrink-0 overflow-y-auto pl-1">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
                Feedback
                {selectedTag && (
                  <span className="text-[var(--text-muted)] font-normal ml-1.5">
                    tagged &ldquo;{selectedTag}&rdquo;
                  </span>
                )}
              </h2>
              <SignalFeedbackList
                feedback={filteredParents}
                childCountMap={childCountMap}
              />
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
