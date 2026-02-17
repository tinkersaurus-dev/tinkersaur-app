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
import { useAuthStore } from '@/features/auth';
import { queryKeys } from '@/shared/lib/query';
import { usePersonasQuery } from '@/entities/persona';
import { useUseCasesByTeamQuery } from '@/entities/use-case';
import { useFeedbacksQuery } from '@/entities/feedback';
import { useOutcomesQuery } from '@/entities/outcome';
import { useDashboardData } from './useDashboardData';
import {
  DashboardBanner,
  QuickStatsStrip,
  AttentionGrid,
  ActivityFeed,
} from './components';

export default function OrganizePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Refresh all dashboard data when the page is opened
  useEffect(() => {
    if (teamId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.list(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.listByTeam(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.list(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.list(teamId) });
    }
  }, [queryClient, teamId]);

  const { data: personas = [], isLoading: personasLoading } =
    usePersonasQuery(teamId);
  const { data: useCases = [], isLoading: useCasesLoading } =
    useUseCasesByTeamQuery(teamId);
  const { data: feedbacks = [], isLoading: feedbacksLoading } =
    useFeedbacksQuery(teamId);
  const { data: outcomes = [], isLoading: outcomesLoading } =
    useOutcomesQuery(teamId);

  const isLoading =
    personasLoading || useCasesLoading || feedbacksLoading || outcomesLoading;

  const dashboard = useDashboardData({ personas, useCases, feedbacks, outcomes });

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
