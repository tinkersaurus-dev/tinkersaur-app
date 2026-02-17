import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader, PageContent, Card, Spinner, Empty, Select } from '@/shared/ui';
import type { SelectOption, SelectOptionGroup } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useFeedbacksQuery } from '@/entities/feedback';
import { usePersonasQuery } from '@/entities/persona';
import { useUseCasesByTeamQuery } from '@/entities/use-case';
import { useIntakeSourceDetailsQuery } from '@/entities/intake-source';
import { useCrossTabulation } from '../lib/useCrossTabulation';
import type { DimensionKey, SortDirection } from '../lib/useCrossTabulation';
import { useUseCaseEvidenceRows } from '../lib/useUseCaseEvidenceRows';
import { DynamicHeatmap } from './DynamicHeatmap';
import { UseCaseEvidenceTable } from './UseCaseEvidenceTable';

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  personas: 'Personas',
  useCases: 'Use Cases',
  sourceTypes: 'Source Types',
  tags: 'Tags',
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
};

const TIME_DIMS: DimensionKey[] = ['days', 'weeks', 'months'];

const BASE_DIMENSION_OPTIONS: (SelectOption | SelectOptionGroup)[] = [
  {
    label: 'Entities',
    options: [
      { value: 'personas', label: 'Personas' },
      { value: 'useCases', label: 'Use Cases' },
      { value: 'sourceTypes', label: 'Source Types' },
      { value: 'tags', label: 'Tags' },
    ],
  },
  {
    label: 'Time',
    options: [
      { value: 'days', label: 'Days' },
      { value: 'weeks', label: 'Weeks' },
      { value: 'months', label: 'Months' },
    ],
  },
];

function buildDimensionOptions(
  otherDimension: DimensionKey,
): (SelectOption | SelectOptionGroup)[] {
  const isOtherTime = TIME_DIMS.includes(otherDimension);
  return BASE_DIMENSION_OPTIONS.map((item) => {
    if (!('options' in item)) return item;
    return {
      ...item,
      options: item.options.map((opt) => ({
        ...opt,
        disabled:
          opt.value === otherDimension ||
          (isOtherTime && TIME_DIMS.includes(opt.value as DimensionKey)),
      })),
    };
  });
}

export function DiscoveryCoveragePage() {
  const navigate = useNavigate();
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // Data fetching
  const { data: personas = [], isLoading: personasLoading } = usePersonasQuery(teamId);
  const { data: allFeedback = [], isLoading: feedbackLoading } = useFeedbacksQuery(teamId);
  const { data: useCases = [], isLoading: useCasesLoading } = useUseCasesByTeamQuery(teamId);

  // Intake source details for source type resolution and date mapping
  const intakeSourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of allFeedback) {
      if (f.intakeSourceId) ids.add(f.intakeSourceId);
    }
    return ids.size > 0 ? Array.from(ids) : undefined;
  }, [allFeedback]);
  const { dataMap: intakeSourceMap } = useIntakeSourceDetailsQuery(intakeSourceIds);

  const intakeSourceDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [id, source] of Object.entries(intakeSourceMap)) {
      if (source.date) {
        map[id] = source.date;
      }
    }
    return map;
  }, [intakeSourceMap]);

  // Axis selection state
  const [xDimension, setXDimension] = useState<DimensionKey>('weeks');
  const [yDimension, setYDimension] = useState<DimensionKey>('personas');
  const [xSort, setXSort] = useState<SortDirection>('desc');
  const [ySort, setYSort] = useState<SortDirection>('desc');

  const xDimensionOptions = useMemo(
    () => buildDimensionOptions(yDimension),
    [yDimension],
  );
  const yDimensionOptions = useMemo(
    () => buildDimensionOptions(xDimension),
    [xDimension],
  );

  // Cross-tabulation
  const crossTabData = useCrossTabulation(
    xDimension,
    yDimension,
    allFeedback,
    personas,
    useCases,
    intakeSourceMap,
    intakeSourceDateMap,
    xSort,
    ySort,
  );

  const evidenceRows = useUseCaseEvidenceRows(useCases, allFeedback);

  const handleLabelClick = useCallback(
    (dimension: DimensionKey, key: string) => {
      switch (dimension) {
        case 'personas':
          navigate(`/discovery/organize/personas/${key}`);
          break;
        case 'useCases':
          navigate(`/discovery/organize/use-cases/${key}`);
          break;
        case 'tags':
          navigate(`/discovery/analyze/signal-strength?tag=${encodeURIComponent(key)}`);
          break;
      }
    },
    [navigate],
  );

  const isLoading = personasLoading || feedbackLoading || useCasesLoading;

  // Truncation notes
  const truncationNotes: string[] = [];
  if (crossTabData.yTruncated) {
    truncationNotes.push(
      `Showing ${ySort === 'desc' ? 'top' : 'bottom'} 30 of ${crossTabData.yTotalCount} ${DIMENSION_LABELS[yDimension].toLowerCase()}`,
    );
  }
  if (crossTabData.xTruncated) {
    truncationNotes.push(
      `Showing ${xSort === 'desc' ? 'top' : 'bottom'} 30 of ${crossTabData.xTotalCount} ${DIMENSION_LABELS[xDimension].toLowerCase()}`,
    );
  }

  return (
    <>
      <PageHeader title="Coverage" />

      <PageContent>
        {!teamId ? (
          <Empty description="No team selected. Please create an organization and team first." />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Section 1: Dynamic Heatmap */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--text)]">
                  Feedback Coverage
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)]">Rows</span>
                    <Select
                      value={yDimension}
                      onChange={(v) => setYDimension(v as DimensionKey)}
                      options={yDimensionOptions}
                      size="small"
                    />
                    <button
                      type="button"
                      onClick={() => setYSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                      className="flex items-center justify-center w-6 h-6 rounded-sm border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
                      title={ySort === 'desc' ? 'Showing highest first' : 'Showing lowest first'}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {ySort === 'desc' ? (
                          <path d="M6 2v8M3 7l3 3 3-3" />
                        ) : (
                          <path d="M6 10V2M3 5l3-3 3 3" />
                        )}
                      </svg>
                    </button>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">vs</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)]">Columns</span>
                    <Select
                      value={xDimension}
                      onChange={(v) => setXDimension(v as DimensionKey)}
                      options={xDimensionOptions}
                      size="small"
                    />
                    <button
                      type="button"
                      onClick={() => setXSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                      className="flex items-center justify-center w-6 h-6 rounded-sm border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
                      title={xSort === 'desc' ? 'Showing highest first' : 'Showing lowest first'}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {xSort === 'desc' ? (
                          <path d="M6 2v8M3 7l3 3 3-3" />
                        ) : (
                          <path d="M6 10V2M3 5l3-3 3 3" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <Card shadow={false} className="border-none">
                <DynamicHeatmap
                  data={crossTabData}
                  xDimension={xDimension}
                  yDimension={yDimension}
                  xLabel={DIMENSION_LABELS[xDimension]}
                  yLabel={DIMENSION_LABELS[yDimension]}
                  onLabelClick={handleLabelClick}
                />
                {truncationNotes.length > 0 && (
                  <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                    {truncationNotes.join(' · ')}
                  </div>
                )}
              </Card>
            </section>

            {/* Section 2: Use Case Evidence Coverage */}
            <section>
              <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
                Use Case Evidence Coverage
              </h2>
              <UseCaseEvidenceTable rows={evidenceRows} loading={false} />
            </section>
          </div>
        )}
      </PageContent>
    </>
  );
}
