/**
 * Organize Page
 * Dashboard view showing recently added personas, use cases, feedback, and outcomes.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, PageContent, Card } from '@/shared/ui';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { queryKeys } from '@/shared/lib/query';
import { usePersonasQuery } from '@/entities/persona';
import { useUseCasesByTeamQuery } from '@/entities/use-case';
import {
  useFeedbacksQuery,
  useOutcomesQuery,
  DashboardListSection,
  PersonaRow,
  UseCaseRow,
  FeedbackRow,
  OutcomeRow,
  PersonaIcon,
  UseCaseIcon,
  FeedbackIcon,
  OutcomeIcon,
} from '@/features/intake-analysis';

const MAX_ITEMS = 10;

export default function OrganizePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

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

  const recentPersonas = personas.slice(0, MAX_ITEMS);
  const recentUseCases = useCases.slice(0, MAX_ITEMS);
  const recentFeedbacks = feedbacks.slice(0, MAX_ITEMS);
  const recentOutcomes = outcomes.slice(0, MAX_ITEMS);

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
        <div className="h-full flex gap-2">
          {/* Left: Personas + Outcomes (1/3 width) */}
          <div className="w-1/3 flex flex-col gap-6 min-h-0">
            {/* Personas (1/2 height) */}
            <Card className="h-1/2 min-h-0 flex flex-col" contentClassName="flex-1 min-h-0 p-0">
              <DashboardListSection
                title="Recent Personas"
                icon={<PersonaIcon />}
                isEmpty={recentPersonas.length === 0}
                isLoading={personasLoading}
                emptyDescription="No personas added yet"
                viewAllLink="/discovery/organize/personas"
              >
                {recentPersonas.map((persona) => (
                  <PersonaRow key={persona.id} persona={persona} />
                ))}
              </DashboardListSection>
            </Card>

            {/* Outcomes (1/2 height) */}
            <Card className="h-1/2 min-h-0 flex flex-col" contentClassName="flex-1 min-h-0 p-0">
              <DashboardListSection
                title="Recent Outcomes"
                icon={<OutcomeIcon />}
                isEmpty={recentOutcomes.length === 0}
                isLoading={outcomesLoading}
                emptyDescription="No outcomes added yet"
                viewAllLink="/discovery/organize/outcomes"
              >
                {recentOutcomes.map((outcome) => (
                  <OutcomeRow key={outcome.id} outcome={outcome} />
                ))}
              </DashboardListSection>
            </Card>
          </div>

          {/* Right: Use Cases + Feedback (2/3 width) */}
          <div className="w-2/3 flex flex-col gap-6 min-h-0">
            {/* Use Cases (1/3 height) */}
            <Card className="h-1/3 min-h-0 flex flex-col" contentClassName="flex-1 min-h-0 p-0">
              <DashboardListSection
                title="Recent Use Cases"
                icon={<UseCaseIcon />}
                isEmpty={recentUseCases.length === 0}
                isLoading={useCasesLoading}
                emptyDescription="No use cases added yet"
                viewAllLink="/discovery/organize/use-cases"
              >
                {recentUseCases.map((useCase) => (
                  <UseCaseRow key={useCase.id} useCase={useCase} />
                ))}
              </DashboardListSection>
            </Card>

            {/* Feedback (2/3 height) */}
            <Card className="flex-1 min-h-0 flex flex-col" contentClassName="flex-1 min-h-0 p-0">
              <DashboardListSection
                title="Recent Feedback"
                icon={<FeedbackIcon />}
                isEmpty={recentFeedbacks.length === 0}
                isLoading={feedbacksLoading}
                emptyDescription="No feedback added yet"
                viewAllLink="/discovery/organize/feedback"
              >
                {recentFeedbacks.map((feedback) => (
                  <FeedbackRow key={feedback.id} feedback={feedback} />
                ))}
              </DashboardListSection>
            </Card>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
