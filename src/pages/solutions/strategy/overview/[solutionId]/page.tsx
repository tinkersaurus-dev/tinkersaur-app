/**
 * Solution Overview Detail Page
 * Displays and manages solution factors organized by type
 */

import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageHeader, PageContent } from '@/shared/ui';
import { useSolutionQuery } from '@/entities/solution';
import {
  useSolutionFactorsQuery,
  useCreateSolutionFactor,
  useUpdateSolutionFactor,
  useDeleteSolutionFactor,
  useCreateSolutionFactorsBulk,
} from '@/entities/solution-factor';
import { useSolutionStore } from '@/app/model/stores/solution';
import { useGenerateFactors, useRefineFactor, FactorGenerateModal } from '@/features/llm-generation';
import { FactorsList } from '@/entities/solution-factor';
import {
  groupFactorsByType,
  type SolutionFactorType,
  type UpdateSolutionFactorDto,
} from '@/entities/solution-factor';
import type { GeneratedFactorItem } from '@/features/llm-generation';

// Factor type sections in display order
const FACTOR_SECTIONS: {
  type: SolutionFactorType;
  showTargetDate: boolean;
}[] = [
  { type: 'vision', showTargetDate: false },
  { type: 'principle', showTargetDate: false },
  { type: 'target-market', showTargetDate: false },
  { type: 'success-metric', showTargetDate: false },
  { type: 'constraint', showTargetDate: true },
  { type: 'risk', showTargetDate: true },
];

export default function OverviewDetailPage() {
  const { solutionId } = useParams();
  const navigate = useNavigate();

  // Solution store for auto-select
  const selectSolution = useSolutionStore((state) => state.selectSolution);
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Queries
  const { data: solution, isLoading: solutionLoading, isError } = useSolutionQuery(solutionId);
  const { data: factors = [], isLoading: factorsLoading } = useSolutionFactorsQuery(solutionId);

  // Mutations
  const createFactor = useCreateSolutionFactor();
  const updateFactor = useUpdateSolutionFactor();
  const deleteFactor = useDeleteSolutionFactor();
  const createFactorsBulk = useCreateSolutionFactorsBulk();

  // Generate modal state
  const [generateModal, setGenerateModal] = useState<{
    factorType: SolutionFactorType;
  } | null>(null);

  // LLM generation hook
  const {
    generate,
    isGenerating,
    generatedFactors,
    error: generateError,
    reset: resetGeneration,
  } = useGenerateFactors({
    solution: solution ?? undefined,
    teamId: solution?.teamId ?? '',
  });

  // LLM refinement hook
  const { refine, isRefining } = useRefineFactor({
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

  // Group factors by type
  const groupedFactors = groupFactorsByType(factors);

  // Handler for adding a new factor
  const handleAddFactor = useCallback(
    async (type: SolutionFactorType, content: string, notes?: string) => {
      if (!solutionId) return;
      await createFactor.mutateAsync({
        solutionId,
        type,
        content,
        notes: notes ?? '',
        active: true,
      });
    },
    [solutionId, createFactor]
  );

  // Handler for updating a factor
  const handleUpdateFactor = useCallback(
    async (id: string, updates: UpdateSolutionFactorDto) => {
      await updateFactor.mutateAsync({ id, updates });
    },
    [updateFactor]
  );

  // Handler for deleting a factor
  const handleDeleteFactor = useCallback(
    (id: string) => {
      if (!solutionId) return;
      deleteFactor.mutate({ id, solutionId });
    },
    [solutionId, deleteFactor]
  );

  // Handler for opening the generate modal
  const handleGenerateClick = useCallback((type: SolutionFactorType) => {
    setGenerateModal({ factorType: type });
  }, []);

  // Handler for applying generated factors
  const handleApplyGenerated = useCallback(
    async (generatedItems: GeneratedFactorItem[]) => {
      if (!generateModal || !solutionId) return;

      await createFactorsBulk.mutateAsync({
        solutionId,
        type: generateModal.factorType,
        factors: generatedItems.map((item) => ({
          content: item.content,
          notes: item.notes,
        })),
      });
    },
    [generateModal, solutionId, createFactorsBulk]
  );

  // Handler for closing the generate modal
  const handleCloseGenerateModal = useCallback(() => {
    setGenerateModal(null);
  }, []);

  // Handler for refining a factor
  const handleRefine = useCallback(
    async (factorType: SolutionFactorType, content: string, instructions: string) => {
      return refine({ factorType, currentContent: content, refinementInstructions: instructions });
    },
    [refine]
  );

  // Loading state
  if (solutionLoading || factorsLoading) {
    return (
      <PageContent>
        <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
      </PageContent>
    );
  }

  // Error state
  if (isError || !solution) {
    return (
      <PageContent>
        <div className="text-center py-8 text-[var(--text-muted)]">Solution not found</div>
      </PageContent>
    );
  }

  const isMutating =
    createFactor.isPending ||
    updateFactor.isPending ||
    deleteFactor.isPending ||
    createFactorsBulk.isPending;

  return (
    <>
      <PageHeader
        titlePrefix={solution.type.charAt(0).toUpperCase() + solution.type.slice(1) + ': '}
        title={solution.name}
      />

      <PageContent>
        <div className="space-y-8">
          {FACTOR_SECTIONS.map((section) => (
            <FactorsList
              key={section.type}
              type={section.type}
              factors={groupedFactors[section.type]}
              onAdd={(content, notes) => handleAddFactor(section.type, content, notes)}
              onUpdate={handleUpdateFactor}
              onDelete={handleDeleteFactor}
              onGenerateClick={() => handleGenerateClick(section.type)}
              onRefine={handleRefine}
              isUpdating={isMutating}
              isGenerating={isGenerating && generateModal?.factorType === section.type}
              isRefining={isRefining}
              showTargetDate={section.showTargetDate}
            />
          ))}
        </div>
      </PageContent>

      {/* Generate Modal */}
      {generateModal && (
        <FactorGenerateModal
          open={!!generateModal}
          onClose={handleCloseGenerateModal}
          onApply={handleApplyGenerated}
          factorType={generateModal.factorType}
          onGenerate={generate}
          isGenerating={isGenerating}
          generatedFactors={generatedFactors}
          error={generateError}
          onReset={resetGeneration}
        />
      )}
    </>
  );
}
