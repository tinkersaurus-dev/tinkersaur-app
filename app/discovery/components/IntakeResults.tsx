import { useState } from 'react';
import { FiUsers, FiClipboard, FiMessageSquare, FiClock, FiRefreshCw } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Button } from '~/core/components/ui/Button';
import { Tabs } from '~/core/components/ui/Tabs';
import { Empty } from '~/core/components/ui/Empty';
import type { IntakeResult } from '~/core/entities/discovery';
import { PersonaResultCard } from './PersonaResultCard';
import { UseCaseResultCard } from './UseCaseResultCard';
import { FeedbackResultCard } from './FeedbackResultCard';

interface IntakeResultsProps {
  result: IntakeResult;
  onNewAnalysis: () => void;
}

type TabKey = 'personas' | 'useCases' | 'feedback';

export function IntakeResults({ result, onNewAnalysis }: IntakeResultsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('personas');

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
          Personas ({result.personas.length})
        </span>
      ),
      children: null,
    },
    {
      key: 'useCases' as TabKey,
      label: (
        <span className="flex items-center gap-2">
          <FiClipboard className="w-4 h-4" />
          Use Cases ({result.useCases.length})
        </span>
      ),
      children: null,
    },
    {
      key: 'feedback' as TabKey,
      label: (
        <span className="flex items-center gap-2">
          <FiMessageSquare className="w-4 h-4" />
          Feedback ({result.feedback.length})
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
          <span className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <FiClock className="w-4 h-4" />
            {formatProcessingTime(result.processingTime)}
          </span>
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
              {result.personas.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.personas.map((persona, index) => (
                    <PersonaResultCard
                      key={index}
                      persona={persona}
                      index={index}
                    />
                  ))}
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
              {result.useCases.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.useCases.map((useCase, index) => (
                    <UseCaseResultCard
                      key={index}
                      useCase={useCase}
                      index={index}
                      personas={result.personas}
                    />
                  ))}
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
              {result.feedback.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.feedback.map((feedback, index) => (
                    <FeedbackResultCard
                      key={index}
                      feedback={feedback}
                      index={index}
                      personas={result.personas}
                      useCases={result.useCases}
                    />
                  ))}
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
      <div className="flex justify-center">
        <Button
          variant="default"
          icon={<FiRefreshCw />}
          onClick={onNewAnalysis}
        >
          Analyze Another Transcript
        </Button>
      </div>
    </div>
  );
}
