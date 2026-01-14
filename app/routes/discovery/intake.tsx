/**
 * Intake Page
 * Allows users to input transcripts and other sources for analysis.
 * Extracts personas, use cases, and feedback using LLM analysis.
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { FiAlertCircle } from 'react-icons/fi';
import { MainLayout } from '~/core/components/MainLayout';
import { PageHeader } from '~/core/components/PageHeader';
import { PageContent } from '~/core/components/PageContent';
import { Card } from '~/core/components/ui/Card';
import { useAuthStore } from '~/core/auth';
import type { SourceTypeKey, IntakeResult } from '~/core/entities/discovery';
import { SourceTypeKeySchema } from '~/core/entities/discovery';
import { IntakeForm, IntakeResults } from '~/discovery/components';
import { useParseTranscript } from '~/discovery/hooks';

export default function IntakePage() {
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
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

  const handleSubmit = async (
    sourceType: SourceTypeKey,
    content: string,
    metadata: Record<string, string>,
    solutionId: string | null
  ) => {
    clearError();
    setSelectedSolutionId(solutionId);
    const analysisResult = await parseTranscript(sourceType, content, metadata, teamId);
    if (analysisResult) {
      setResult(analysisResult);
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setSelectedSolutionId(null);
    clearError();
  };

  return (
    <MainLayout>
      <PageHeader title="Intake" />
      <PageContent>
        <div className="max-w-5xl mx-auto">
          {/* Error display */}
          {error && (
            <Card className="mb-6 border-[var(--danger)] bg-red-50 dark:bg-red-900/20">
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

          {/* Show form or results */}
          {result ? (
            <IntakeResults
              result={result}
              onNewAnalysis={handleNewAnalysis}
              defaultSolutionId={selectedSolutionId}
            />
          ) : (
            <IntakeForm
              key={sourceType}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              sourceType={sourceType}
            />
          )}
        </div>
      </PageContent>
    </MainLayout>
  );
}
