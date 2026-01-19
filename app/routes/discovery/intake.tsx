/**
 * Intake Page
 * Allows users to input transcripts and other sources for analysis.
 * Extracts personas, use cases, and feedback using LLM analysis.
 *
 * Uses an accordion wizard UI with two steps:
 * 1. Input Transcript - Form for entering content
 * 2. Review Results - Review and save extracted entities
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { FiAlertCircle, FiChevronDown, FiChevronRight, FiCheck } from 'react-icons/fi';
import { MainLayout } from '~/core/components/MainLayout';
import { PageHeader } from '~/core/components/PageHeader';
import { PageContent } from '~/core/components/PageContent';
import { Card } from '~/core/components/ui/Card';
import { useAuthStore } from '~/core/auth';
import type { SourceTypeKey, IntakeResult } from '~/core/entities/discovery';
import { SourceTypeKeySchema, SOURCE_TYPES } from '~/core/entities/discovery';
import { IntakeForm, IntakeResults } from '~/discovery/components';
import type { IntakeFormValues } from '~/discovery/components';
import { useParseTranscript } from '~/discovery/hooks';

type WizardStep = 'input' | 'results';

interface StepHeaderProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  isCompleted: boolean;
  isAvailable: boolean;
  onClick: () => void;
}

function StepHeader({
  stepNumber,
  title,
  subtitle,
  isExpanded,
  isCompleted,
  isAvailable,
  onClick,
}: StepHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
        isAvailable ? 'hover:bg-[var(--bg-hover)]' : 'opacity-50 cursor-not-allowed'
      }`}
      onClick={isAvailable ? onClick : undefined}
      role="button"
      tabIndex={isAvailable ? 0 : -1}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Step number badge */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
            isCompleted
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
          }`}
        >
          {isCompleted ? <FiCheck className="w-4 h-4" /> : stepNumber}
        </div>

        {/* Title and subtitle */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text)]">{title}</h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Expand/collapse chevron */}
      <span className="text-[var(--text-muted)]">
        {isExpanded ? (
          <FiChevronDown className="w-5 h-5" />
        ) : (
          <FiChevronRight className="w-5 h-5" />
        )}
      </span>
    </div>
  );
}

function getFormSummary(formValues: IntakeFormValues): string {
  const sourceLabel = SOURCE_TYPES[formValues.sourceType]?.label || formValues.sourceType;
  return `${sourceLabel} - ${formValues.content.length.toLocaleString()} characters`;
}

export default function IntakePage() {
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<WizardStep>('input');
  const [formValues, setFormValues] = useState<IntakeFormValues | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const { parseTranscript, isLoading, error, clearError } = useParseTranscript();
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  const [searchParams] = useSearchParams();

  // Read and validate sourceType from URL
  const sourceTypeParam = searchParams.get('sourceType');
  const sourceType: SourceTypeKey = useMemo(() => {
    if (!sourceTypeParam) return 'meeting-transcript';

    const parseResult = SourceTypeKeySchema.safeParse(sourceTypeParam);
    return parseResult.success ? parseResult.data : 'meeting-transcript';
  }, [sourceTypeParam]);

  // Derived state
  const step1Completed = result !== null;
  const step2Available = step1Completed;
  const step1Expanded = expandedStep === 'input';
  const step2Expanded = expandedStep === 'results';

  const handleSubmit = async (
    submitSourceType: SourceTypeKey,
    content: string,
    metadata: Record<string, string>,
    solutionId: string | null
  ) => {
    clearError();
    setSelectedSolutionId(solutionId);

    // Store form values for later editing
    setFormValues({
      sourceType: submitSourceType,
      content,
      metadata,
      solutionId,
    });

    const analysisResult = await parseTranscript(submitSourceType, content, metadata, teamId);
    if (analysisResult) {
      setResult(analysisResult);
      setExpandedStep('results');
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setSelectedSolutionId(null);
    setFormValues(null);
    setFormResetKey((k) => k + 1);
    setExpandedStep('input');
    clearError();
  };

  function formatProcessingTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  return (
    <MainLayout>
      <PageHeader title="Intake" />
      <PageContent>
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Error display */}
          {error && (
            <Card className="border-[var(--danger)] bg-red-50 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-[var(--danger)]">
                    Analysis Error
                  </h3>
                  <p className="text-sm text-[var(--danger)] mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 1: Input Transcript */}
          <Card className="overflow-hidden !p-0" contentClassName='p-2'>
            <StepHeader
              stepNumber={1}
              title="Input Transcript"
              subtitle={step1Completed && formValues ? getFormSummary(formValues) : undefined}
              isExpanded={step1Expanded}
              isCompleted={step1Completed}
              isAvailable={true}
              onClick={() => setExpandedStep('input')}
            />
            {step1Expanded && (
              <div className="border-t border-[var(--border)]">
                <IntakeForm
                  key={formValues ? 'with-values' : `${sourceType}-${formResetKey}`}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  sourceType={sourceType}
                  initialValues={formValues ?? undefined}
                />
              </div>
            )}
          </Card>

          {/* Step 2: Review Results */}
          <Card className={`overflow-hidden !p-0 ${!step2Available ? 'opacity-50' : ''}`} contentClassName='p-2'>
            <StepHeader
              stepNumber={2}
              title="Review Results"
              subtitle={
                result
                  ? `${(result.inputTokens ?? 0) + (result.outputTokens ?? 0)} tokens | ${formatProcessingTime(result.processingTime)} seconds` 
                  : 'Complete Step 1 to view results'
              }
              isExpanded={step2Expanded}
              isCompleted={false}
              isAvailable={step2Available}
              onClick={() => step2Available && setExpandedStep('results')}
            />
            {step2Expanded && result && (
              <div className="border-t border-[var(--border)]">
                <IntakeResults
                  result={result}
                  onNewAnalysis={handleNewAnalysis}
                  defaultSolutionId={selectedSolutionId}
                />
              </div>
            )}
          </Card>
        </div>
      </PageContent>
    </MainLayout>
  );
}
