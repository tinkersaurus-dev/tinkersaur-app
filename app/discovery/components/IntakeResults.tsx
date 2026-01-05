import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { FiUsers, FiClipboard, FiMessageSquare, FiClock, FiRefreshCw, FiHash, FiSave } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Button } from '~/core/components/ui/Button';
import { Tabs } from '~/core/components/ui/Tabs';
import { Empty } from '~/core/components/ui/Empty';
import { useAuthStore } from '~/core/auth';
import type { IntakeResult } from '~/core/entities/discovery';
import { useSaveIntakeResult, useSimilarityCheck, useSimilarityCheckForUseCases, useSimilarityCheckForFeedback } from '~/discovery/hooks';
import { PersonaResultCard } from './PersonaResultCard';
import { UseCaseResultCard } from './UseCaseResultCard';
import { FeedbackResultCard } from './FeedbackResultCard';

interface IntakeResultsProps {
  result: IntakeResult;
  onNewAnalysis: () => void;
}

type TabKey = 'personas' | 'useCases' | 'feedback';

export function IntakeResults({ result, onNewAnalysis }: IntakeResultsProps) {
  const navigate = useNavigate();
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const { saveIntakeResult, isSaving } = useSaveIntakeResult();

  const [activeTab, setActiveTab] = useState<TabKey>('personas');

  // Track deleted items by their original indexes
  const [deletedPersonaIndexes, setDeletedPersonaIndexes] = useState<Set<number>>(new Set());
  const [deletedUseCaseIndexes, setDeletedUseCaseIndexes] = useState<Set<number>>(new Set());
  const [deletedFeedbackIndexes, setDeletedFeedbackIndexes] = useState<Set<number>>(new Set());

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

  // Compute filtered arrays (items that haven't been deleted)
  const filteredPersonas = useMemo(() =>
    result.personas.filter((_, idx) => !deletedPersonaIndexes.has(idx)),
    [result.personas, deletedPersonaIndexes]
  );

  const filteredUseCases = useMemo(() =>
    result.useCases.filter((_, idx) => !deletedUseCaseIndexes.has(idx)),
    [result.useCases, deletedUseCaseIndexes]
  );

  const filteredFeedback = useMemo(() =>
    result.feedback.filter((_, idx) => !deletedFeedbackIndexes.has(idx)),
    [result.feedback, deletedFeedbackIndexes]
  );

  // Build index maps: original index -> new filtered index
  const personaIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let newIndex = 0;
    result.personas.forEach((_, originalIndex) => {
      if (!deletedPersonaIndexes.has(originalIndex)) {
        map.set(originalIndex, newIndex);
        newIndex++;
      }
    });
    return map;
  }, [result.personas, deletedPersonaIndexes]);

  const useCaseIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let newIndex = 0;
    result.useCases.forEach((_, originalIndex) => {
      if (!deletedUseCaseIndexes.has(originalIndex)) {
        map.set(originalIndex, newIndex);
        newIndex++;
      }
    });
    return map;
  }, [result.useCases, deletedUseCaseIndexes]);

  // Check for similar personas
  const { similarPersonas, isChecking } = useSimilarityCheck(
    filteredPersonas,
    selectedTeam?.teamId
  );

  // Check for similar use cases
  const { similarUseCases, isChecking: isCheckingUseCases } = useSimilarityCheckForUseCases(
    filteredUseCases,
    selectedTeam?.teamId
  );

  // Check for similar feedback
  const { similarFeedback, isChecking: isCheckingFeedback } = useSimilarityCheckForFeedback(
    filteredFeedback,
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
      personaIndexMap,
      useCaseIndexMap,
      teamId: selectedTeam.teamId,
    });

    if (success) {
      toast.success('Intake results saved successfully');
      navigate('/discovery/intake');
    } else {
      toast.error('Failed to save intake results. Please try again.');
    }
  };

  const hasItemsToSave = filteredPersonas.length > 0 || filteredUseCases.length > 0 || filteredFeedback.length > 0;

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const tabs = [
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
  ];

  return (
    <div className="space-y-6">
      {/* Header with processing time */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-[var(--text)]">
            Parsing Results
          </h2>
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            {(result.inputTokens || result.outputTokens) && (
              <span className="flex items-center gap-1">
                <FiHash className="w-4 h-4" />
                {((result.inputTokens ?? 0) + (result.outputTokens ?? 0)).toLocaleString()} tokens
              </span>
            )}
            <span className="flex items-center gap-1">
              <FiClock className="w-4 h-4" />
              {formatProcessingTime(result.processingTime)}
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs for detailed results */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabs}
        />

        <div className="mt-6">
          {/* Personas Tab */}
          {activeTab === 'personas' && (
            <>
              {filteredPersonas.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.personas.map((persona, index) => {
                    if (deletedPersonaIndexes.has(index)) return null;
                    return (
                      <PersonaResultCard
                        key={index}
                        persona={persona}
                        index={index}
                        onDelete={handleDeletePersona}
                        similarPersonas={similarPersonas.find(s => s.personaIndex === index)?.similarResults}
                        isCheckingSimilarity={isChecking}
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
              {filteredUseCases.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.useCases.map((useCase, index) => {
                    if (deletedUseCaseIndexes.has(index)) return null;
                    return (
                      <UseCaseResultCard
                        key={index}
                        useCase={useCase}
                        index={index}
                        personas={result.personas}
                        onDelete={handleDeleteUseCase}
                        deletedPersonaIndexes={deletedPersonaIndexes}
                        similarUseCases={similarUseCases.find(s => s.useCaseIndex === index)?.similarResults}
                        isCheckingSimilarity={isCheckingUseCases}
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
              {filteredFeedback.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.feedback.map((feedback, index) => {
                    if (deletedFeedbackIndexes.has(index)) return null;
                    return (
                      <FeedbackResultCard
                        key={index}
                        feedback={feedback}
                        index={index}
                        personas={result.personas}
                        useCases={result.useCases}
                        onDelete={handleDeleteFeedback}
                        deletedPersonaIndexes={deletedPersonaIndexes}
                        deletedUseCaseIndexes={deletedUseCaseIndexes}
                        similarFeedback={similarFeedback.find(s => s.feedbackIndex === index)?.similarResults}
                        isCheckingSimilarity={isCheckingFeedback}
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
          Analyze Another Transcript
        </Button>
      </div>
    </div>
  );
}
