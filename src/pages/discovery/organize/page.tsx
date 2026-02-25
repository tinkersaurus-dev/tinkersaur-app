/**
 * Organize Page
 * Dashboard surfacing data quality issues via a rules engine.
 * Banners, attention cards, and stats are all config-driven (see rules.tsx).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, PageContent, Button } from '@/shared/ui';
import { useAuthStore } from '@/shared/auth';
import { queryKeys } from '@/shared/lib/query';
import { useSolutionStore } from '@/entities/solution';
import { usePersonasQuery } from '@/entities/persona';
import { useUserGoalsByTeamQuery } from '@/entities/user-goal';
import { useFeedbacksQuery } from '@/entities/feedback';
import { useOutcomesQuery } from '@/entities/outcome';
import {
  useDashboardData,
  DashboardBanner,
  QuickStatsStrip,
  AttentionGrid,
  ActivityFeed,
} from '@/features/organize-dashboard';

export default function OrganizePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;
  const contextSolutionId = useSolutionStore((s) => s.selectedSolution?.solutionId);

  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Refresh all dashboard data when the page is opened
  useEffect(() => {
    if (teamId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.all });
    }
  }, [queryClient, teamId]);

  const { data: personas = [], isLoading: personasLoading } =
    usePersonasQuery(teamId, contextSolutionId);
  const { data: userGoals = [], isLoading: userGoalsLoading } =
    useUserGoalsByTeamQuery(teamId, contextSolutionId);
  const { data: feedbacks = [], isLoading: feedbacksLoading } =
    useFeedbacksQuery(teamId, contextSolutionId);
  const { data: outcomes = [], isLoading: outcomesLoading } =
    useOutcomesQuery(teamId, contextSolutionId);

  const isLoading =
    personasLoading || userGoalsLoading || feedbacksLoading || outcomesLoading;

  const dashboard = useDashboardData({ personas, userGoals, feedbacks, outcomes });

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Organize"
        actions={
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => navigate('/discovery/intake')}
          >
            Start a New Intake
          </Button>
        }
      />
      <PageContent fillHeight>
        <div className="space-y-6 overflow-y-auto h-full pr-1">
          {/* Banner */}
          {!bannerDismissed && dashboard.bannerResult && (
            <DashboardBanner
              template={dashboard.bannerResult.rule.bannerTemplate!}
              count={dashboard.bannerResult.count}
              actionLink={dashboard.bannerResult.rule.actionLink}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}

          {/* Quick Stats */}
          <QuickStatsStrip stats={dashboard.stats} isLoading={isLoading} />

          {/* Needs Attention */}
          <AttentionGrid ruleResults={dashboard.ruleResults} />

          {/* Activity Feed */}
          <ActivityFeed activities={dashboard.activities} />
        </div>
      </PageContent>
    </div>
  );
}
