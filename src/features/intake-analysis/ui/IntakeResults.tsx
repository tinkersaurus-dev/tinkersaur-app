import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { FiUsers, FiClipboard, FiMessageSquare, FiRefreshCw, FiSave, FiTarget } from 'react-icons/fi';
import { Card, Empty, Button, Tabs } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import type { IntakeResult } from '@/entities/intake-result';
import type { SourceTypeKey } from '@/entities/source-type';
import type { SimilarPersonaInfo, SimilarUseCaseInfo, SimilarFeedbackInfo, SimilarOutcomeInfo } from '../lib/types/similarity';
import { useSaveIntakeResult, type PendingMerge, type PendingUseCaseMerge, type PendingFeedbackMerge } from '../lib/hooks/useSaveIntakeResult';
import { useSimilarPersonasQuery, useSimilarUseCasesQuery, useSimilarFeedbackQuery, useSimilarOutcomesQuery } from '../api/useSimilarityQueries';
import { useSolutionsQuery } from '@/entities/solution';
import { PersonaResultCard } from './PersonaResultCard';
import { UseCaseResultCard } from './UseCaseResultCard';
import { FeedbackResultCard } from './FeedbackResultCard';
import { OutcomeResultCard } from './OutcomeResultCard';
import {
  IntakePersonaMergeModal,
  IntakeUseCaseMergeModal,
  IntakeFeedbackMergeModal,
} from '@/features/entity-merging';


function generateItemKey(
  item: { name?: string; content?: string; description?: string },
  index: number
): string {
  const content = item.name || item.content || item.description || '';
  return `${content.slice(0, 50).replace(/\s+/g, '-')}-${index}`;
}

interface IntakeResultsProps {
  result: IntakeResult;
  onNewAnalysis: () => void;
  defaultSolutionId: string | null;
}

type TabKey = 'personas' | 'useCases' | 'feedback' | 'outcomes';

