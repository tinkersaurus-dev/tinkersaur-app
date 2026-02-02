/**
 * Outcome Detail Page
 * Displays full outcome information with quotes and linked solution
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLoaderData, Link } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { FiArrowLeft, FiTrash2, FiMessageCircle, FiTarget } from 'react-icons/fi';
import { PageHeader, PageContent } from '@/shared/ui';
import { Button, Card, Modal, Empty, Tabs, Table, EditableSection, EditableField } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import { SOURCE_TYPES, type SourceTypeKey } from '@/entities/source-type';
import type { LoaderFunctionArgs } from 'react-router';
import {
  useOutcomeQuery,
  useIntakeSourceDetailsQuery,
  useDeleteOutcome,
  useUpdateOutcome,
} from '@/features/intake-analysis';
import { loadOutcomeDetail } from './loader';
import type { OutcomeDetailLoaderData } from './loader';
import { useSolutionsQuery } from '@/entities/solution';

// Quote row type for the quotes table
interface QuoteRow {
  id: string;
  quote: string;
  source: string;
}

// Loader function for SSR data fetching
export async function loader({ params }: LoaderFunctionArgs) {
  const outcomeId = params.outcomeId;
  if (!outcomeId) {
    throw new Response('Outcome ID required', { status: 400 });
  }
  return loadOutcomeDetail(outcomeId);
}

function OutcomeDetailContent() {
  const { outcomeId } = useParams<{ outcomeId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('quotes');

  // TanStack Query hooks
  const { data: outcome } = useOutcomeQuery(outcomeId);
  const deleteOutcome = useDeleteOutcome();
  const updateOutcome = useUpdateOutcome();

  // Fetch solutions for the team to show linked solution
  const { data: solutions = [] } = useSolutionsQuery(outcome?.teamId);

  // Basic info edit state
  const [isBasicInfoEditing, setIsBasicInfoEditing] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({ description: '', target: '' });
  const [basicInfoErrors, setBasicInfoErrors] = useState<Record<string, string>>({});

  // Get linked solution
  const linkedSolution = useMemo(() => {
    if (!outcome?.solutionId) return null;
    return solutions.find((s) => s.id === outcome.solutionId);
  }, [solutions, outcome]);

  // Get intake source ID for batch loading
  const intakeSourceIds = useMemo(() => {
    return outcome?.intakeSourceId ? [outcome.intakeSourceId] : [];
  }, [outcome]);

  // Batch load intake source details
  const { dataMap: intakeSourceMap } = useIntakeSourceDetailsQuery(intakeSourceIds);

  // Helper to get source display name
  const getSourceDisplayName = useCallback((intakeSourceId: string | null): string => {
    if (!intakeSourceId) return '—';
    const source = intakeSourceMap[intakeSourceId];
    if (!source) return 'Loading...';
    if (source.meetingName) return source.meetingName;
    if (source.surveyName) return source.surveyName;
    if (source.ticketId) return `Ticket ${source.ticketId}`;
    const sourceType = source.sourceType as SourceTypeKey;
    return SOURCE_TYPES[sourceType]?.label || sourceType;
  }, [intakeSourceMap]);

  // Compile quotes
  const quoteRows = useMemo((): QuoteRow[] => {
    if (!outcome?.quotes) return [];

    return outcome.quotes.map((quote) => ({
      id: quote.id,
      quote: quote.content,
      source: quote.sourceName ?? getSourceDisplayName(outcome.intakeSourceId),
    }));
  }, [outcome, getSourceDisplayName]);

  // Table columns for quotes
  const quoteColumns: TableColumn<QuoteRow>[] = [
    {
      key: 'quote',
      title: 'Quote',
      dataIndex: 'quote',
      render: (value) => (
        <span className="text-xs italic text-[var(--text)]">"{value as string}"</span>
      ),
    },
    {
      key: 'source',
      title: 'Source',
      dataIndex: 'source',
      width: 180,
      render: (value) => (
        <span className="text-xs text-[var(--text-muted)]">{value as string}</span>
      ),
    },
  ];

  // Basic info edit handlers
  const handleBasicInfoEditToggle = () => {
    if (!isBasicInfoEditing && outcome) {
      setBasicInfoForm({
        description: outcome.description,
        target: outcome.target || '',
      });
      setBasicInfoErrors({});
    }
    setIsBasicInfoEditing(!isBasicInfoEditing);
  };

  const handleBasicInfoSave = async (): Promise<boolean> => {
    // Validate
    const errors: Record<string, string> = {};
    if (!basicInfoForm.description.trim()) {
      errors.description = 'Description is required';
    } else if (basicInfoForm.description.length > 2000) {
      errors.description = 'Description must be 2000 characters or less';
    }
    if (basicInfoForm.target && basicInfoForm.target.length > 500) {
      errors.target = 'Target must be 500 characters or less';
    }

    if (Object.keys(errors).length > 0) {
      setBasicInfoErrors(errors);
      return false;
    }

    // Save
    try {
      await updateOutcome.mutateAsync({
        id: outcomeId!,
        updates: {
          description: basicInfoForm.description,
          target: basicInfoForm.target || undefined,
        },
      });
      setIsBasicInfoEditing(false);
      return true;
    } catch {
      return false;
    }
  };

  const handleBasicInfoCancel = () => {
    setIsBasicInfoEditing(false);
    setBasicInfoErrors({});
  };

  const updateBasicInfoField = (field: string) => (value: string) => {
    setBasicInfoForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (basicInfoErrors[field]) {
      setBasicInfoErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBack = () => {
    navigate('/discovery/organize/outcomes');
  };

  const handleDeleteConfirm = async () => {
    if (outcomeId) {
      await deleteOutcome.mutateAsync(outcomeId);
      navigate('/discovery/organize/outcomes');
    }
    setIsDeleteModalOpen(false);
  };

  // Handle loading state
  if (!outcome) {
    return (
      <PageContent>
        <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
      </PageContent>
    );
  }

  // Truncate description for title
  const titleDescription = outcome.description.length > 50
    ? `${outcome.description.slice(0, 50)}...`
    : outcome.description;

  return (
    <>
      <PageHeader
        title={`Outcome - ${titleDescription}`}
        extra={
          <div className="flex gap-2">
            <Button variant="default" icon={<FiArrowLeft />} onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="danger"
              icon={<FiTrash2 />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Outcome Content Card */}
            <EditableSection
              title="Basic Information"
              isEditing={isBasicInfoEditing}
              onEditToggle={handleBasicInfoEditToggle}
              onSave={handleBasicInfoSave}
              onCancel={handleBasicInfoCancel}
              isSaving={updateOutcome.isPending}
              hasErrors={Object.keys(basicInfoErrors).length > 0}
            >
              <EditableField
                label="Description"
                value={isBasicInfoEditing ? basicInfoForm.description : outcome.description}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('description')}
                required
                error={basicInfoErrors.description}
                type="textarea"
                rows={4}
                placeholder="Describe the desired outcome..."
                maxLength={2000}
              />
              <EditableField
                label="Target"
                value={isBasicInfoEditing ? basicInfoForm.target : outcome.target}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('target')}
                error={basicInfoErrors.target}
                placeholder="e.g., Reduce churn by 20%"
                maxLength={500}
              />
            </EditableSection>

            {/* Tabbed Section: Supporting Quotes */}
            <Card shadow={false}>
              <Tabs
                type="line"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'quotes',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiMessageCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Supporting Quotes ({quoteRows.length})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        {quoteRows.length === 0 ? (
                          <Empty image="simple" description="No supporting quotes" />
                        ) : (
                          <Table
                            columns={quoteColumns}
                            dataSource={quoteRows}
                            rowKey="id"
                            pagination={false}
                          />
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Linked Solution */}
            <Card shadow={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiTarget className="text-[var(--primary)]" />
                  <h3 className="text-md font-semibold text-[var(--text)]">Solution</h3>
                </div>
              </div>

              {!linkedSolution ? (
                <p className="text-[var(--text-muted)] text-xs">
                  No solution linked to this outcome.
                </p>
              ) : (
                <div className="p-2 rounded bg-[var(--bg-secondary)]">
                  <Link
                    to={`/solutions/scope/${linkedSolution.id}`}
                    className="text-sm text-[var(--text)] hover:text-[var(--primary)]"
                  >
                    {linkedSolution.name}
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageContent>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Outcome"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
      >
        <p className="text-[var(--text)]">
          Are you sure you want to delete this outcome?
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}

export default function OutcomeDetailPage() {
  const { dehydratedState } = useLoaderData<OutcomeDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <OutcomeDetailContent />
    </HydrationBoundary>
  );
}
