/**
 * Feedback Detail Page
 * Displays full feedback information with quotes, children, and linked entities
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLoaderData, Link } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { FiArrowLeft, FiTrash2, FiUser, FiLink, FiMessageCircle, FiCopy } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { Button, Card, Modal, Tag, Empty, Tabs, Table, EditableSection, EditableField } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { FeedbackPersona, FeedbackUseCase } from '~/core/entities/discovery/types';
import { FEEDBACK_TYPE_CONFIG } from '~/core/entities/discovery/types/Feedback';
import { SOURCE_TYPES, type SourceTypeKey } from '~/core/entities/discovery/types/SourceType';
import {
  useFeedbackWithChildrenQuery,
  useFeedbackPersonasQuery,
  useFeedbackUseCasesQuery,
  useIntakeSourceDetailsQuery,
} from '../queries';
import { useDeleteFeedback, useUpdateFeedback } from '../mutations';
import { loadFeedbackDetail } from '~/product-management/loaders';
import type { FeedbackDetailLoaderData } from '~/product-management/loaders';
import type { Route } from './+types/feedback-detail';
import { usePersonaDetailsQuery, useUseCaseDetailsQuery } from '~/product-management/queries';

// Quote row type for the quotes table
interface QuoteRow {
  id: string;
  quote: string;
  source: string;
}

// Child feedback row type for the duplicates table
interface DuplicateRow {
  id: string;
  content: string;
  type: string;
  intakeSourceId: string | null;
  createdAt: Date;
}

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { feedbackId } = params;
  if (!feedbackId) {
    throw new Response('Feedback ID required', { status: 400 });
  }
  return loadFeedbackDetail(feedbackId);
}

function FeedbackDetailContent() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('quotes');

  // TanStack Query hooks
  const { data: feedback } = useFeedbackWithChildrenQuery(feedbackId);
  const { data: feedbackPersonas = [] } = useFeedbackPersonasQuery(feedbackId);
  const { data: feedbackUseCases = [] } = useFeedbackUseCasesQuery(feedbackId);
  const deleteFeedback = useDeleteFeedback();
  const updateFeedback = useUpdateFeedback();

  // Basic info edit state
  const [isBasicInfoEditing, setIsBasicInfoEditing] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({ content: '' });
  const [basicInfoErrors, setBasicInfoErrors] = useState<Record<string, string>>({});

  // Get IDs for batch loading names
  const personaIds = useMemo(
    () => feedbackPersonas.map((fp: FeedbackPersona) => fp.personaId),
    [feedbackPersonas]
  );
  const useCaseIds = useMemo(
    () => feedbackUseCases.map((fuc: FeedbackUseCase) => fuc.useCaseId),
    [feedbackUseCases]
  );

  // Get intake source IDs from parent and children for batch loading
  const allIntakeSourceIds = useMemo(() => {
    const ids: string[] = [];
    if (feedback?.intakeSourceId) {
      ids.push(feedback.intakeSourceId);
    }
    if (feedback?.children) {
      feedback.children.forEach((child) => {
        if (child.intakeSourceId) {
          ids.push(child.intakeSourceId);
        }
      });
    }
    return [...new Set(ids)]; // Deduplicate
  }, [feedback]);

  // Batch load persona, use case, and intake source details using dedicated hooks
  const { dataMap: personaDataMap } = usePersonaDetailsQuery(personaIds);
  const { dataMap: useCaseDataMap } = useUseCaseDetailsQuery(useCaseIds);
  const { dataMap: intakeSourceMap } = useIntakeSourceDetailsQuery(allIntakeSourceIds);

  // Filter personas and use cases to only show those that still exist (not merged/deleted)
  const validPersonas = useMemo(
    () => feedbackPersonas.filter((fp: FeedbackPersona) => personaDataMap[fp.personaId]),
    [feedbackPersonas, personaDataMap]
  );

  const validUseCases = useMemo(
    () => feedbackUseCases.filter((fuc: FeedbackUseCase) => useCaseDataMap[fuc.useCaseId]),
    [feedbackUseCases, useCaseDataMap]
  );

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

  // Compile all quotes from parent and children
  const allQuotes = useMemo((): QuoteRow[] => {
    if (!feedback) return [];

    const quotes: QuoteRow[] = [];

    // Parent quotes
    feedback.quotes.forEach((quote, index) => {
      quotes.push({
        id: `parent-${index}`,
        quote,
        source: getSourceDisplayName(feedback.intakeSourceId),
      });
    });

    // Child quotes
    feedback.children?.forEach((child) => {
      child.quotes.forEach((quote, index) => {
        quotes.push({
          id: `child-${child.id}-${index}`,
          quote,
          source: getSourceDisplayName(child.intakeSourceId),
        });
      });
    });

    return quotes;
  }, [feedback, getSourceDisplayName]);

  // Prepare duplicate feedback rows
  const duplicateRows = useMemo((): DuplicateRow[] => {
    if (!feedback?.children) return [];
    return feedback.children.map((child) => ({
      id: child.id,
      content: child.content,
      type: child.type,
      intakeSourceId: child.intakeSourceId,
      createdAt: child.createdAt,
    }));
  }, [feedback]);

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

  // Table columns for duplicates
  const duplicateColumns: TableColumn<DuplicateRow>[] = [
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      width: 100,
      render: (value) => {
        const type = value as string;
        const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
        return (
          <Tag color={config?.color as 'blue' | 'red' | 'orange' | 'green' | 'purple'}>
            {config?.label || type}
          </Tag>
        );
      },
    },
    {
      key: 'content',
      title: 'Content',
      dataIndex: 'content',
      render: (value) => (
        <span className="line-clamp-2 text-sm text-[var(--text)]">{value as string}</span>
      ),
    },
    {
      key: 'source',
      title: 'Source',
      dataIndex: 'intakeSourceId',
      width: 180,
      render: (value) => (
        <span className="text-sm text-[var(--text-muted)]">
          {getSourceDisplayName(value as string | null)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataIndex: 'createdAt',
      width: 100,
      render: (value) => (
        <span className="text-sm text-[var(--text-muted)]">
          {new Date(value as Date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Basic info edit handlers
  const handleBasicInfoEditToggle = () => {
    if (!isBasicInfoEditing && feedback) {
      setBasicInfoForm({
        content: feedback.content,
      });
      setBasicInfoErrors({});
    }
    setIsBasicInfoEditing(!isBasicInfoEditing);
  };

  const handleBasicInfoSave = async (): Promise<boolean> => {
    // Validate
    const errors: Record<string, string> = {};
    if (!basicInfoForm.content.trim()) {
      errors.content = 'Content is required';
    } else if (basicInfoForm.content.length > 2000) {
      errors.content = 'Content must be 2000 characters or less';
    }

    if (Object.keys(errors).length > 0) {
      setBasicInfoErrors(errors);
      return false;
    }

    // Save
    try {
      await updateFeedback.mutateAsync({
        id: feedbackId!,
        updates: {
          content: basicInfoForm.content,
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
    navigate('/discovery/organize/feedback');
  };

  const handleDeleteConfirm = async () => {
    if (feedbackId) {
      await deleteFeedback.mutateAsync(feedbackId);
      navigate('/discovery/organize/feedback');
    }
    setIsDeleteModalOpen(false);
  };

  // Handle loading state
  if (!feedback) {
    return (
      <MainLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        </PageContent>
      </MainLayout>
    );
  }

  const typeConfig = FEEDBACK_TYPE_CONFIG[feedback.type];

  return (
    <MainLayout>
      <PageHeader
        title={`Feedback - ${typeConfig.label}`}
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
            {/* Feedback Content Card */}
            <EditableSection
              title="Basic Information"
              isEditing={isBasicInfoEditing}
              onEditToggle={handleBasicInfoEditToggle}
              onSave={handleBasicInfoSave}
              onCancel={handleBasicInfoCancel}
              isSaving={updateFeedback.isPending}
              hasErrors={Object.keys(basicInfoErrors).length > 0}
            >
              <EditableField
                label="Content"
                value={isBasicInfoEditing ? basicInfoForm.content : feedback.content}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('content')}
                required
                error={basicInfoErrors.content}
                type="textarea"
                rows={4}
                placeholder="Describe the feedback..."
                maxLength={2000}
              />
            </EditableSection>

            {/* Tabbed Section: Supporting Quotes, Duplicate Feedback */}
            <Card>
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
                        Supporting Quotes ({allQuotes.length})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        {allQuotes.length === 0 ? (
                          <Empty image="simple" description="No supporting quotes" />
                        ) : (
                          <Table
                            columns={quoteColumns}
                            dataSource={allQuotes}
                            rowKey="id"
                            pagination={false}
                          />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'duplicates',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiCopy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        Duplicate Feedback ({duplicateRows.length})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        {duplicateRows.length === 0 ? (
                          <Empty image="simple" description="No duplicate feedback" />
                        ) : (
                          <Table
                            columns={duplicateColumns}
                            dataSource={duplicateRows}
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
            {/* Linked Personas */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiUser className="text-[var(--primary)]" />
                  <h3 className="text-md font-semibold text-[var(--text)]">Personas</h3>
                </div>
              </div>

              {validPersonas.length === 0 ? (
                <p className="text-[var(--text-muted)] text-xs">
                  No personas linked to this feedback.
                </p>
              ) : (
                <ul className="space-y-2">
                  {validPersonas.map((fp: FeedbackPersona) => (
                    <li
                      key={fp.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                      <Link
                        to={`/discovery/organize/personas/${fp.personaId}`}
                        className="text-sm text-[var(--text)] hover:text-[var(--primary)] truncate"
                      >
                        {personaDataMap[fp.personaId]?.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Linked Use Cases */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiLink className="text-[var(--primary)]" />
                  <h3 className="text-md font-semibold text-[var(--text)]">Use Cases</h3>
                </div>
              </div>

              {validUseCases.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No use cases linked to this feedback.
                </p>
              ) : (
                <ul className="space-y-2">
                  {validUseCases.map((fuc: FeedbackUseCase) => (
                    <li
                      key={fuc.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                      <Link
                        to={`/discovery/organize/use-cases/${fuc.useCaseId}`}
                        className="text-sm text-[var(--text)] hover:text-[var(--primary)] truncate"
                      >
                        {useCaseDataMap[fuc.useCaseId]?.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </PageContent>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Feedback"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
      >
        <p className="text-[var(--text)]">
          Are you sure you want to delete this feedback?
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          This will also remove all links to personas and use cases. This action cannot be undone.
        </p>
      </Modal>
    </MainLayout>
  );
}

export default function FeedbackDetailPage() {
  const { dehydratedState } = useLoaderData<FeedbackDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <FeedbackDetailContent />
    </HydrationBoundary>
  );
}
