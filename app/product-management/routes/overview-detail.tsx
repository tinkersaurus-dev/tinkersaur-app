/**
 * Solution Overview Detail Page
 * Displays the five editable markdown sections for solution overview
 */

import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FiHome } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { Breadcrumb } from '~/core/components/ui';
import { EditableMarkdownSection } from '~/core/components/ui/EditableMarkdownSection';
import { useSolutionQuery } from '../queries';
import { useSolutionOverviewQuery } from '../queries/useSolutionOverviewQuery';
import { useUpdateSolutionOverview } from '../mutations/useSolutionOverviewMutations';
import { useSolutionStore } from '~/core/solution';
import { useGenerateOverviewSection } from '../hooks';
import { OverviewGenerateModal } from '../components/OverviewGenerateModal';
import type { OverviewSectionType } from '~/design-studio/lib/llm/prompts/overview-prompts';

// Section configuration for DRY rendering
const OVERVIEW_SECTIONS = [
  { key: 'vision', title: 'Vision', placeholder: 'Describe the long-term vision for this solution...' },
  { key: 'principles', title: 'Principles', placeholder: 'Define the guiding principles...' },
  { key: 'targetMarket', title: 'Target Market', placeholder: 'Describe the target market and customer segments...' },
  { key: 'successMetrics', title: 'Success Metrics', placeholder: 'Define how success will be measured...' },
  { key: 'constraintsAndRisks', title: 'Constraints & Risks', placeholder: 'Document constraints and potential risks...' },
] as const;

type SectionKey = (typeof OVERVIEW_SECTIONS)[number]['key'];

export default function OverviewDetailPage() {
  const { solutionId } = useParams();
  const navigate = useNavigate();

  // Solution store for auto-select
  const selectSolution = useSolutionStore((state) => state.selectSolution);
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Queries
  const { data: solution, isLoading: solutionLoading, isError } = useSolutionQuery(solutionId);
  const { data: overview, isLoading: overviewLoading } = useSolutionOverviewQuery(solutionId);

  // Mutation
  const updateOverview = useUpdateSolutionOverview();

  // Generate modal state
  const [generateModal, setGenerateModal] = useState<{
    sectionType: OverviewSectionType;
    existingContent: string;
  } | null>(null);

  // LLM generation hook - handles undefined solution gracefully
  const {
    generate,
    isGenerating,
    generatedContent,
    error: generateError,
    reset: resetGeneration,
  } = useGenerateOverviewSection({
    solution: solution ?? undefined,
    teamId: solution?.teamId ?? '',
  });

  // Auto-select solution when viewing
  useEffect(() => {
    if (solution) {
      selectSolution(solution);
    }
  }, [solution, selectSolution]);

  // Redirect if solution cleared (e.g., team change)
  useEffect(() => {
    if (solutionId && !selectedSolution) {
      navigate('/solutions/strategy/overview', { replace: true });
    }
  }, [selectedSolution, solutionId, navigate]);

  // Generic save handler for any section
  const handleSaveSection = useCallback(
    async (sectionKey: SectionKey, content: string): Promise<boolean> => {
      if (!overview?.id) return false;

      try {
        const result = await updateOverview.mutateAsync({
          id: overview.id,
          updates: { [sectionKey]: content },
        });
        return result !== null;
      } catch {
        return false;
      }
    },
    [overview, updateOverview]
  );

  // Handler for opening the generate modal
  const handleGenerateClick = useCallback(
    (sectionKey: SectionKey, currentContent: string) => {
      setGenerateModal({
        sectionType: sectionKey as OverviewSectionType,
        existingContent: currentContent,
      });
    },
    []
  );

  // Handler for applying generated content
  const handleApplyGenerated = useCallback(
    async (content: string) => {
      if (!generateModal || !overview?.id) return;

      await updateOverview.mutateAsync({
        id: overview.id,
        updates: { [generateModal.sectionType]: content },
      });
    },
    [generateModal, overview, updateOverview]
  );

  // Handler for closing the generate modal
  const handleCloseGenerateModal = useCallback(() => {
    setGenerateModal(null);
  }, []);

  // Loading state
  if (solutionLoading || overviewLoading) {
    return (
      <MainLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        </PageContent>
      </MainLayout>
    );
  }

  // Error state
  if (isError || !solution) {
    return (
      <MainLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Solution not found</div>
        </PageContent>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        titlePrefix={solution.type.charAt(0).toUpperCase() + solution.type.slice(1) + ': '}
        title={solution.name}
        extra={
          <Breadcrumb
            items={[
              {
                title: (
                  <>
                    <FiHome /> Solutions
                  </>
                ),
                href: '/solutions/scope',
              },
              {
                title: solution.name,
                href: `/solutions/scope/${solutionId}`,
              },
              {
                title: 'Overview',
              },
            ]}
          />
        }
      />

      <PageContent>
        <div className="space-y-6">
          {OVERVIEW_SECTIONS.map((section) => (
            <EditableMarkdownSection
              key={section.key}
              title={section.title}
              content={overview?.[section.key] ?? ''}
              onSave={(content) => handleSaveSection(section.key, content)}
              isSaving={updateOverview.isPending}
              placeholder={section.placeholder}
              onGenerateClick={(currentContent) => handleGenerateClick(section.key, currentContent)}
              isGenerating={isGenerating && generateModal?.sectionType === section.key}
            />
          ))}
        </div>
      </PageContent>

      {/* Generate Modal */}
      {generateModal && (
        <OverviewGenerateModal
          open={!!generateModal}
          onClose={handleCloseGenerateModal}
          onApply={handleApplyGenerated}
          sectionType={generateModal.sectionType}
          existingContent={generateModal.existingContent}
          onGenerate={generate}
          isGenerating={isGenerating}
          generatedContent={generatedContent}
          error={generateError}
          onReset={resetGeneration}
        />
      )}
    </MainLayout>
  );
}