export function IntakeResults({ result, onNewAnalysis, defaultSolutionId }: IntakeResultsProps) {
  const navigate = useNavigate();
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const { saveIntakeResult, isSaving } = useSaveIntakeResult();
  const { data: solutions = [] } = useSolutionsQuery(selectedTeam?.teamId);

  const [activeTab, setActiveTab] = useState<TabKey>('personas');

  // Track deleted items by their original indexes
  const [deletedPersonaIndexes, setDeletedPersonaIndexes] = useState<Set<number>>(new Set());
  const [deletedUseCaseIndexes, setDeletedUseCaseIndexes] = useState<Set<number>>(new Set());
  const [deletedFeedbackIndexes, setDeletedFeedbackIndexes] = useState<Set<number>>(new Set());
  const [deletedOutcomeIndexes, setDeletedOutcomeIndexes] = useState<Set<number>>(new Set());

  // Persona merge modal state
  const [mergeContext, setMergeContext] = useState<{
    intakePersonaIndex: number;
    existingPersonaId: string;
  } | null>(null);

  // Track pending persona merges (to be executed on save)
  const [pendingMerges, setPendingMerges] = useState<PendingMerge[]>([]);

  // Use case merge modal state
  const [useCaseMergeContext, setUseCaseMergeContext] = useState<{
    intakeUseCaseIndex: number;
    existingUseCaseIds: string[];
  } | null>(null);

  // Track pending use case merges (to be executed on save)
  const [pendingUseCaseMerges, setPendingUseCaseMerges] = useState<PendingUseCaseMerge[]>([]);

  // Feedback merge modal state
  const [feedbackMergeContext, setFeedbackMergeContext] = useState<{
    intakeFeedbackIndex: number;
    existingFeedbackId: string;
  } | null>(null);

  // Track pending feedback merges (to be executed on save)
  const [pendingFeedbackMerges, setPendingFeedbackMerges] = useState<PendingFeedbackMerge[]>([]);

  // Per-item solution selections (keyed by original index, initialized with defaultSolutionId)
  const [useCaseSolutionIds, setUseCaseSolutionIds] = useState<Map<number, string | null>>(() => {
    const map = new Map<number, string | null>();
    result.useCases.forEach((_, idx) => map.set(idx, defaultSolutionId));
    return map;
  });
  const [feedbackSolutionIds, setFeedbackSolutionIds] = useState<Map<number, string | null>>(() => {
    const map = new Map<number, string | null>();
    result.feedback.forEach((_, idx) => map.set(idx, defaultSolutionId));
    return map;
  });
  const [outcomeSolutionIds, setOutcomeSolutionIds] = useState<Map<number, string | null>>(() => {
    const map = new Map<number, string | null>();
    result.outcomes.forEach((_, idx) => map.set(idx, defaultSolutionId));
    return map;
  });

  // Delete handlers
  const handleDeletePersona = useCallback((index: number) => {
    setDeletedPersonaIndexes(prev => new Set([...prev, index]));
  }, []);

  const handleDeleteUseCase = useCallback((index: number) => {
    setDeletedUseCaseIndexes(prev => new Set([...prev, index]));
  }, []);

  const handleDeleteFeedback = useCallback((index: number) => {
    setDeletedFeedbackIndexes(prev => new Set([...prev, index]));
  }, []);

  const handleDeleteOutcome = useCallback((index: number) => {
    setDeletedOutcomeIndexes(prev => new Set([...prev, index]));
  }, []);

  // Merge handler - opens merge modal for intake persona with existing persona
  const handleMergePersona = useCallback((intakePersonaIndex: number, existingPersonaId: string) => {
    setMergeContext({ intakePersonaIndex, existingPersonaId });
  }, []);

  // After merge is confirmed, track it for execution on save
  const handleMergeConfirmed = useCallback((pendingMerge: PendingMerge) => {
    setPendingMerges(prev => [...prev, pendingMerge]);
    // Don't add to deletedPersonaIndexes - we want to show it with a merge indicator
    setMergeContext(null);
  }, []);

  // Use case merge handler - opens merge modal for intake use case with existing use cases
  const handleMergeUseCase = useCallback((intakeUseCaseIndex: number, existingUseCaseIds: string[]) => {
    setUseCaseMergeContext({ intakeUseCaseIndex, existingUseCaseIds });
  }, []);

  // After use case merge is confirmed, track it for execution on save
  const handleUseCaseMergeConfirmed = useCallback((pendingMerge: PendingUseCaseMerge) => {
    setPendingUseCaseMerges(prev => [...prev, pendingMerge]);
    // Don't add to deletedUseCaseIndexes - we want to show it with a merge indicator
    setUseCaseMergeContext(null);
  }, []);

  // Feedback merge handler - opens merge modal for intake feedback with existing feedback
  const handleMergeFeedback = useCallback((intakeFeedbackIndex: number, existingFeedbackId: string) => {
    setFeedbackMergeContext({ intakeFeedbackIndex, existingFeedbackId });
  }, []);

  // After feedback merge is confirmed, track it for execution on save
  const handleFeedbackMergeConfirmed = useCallback((pendingMerge: PendingFeedbackMerge) => {
    setPendingFeedbackMerges(prev => [...prev, pendingMerge]);
    // Don't add to deletedFeedbackIndexes - we want to show it with a merge indicator
    setFeedbackMergeContext(null);
  }, []);

  // Solution change handlers
  const handleUseCaseSolutionChange = useCallback((index: number, solutionId: string | null) => {
    setUseCaseSolutionIds(prev => new Map(prev).set(index, solutionId));
  }, []);

  const handleFeedbackSolutionChange = useCallback((index: number, solutionId: string | null) => {
    setFeedbackSolutionIds(prev => new Map(prev).set(index, solutionId));
  }, []);

  const handleOutcomeSolutionChange = useCallback((index: number, solutionId: string | null) => {
    setOutcomeSolutionIds(prev => new Map(prev).set(index, solutionId));
  }, []);

  // Build sets of indexes with pending merges (for quick lookup)
  const pendingPersonaMergeIndexes = useMemo(() =>
    new Set(pendingMerges.map(m => m.intakePersonaIndex)),
    [pendingMerges]
  );

  const pendingUseCaseMergeIndexes = useMemo(() =>
    new Set(pendingUseCaseMerges.map(m => m.intakeUseCaseIndex)),
    [pendingUseCaseMerges]
  );

  const pendingFeedbackMergeIndexes = useMemo(() =>
    new Set(pendingFeedbackMerges.map(m => m.intakeFeedbackIndex)),
    [pendingFeedbackMerges]
  );

  // Helper to find pending merge info by index
  const getPendingPersonaMerge = useCallback((index: number) =>
    pendingMerges.find(m => m.intakePersonaIndex === index),
    [pendingMerges]
  );

  const getPendingUseCaseMerge = useCallback((index: number) =>
    pendingUseCaseMerges.find(m => m.intakeUseCaseIndex === index),
    [pendingUseCaseMerges]
  );

  const getPendingFeedbackMerge = useCallback((index: number) =>
    pendingFeedbackMerges.find(m => m.intakeFeedbackIndex === index),
    [pendingFeedbackMerges]
  );

  // Compute filtered arrays (items that haven't been deleted or merged)
  const filteredPersonas = useMemo(() =>
    result.personas.filter((_, idx) => !deletedPersonaIndexes.has(idx) && !pendingPersonaMergeIndexes.has(idx)),
    [result.personas, deletedPersonaIndexes, pendingPersonaMergeIndexes]
  );

  const filteredUseCases = useMemo(() =>
    result.useCases.filter((_, idx) => !deletedUseCaseIndexes.has(idx) && !pendingUseCaseMergeIndexes.has(idx)),
    [result.useCases, deletedUseCaseIndexes, pendingUseCaseMergeIndexes]
  );

  const filteredFeedback = useMemo(() =>
    result.feedback.filter((_, idx) => !deletedFeedbackIndexes.has(idx) && !pendingFeedbackMergeIndexes.has(idx)),
    [result.feedback, deletedFeedbackIndexes, pendingFeedbackMergeIndexes]
  );

  const filteredOutcomes = useMemo(() =>
    result.outcomes.filter((_, idx) => !deletedOutcomeIndexes.has(idx)),
    [result.outcomes, deletedOutcomeIndexes]
  );

  // Build index maps: original index -> new filtered index (excludes deleted and merged items)
  const personaIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let newIndex = 0;
    result.personas.forEach((_, originalIndex) => {
      if (!deletedPersonaIndexes.has(originalIndex) && !pendingPersonaMergeIndexes.has(originalIndex)) {
        map.set(originalIndex, newIndex);
        newIndex++;
      }
    });
    return map;
  }, [result.personas, deletedPersonaIndexes, pendingPersonaMergeIndexes]);

  const useCaseIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let newIndex = 0;
    result.useCases.forEach((_, originalIndex) => {
      if (!deletedUseCaseIndexes.has(originalIndex) && !pendingUseCaseMergeIndexes.has(originalIndex)) {
        map.set(originalIndex, newIndex);
        newIndex++;
      }
    });
    return map;
  }, [result.useCases, deletedUseCaseIndexes, pendingUseCaseMergeIndexes]);

  const feedbackIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let newIndex = 0;
    result.feedback.forEach((_, originalIndex) => {
      if (!deletedFeedbackIndexes.has(originalIndex) && !pendingFeedbackMergeIndexes.has(originalIndex)) {
        map.set(originalIndex, newIndex);
        newIndex++;
      }
    });
    return map;
  }, [result.feedback, deletedFeedbackIndexes, pendingFeedbackMergeIndexes]);

  const outcomeIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let newIndex = 0;
    result.outcomes.forEach((_, originalIndex) => {
      if (!deletedOutcomeIndexes.has(originalIndex)) {
        map.set(originalIndex, newIndex);
        newIndex++;
      }
    });
    return map;
  }, [result.outcomes, deletedOutcomeIndexes]);

  // Check for similar items using TanStack Query
  const { data: similarPersonas = [], isLoading: isChecking } = useSimilarPersonasQuery(
    filteredPersonas,
    selectedTeam?.teamId
  );

  const { data: similarUseCases = [], isLoading: isCheckingUseCases } = useSimilarUseCasesQuery(
    filteredUseCases,
    selectedTeam?.teamId
  );

  const { data: similarFeedback = [], isLoading: isCheckingFeedback } = useSimilarFeedbackQuery(
    filteredFeedback,
    selectedTeam?.teamId
  );

  const { data: similarOutcomes = [], isLoading: isCheckingOutcomes } = useSimilarOutcomesQuery(
    filteredOutcomes,
    selectedTeam?.teamId
  );

  // Save handler
  const handleSave = async () => {
    if (!selectedTeam) {
      toast.error('No team selected. Please select a team first.');
      return;
    }

    const success = await saveIntakeResult({
      personas: filteredPersonas,
      useCases: filteredUseCases,
      feedback: filteredFeedback,
      outcomes: filteredOutcomes,
      personaIndexMap,
      useCaseIndexMap,
      feedbackIndexMap,
      outcomeIndexMap,
      teamId: selectedTeam.teamId,
      sourceType: result.sourceType as SourceTypeKey,
      metadata: result.metadata as Record<string, string>,
      useCaseSolutionIds,
      feedbackSolutionIds,
      outcomeSolutionIds,
      pendingMerges,
      pendingUseCaseMerges,
      pendingFeedbackMerges,
    });

    if (success) {
      // Clear pending state to prevent unbounded memory growth
      setPendingMerges([]);
      setPendingUseCaseMerges([]);
      setPendingFeedbackMerges([]);
      setDeletedPersonaIndexes(new Set());
      setDeletedUseCaseIndexes(new Set());
      setDeletedFeedbackIndexes(new Set());
      setDeletedOutcomeIndexes(new Set());

      toast.success('Intake results saved successfully');
      navigate('/discovery/organize');
    } else {
      toast.error('Failed to save intake results. Please try again.');
    }
  };

  const hasItemsToSave = filteredPersonas.length > 0 || filteredUseCases.length > 0 || filteredFeedback.length > 0 || filteredOutcomes.length > 0;

  const tabs = useMemo(() => [
    {
      key: 'personas' as TabKey,
      label: (
        <span className="flex items-center gap-2">
          <FiUsers className="w-4 h-4" />
          Personas ({filteredPersonas.length})
        </span>
      ),
      children: null,
    },
    {
      key: 'useCases' as TabKey,
      label: (
        <span className="flex items-center gap-2">
          <FiClipboard className="w-4 h-4" />
          Use Cases ({filteredUseCases.length})
        </span>
      ),
      children: null,
    },
    {
      key: 'feedback' as TabKey,
      label: (
        <span className="flex items-center gap-2">
          <FiMessageSquare className="w-4 h-4" />
          Feedback ({filteredFeedback.length})
        </span>
      ),
      children: null,
    },
    {
      key: 'outcomes' as TabKey,
      label: (
        <span className="flex items-center gap-2">
          <FiTarget className="w-4 h-4" />
          Outcomes ({filteredOutcomes.length})
        </span>
      ),
      children: null,
    },
  ], [filteredPersonas.length, filteredUseCases.length, filteredFeedback.length, filteredOutcomes.length]);

  return (
    <div className="space-y-6">



      {/* Tabs for detailed results */}
      <Card bordered={false} shadow={false}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabs}
        />

        <div className="mt-6">
          {/* Personas Tab */}
          {activeTab === 'personas' && (
            <>
              {filteredPersonas.length > 0 || pendingMerges.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {result.personas.map((persona, index) => {
                    if (deletedPersonaIndexes.has(index)) return null;
                    const pendingMerge = getPendingPersonaMerge(index);
                    return (
                      <PersonaResultCard
                        key={generateItemKey(persona, index)}
                        persona={persona}
                        index={index}
                        onDelete={handleDeletePersona}
                        similarPersonas={similarPersonas.find((s: SimilarPersonaInfo) => s.personaIndex === index)?.similarResults}
                        isCheckingSimilarity={isChecking}
                        onMerge={handleMergePersona}
                        pendingMerge={pendingMerge}
                      />
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={<FiUsers className="w-12 h-12" />}
                  description={
                    <div className="text-center">
                      <div className="font-medium mb-1">No personas found</div>
                      <div>No distinct personas were identified in the transcript. Try providing a longer transcript with more participant detail.</div>
                    </div>
                  }
                />
              )}
            </>
          )}

          {/* Use Cases Tab */}
          {activeTab === 'useCases' && (
            <>
              {filteredUseCases.length > 0 || pendingUseCaseMerges.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.useCases.map((useCase, index) => {
                    if (deletedUseCaseIndexes.has(index)) return null;
                    const pendingMerge = getPendingUseCaseMerge(index);
                    return (
                      <UseCaseResultCard
                        key={generateItemKey(useCase, index)}
                        useCase={useCase}
                        index={index}
                        onDelete={handleDeleteUseCase}
                        similarUseCases={similarUseCases.find((s: SimilarUseCaseInfo) => s.useCaseIndex === index)?.similarResults}
                        isCheckingSimilarity={isCheckingUseCases}
                        solutions={solutions}
                        selectedSolutionId={useCaseSolutionIds.get(index) ?? null}
                        onSolutionChange={handleUseCaseSolutionChange}
                        onMerge={handleMergeUseCase}
                        pendingMerge={pendingMerge}
                      />
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={<FiClipboard className="w-12 h-12" />}
                  description={
                    <div className="text-center">
                      <div className="font-medium mb-1">No use cases found</div>
                      <div>No specific use cases or workflows were identified. Try including more discussion about tasks or goals.</div>
                    </div>
                  }
                />
              )}
            </>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <>
              {filteredFeedback.length > 0 || pendingFeedbackMerges.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.feedback.map((feedback, index) => {
                    if (deletedFeedbackIndexes.has(index)) return null;
                    const pendingMerge = getPendingFeedbackMerge(index);
                    return (
                      <FeedbackResultCard
                        key={generateItemKey(feedback, index)}
                        feedback={feedback}
                        index={index}
                        personas={result.personas}
                        useCases={result.useCases}
                        onDelete={handleDeleteFeedback}
                        deletedPersonaIndexes={deletedPersonaIndexes}
                        deletedUseCaseIndexes={deletedUseCaseIndexes}
                        similarFeedback={similarFeedback.find((s: SimilarFeedbackInfo) => s.feedbackIndex === index)?.similarResults}
                        isCheckingSimilarity={isCheckingFeedback}
                        solutions={solutions}
                        selectedSolutionId={feedbackSolutionIds.get(index) ?? null}
                        onSolutionChange={handleFeedbackSolutionChange}
                        onMerge={handleMergeFeedback}
                        pendingMerge={pendingMerge}
                      />
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={<FiMessageSquare className="w-12 h-12" />}
                  description={
                    <div className="text-center">
                      <div className="font-medium mb-1">No feedback found</div>
                      <div>No feedback, suggestions, or concerns were identified in the transcript.</div>
                    </div>
                  }
                />
              )}
            </>
          )}

          {/* Outcomes Tab */}
          {activeTab === 'outcomes' && (
            <>
              {filteredOutcomes.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.outcomes.map((outcome, index) => {
                    if (deletedOutcomeIndexes.has(index)) return null;
                    return (
                      <OutcomeResultCard
                        key={generateItemKey(outcome, index)}
                        outcome={outcome}
                        index={index}
                        onDelete={handleDeleteOutcome}
                        similarOutcomes={similarOutcomes.find((s: SimilarOutcomeInfo) => s.outcomeIndex === index)?.similarResults}
                        isCheckingSimilarity={isCheckingOutcomes}
                        solutions={solutions}
                        selectedSolutionId={outcomeSolutionIds.get(index) ?? null}
                        onSolutionChange={handleOutcomeSolutionChange}
                      />
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={<FiTarget className="w-12 h-12" />}
                  description={
                    <div className="text-center">
                      <div className="font-medium mb-1">No outcomes found</div>
                      <div>No measurable business outcomes or metric targets were identified in the transcript.</div>
                    </div>
                  }
                />
              )}
            </>
          )}
        </div>
      </Card>

      {/* Action bar */}
      <div className="flex justify-center gap-4">
        <Button
          variant="primary"
          icon={<FiSave />}
          onClick={handleSave}
          loading={isSaving}
          disabled={isSaving || !hasItemsToSave}
        >
          Save Results
        </Button>
        <Button
          variant="default"
          icon={<FiRefreshCw />}
          onClick={onNewAnalysis}
          disabled={isSaving}
        >
          Start Over
        </Button>
      </div>

      {/* Intake Persona Merge Modal */}
      {mergeContext && (
        <IntakePersonaMergeModal
          open={true}
          onClose={() => setMergeContext(null)}
          intakePersona={result.personas[mergeContext.intakePersonaIndex]}
          intakePersonaIndex={mergeContext.intakePersonaIndex}
          existingPersonaId={mergeContext.existingPersonaId}
          onMergeConfirmed={handleMergeConfirmed}
        />
      )}

      {/* Intake Use Case Merge Modal */}
      {useCaseMergeContext && (
        <IntakeUseCaseMergeModal
          open={true}
          onClose={() => setUseCaseMergeContext(null)}
          intakeUseCase={result.useCases[useCaseMergeContext.intakeUseCaseIndex]}
          intakeUseCaseIndex={useCaseMergeContext.intakeUseCaseIndex}
          existingUseCaseIds={useCaseMergeContext.existingUseCaseIds}
          onMergeConfirmed={handleUseCaseMergeConfirmed}
          intakeSolutionId={useCaseSolutionIds.get(useCaseMergeContext.intakeUseCaseIndex)}
          solutions={solutions}
        />
      )}

      {/* Intake Feedback Merge Modal */}
      {feedbackMergeContext && (
        <IntakeFeedbackMergeModal
          open={true}
          onClose={() => setFeedbackMergeContext(null)}
          intakeFeedback={result.feedback[feedbackMergeContext.intakeFeedbackIndex]}
          intakeFeedbackIndex={feedbackMergeContext.intakeFeedbackIndex}
          existingFeedbackId={feedbackMergeContext.existingFeedbackId}
          onMergeConfirmed={handleFeedbackMergeConfirmed}
        />
      )}
    </div>
  );
}
