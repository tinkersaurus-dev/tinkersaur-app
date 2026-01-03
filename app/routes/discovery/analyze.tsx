/**
 * Analyze Page
 * Dashboard view showing recently added personas, use cases, and feedback.
 */

import { MainLayout } from '~/core/components/MainLayout';
import { PageHeader } from '~/core/components/PageHeader';
import { PageContent } from '~/core/components/PageContent';
import { useAuthStore } from '~/core/auth/useAuthStore';
import { usePersonasQuery } from '~/product-management/queries';
import { useUseCasesByTeamQuery } from '~/product-management/queries';
import { useFeedbacksQuery } from '~/discovery/hooks';
import {
  DashboardListSection,
  PersonaRow,
  UseCaseRow,
  FeedbackRow,
  PersonaIcon,
  UseCaseIcon,
  FeedbackIcon,
} from '~/discovery/components';

const MAX_ITEMS = 10;

export default function AnalyzePage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  const { data: personas = [], isLoading: personasLoading } =
    usePersonasQuery(teamId);
  const { data: useCases = [], isLoading: useCasesLoading } =
    useUseCasesByTeamQuery(teamId);
  const { data: feedbacks = [], isLoading: feedbacksLoading } =
    useFeedbacksQuery(teamId);

  const recentPersonas = personas.slice(0, MAX_ITEMS);
  const recentUseCases = useCases.slice(0, MAX_ITEMS);
  const recentFeedbacks = feedbacks.slice(0, MAX_ITEMS);

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <PageHeader title="Analyze" />
        <PageContent fillHeight>
          <div className="h-full flex gap-2">
            {/* Left: Personas (1/3 width) */}
            <div className="w-1/3 flex flex-col min-h-0">
              <DashboardListSection
                title="Recent Personas"
                icon={<PersonaIcon />}
                isEmpty={recentPersonas.length === 0}
                isLoading={personasLoading}
                emptyDescription="No personas added yet"
              >
                {recentPersonas.map((persona) => (
                  <PersonaRow key={persona.id} persona={persona} />
                ))}
              </DashboardListSection>
            </div>

            {/* Right: Use Cases + Feedback (2/3 width) */}
            <div className="w-2/3 flex flex-col gap-6 min-h-0">
              {/* Use Cases (1/3 height) */}
              <div className="h-1/3 min-h-0">
                <DashboardListSection
                  title="Recent Use Cases"
                  icon={<UseCaseIcon />}
                  isEmpty={recentUseCases.length === 0}
                  isLoading={useCasesLoading}
                  emptyDescription="No use cases added yet"
                >
                  {recentUseCases.map((useCase) => (
                    <UseCaseRow key={useCase.id} useCase={useCase} />
                  ))}
                </DashboardListSection>
              </div>

              {/* Feedback (2/3 height) */}
              <div className="flex-1 min-h-0">
                <DashboardListSection
                  title="Recent Feedback"
                  icon={<FeedbackIcon />}
                  isEmpty={recentFeedbacks.length === 0}
                  isLoading={feedbacksLoading}
                  emptyDescription="No feedback added yet"
                >
                  {recentFeedbacks.map((feedback) => (
                    <FeedbackRow key={feedback.id} feedback={feedback} />
                  ))}
                </DashboardListSection>
              </div>
            </div>
          </div>
        </PageContent>
      </div>
    </MainLayout>
  );
}
