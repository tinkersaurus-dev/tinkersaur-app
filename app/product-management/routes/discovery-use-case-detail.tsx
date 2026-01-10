/**
 * Discovery Use Case Detail Page
 * Displays use case details with linked personas and feedback
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { HydrationBoundary, useQueries } from '@tanstack/react-query';
import { FiArrowLeft, FiTrash2, FiUser, FiArchive, FiAlertTriangle, FiMessageCircle } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { Button, Card, Modal, Tabs, Empty, Table, EditableSection, EditableField } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { PersonaUseCase } from '~/core/entities/product-management/types';
import type { Feedback } from '~/core/entities/discovery/types';
import { useUseCaseQuery, useUseCasePersonasQuery, usePersonasQuery } from '../queries';
import { useDeleteUseCase, useCreatePersonaUseCase, useDeletePersonaUseCase, useUpdateUseCase } from '../mutations';
import { loadDiscoveryUseCaseDetail } from '../loaders';
import type { DiscoveryUseCaseDetailLoaderData } from '../loaders';
import type { Route } from './+types/discovery-use-case-detail';
import { useFeedbacksPaginatedQuery, useIntakeSourceQuery } from '~/discovery/queries';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { personaApi } from '~/core/entities/product-management/api';
import { intakeSourceApi } from '~/core/entities/discovery/api';
import { SOURCE_TYPES, type SourceTypeKey } from '~/core/entities/discovery/types/SourceType';

// Quote row type for the quotes table
interface QuoteRow {
  id: string;
  quote: string;
  source: string;
}

// Feedback row type for table display
interface FeedbackRow {
  id: string;
  content: string;
  quotes: string[];
  sourceName: string;
}

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { useCaseId } = params;
  if (!useCaseId) {
    throw new Response('Use Case ID required', { status: 400 });
  }
  return loadDiscoveryUseCaseDetail(useCaseId);
}

function DiscoveryUseCaseDetailContent() {
  const { useCaseId } = useParams<{ useCaseId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('quotes');

  // TanStack Query hooks
  const { data: useCase } = useUseCaseQuery(useCaseId);
  const { data: useCasePersonas = [] } = useUseCasePersonasQuery(useCaseId);
  const { data: allPersonas = [] } = usePersonasQuery(useCase?.teamId);
  const deleteUseCase = useDeleteUseCase();
  const createPersonaUseCase = useCreatePersonaUseCase();
  const deletePersonaUseCase = useDeletePersonaUseCase();
  const updateUseCase = useUpdateUseCase();

  // Basic info edit state
  const [isBasicInfoEditing, setIsBasicInfoEditing] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({ name: '', description: '' });
  const [basicInfoErrors, setBasicInfoErrors] = useState<Record<string, string>>({});

  // Fetch intake source for quote source display
  const { data: intakeSource } = useIntakeSourceQuery(useCase?.intakeSourceId);

  // Fetch feedback for this use case
  const { data: feedbackData } = useFeedbacksPaginatedQuery(
    useCase?.teamId && useCaseId ? {
      teamId: useCase.teamId,
      useCaseIds: [useCaseId],
      pageSize: 100,
    } : null
  );

  // Filter feedback by type
  const suggestions = useMemo(() =>
    feedbackData?.items.filter((f: Feedback) => f.type === 'suggestion') ?? [],
    [feedbackData]
  );
  const problems = useMemo(() =>
    feedbackData?.items.filter((f: Feedback) => f.type === 'problem') ?? [],
    [feedbackData]
  );

  // Fetch persona details for displaying names
  const personaIds = useMemo(() =>
    useCasePersonas.map((puc: PersonaUseCase) => puc.personaId),
    [useCasePersonas]
  );

  const personaQueries = useQueries({
    queries: personaIds.map((id: string) => ({
      queryKey: queryKeys.personas.detail(id),
      queryFn: () => personaApi.get(id),
      staleTime: STALE_TIMES.personas,
      enabled: !!id,
    })),
  });

  // Create a map of personaId -> personaName
  const personaNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    personaQueries.forEach((query, index) => {
      if (query.data) {
        map[personaIds[index]] = query.data.name;
      }
    });
    return map;
  }, [personaQueries, personaIds]);

  // Get unique intake source IDs from feedback
  const feedbackIntakeSourceIds = useMemo(() => {
    const ids = new Set<string>();
    feedbackData?.items.forEach((f: Feedback) => {
      if (f.intakeSourceId) {
        ids.add(f.intakeSourceId);
      }
    });
    return Array.from(ids);
  }, [feedbackData]);

  // Fetch intake sources for feedback
  const feedbackIntakeSourceQueries = useQueries({
    queries: feedbackIntakeSourceIds.map((id: string) => ({
      queryKey: queryKeys.intakeSources.detail(id),
      queryFn: () => intakeSourceApi.get(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!id,
    })),
  });

  // Create a map of intakeSourceId -> display name for feedback
  const feedbackIntakeSourceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    feedbackIntakeSourceQueries.forEach((query, index) => {
      if (query.data) {
        const source = query.data;
        if (source.meetingName) {
          map[feedbackIntakeSourceIds[index]] = source.meetingName;
        } else if (source.surveyName) {
          map[feedbackIntakeSourceIds[index]] = source.surveyName;
        } else if (source.ticketId) {
          map[feedbackIntakeSourceIds[index]] = `Ticket ${source.ticketId}`;
        } else {
          const sourceType = source.sourceType as SourceTypeKey;
          map[feedbackIntakeSourceIds[index]] = SOURCE_TYPES[sourceType]?.label || sourceType;
        }
      }
    });
    return map;
  }, [feedbackIntakeSourceQueries, feedbackIntakeSourceIds]);

  // Prepare feedback rows for table display
  const suggestionRows = useMemo((): FeedbackRow[] => {
    return suggestions.map((f: Feedback) => ({
      id: f.id,
      content: f.content,
      quotes: f.quotes,
      sourceName: f.intakeSourceId ? feedbackIntakeSourceNameMap[f.intakeSourceId] || '—' : '—',
    }));
  }, [suggestions, feedbackIntakeSourceNameMap]);

  const problemRows = useMemo((): FeedbackRow[] => {
    return problems.map((f: Feedback) => ({
      id: f.id,
      content: f.content,
      quotes: f.quotes,
      sourceName: f.intakeSourceId ? feedbackIntakeSourceNameMap[f.intakeSourceId] || '—' : '—',
    }));
  }, [problems, feedbackIntakeSourceNameMap]);

  // Table columns for feedback
  const feedbackColumns: TableColumn<FeedbackRow>[] = [
    {
      key: 'content',
      title: 'Content',
      dataIndex: 'content',
      render: (value) => (
        <span className="text-xs text-[var(--text)]">{value as string}</span>
      ),
    },
    {
      key: 'quotes',
      title: 'Quotes',
      dataIndex: 'quotes',
      render: (value) => {
        const quotes = value as string[];
        if (quotes.length === 0) return <span className="text-sm text-[var(--text-muted)]">—</span>;
        return (
          <div className="space-y-1">
            {quotes.map((quote, i) => (
              <span
                key={i}
                className="text-xs text-[var(--text-muted)] italic"
              >
                "{quote}"
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'sourceName',
      title: 'Source',
      dataIndex: 'sourceName',
      width: 180,
      render: (value) => (
        <span className="text-xs text-[var(--text-muted)]">{value as string}</span>
      ),
    },
  ];

  // Helper to get source display name
  const getSourceDisplayName = useCallback((): string => {
    if (!intakeSource) return '—';
    if (intakeSource.meetingName) return intakeSource.meetingName;
    if (intakeSource.surveyName) return intakeSource.surveyName;
    if (intakeSource.ticketId) return `Ticket ${intakeSource.ticketId}`;
    const sourceType = intakeSource.sourceType as SourceTypeKey;
    return SOURCE_TYPES[sourceType]?.label || sourceType;
  }, [intakeSource]);

  // Prepare quotes data for table
  const quoteRows = useMemo((): QuoteRow[] => {
    if (!useCase?.quotes) return [];
    const sourceName = getSourceDisplayName();
    return useCase.quotes.map((quote, index) => ({
      id: `quote-${index}`,
      quote,
      source: sourceName,
    }));
  }, [useCase?.quotes, getSourceDisplayName]);

  // Table columns for quotes
  const quoteColumns: TableColumn<QuoteRow>[] = [
    {
      key: 'quote',
      title: 'Quote',
      dataIndex: 'quote',
      render: (value) => (
        <span className="italic text-[var(--text)]">"{value as string}"</span>
      ),
    },
    {
      key: 'source',
      title: 'Source',
      dataIndex: 'source',
      width: 250,
      render: (value) => (
        <span className="text-[var(--text-muted)]">{value as string}</span>
      ),
    },
  ];

  // Available personas for linking (filter out already linked ones)
  const availablePersonas = useMemo(() => {
    const linkedPersonaIds = new Set(personaIds);
    return allPersonas.filter(p => !linkedPersonaIds.has(p.id));
  }, [allPersonas, personaIds]);

  // Basic info edit handlers
  const handleBasicInfoEditToggle = () => {
    if (!isBasicInfoEditing && useCase) {
      setBasicInfoForm({
        name: useCase.name,
        description: useCase.description || '',
      });
      setBasicInfoErrors({});
    }
    setIsBasicInfoEditing(!isBasicInfoEditing);
  };

  const handleBasicInfoSave = async (): Promise<boolean> => {
    // Validate
    const errors: Record<string, string> = {};
    if (!basicInfoForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (basicInfoForm.name.length > 200) {
      errors.name = 'Name must be 200 characters or less';
    }
    if (basicInfoForm.description && basicInfoForm.description.length > 2000) {
      errors.description = 'Description must be 2000 characters or less';
    }

    if (Object.keys(errors).length > 0) {
      setBasicInfoErrors(errors);
      return false;
    }

    // Save
    try {
      await updateUseCase.mutateAsync({
        id: useCaseId!,
        updates: {
          name: basicInfoForm.name,
          description: basicInfoForm.description || undefined,
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
    navigate('/discovery/organize/use-cases');
  };

  const handleDeleteConfirm = async () => {
    if (useCaseId) {
      await deleteUseCase.mutateAsync(useCaseId);
      navigate('/discovery/organize/use-cases');
    }
    setIsDeleteModalOpen(false);
  };

  const handleLinkPersona = async (personaId: string) => {
    if (useCaseId) {
      await createPersonaUseCase.mutateAsync({
        personaId,
        useCaseId,
      });
    }
  };

  const handleUnlinkPersona = async (personaId: string) => {
    // Find the persona-use case association to delete
    const association = useCasePersonas.find(
      (puc: PersonaUseCase) => puc.useCaseId === useCaseId && puc.personaId === personaId
    );
    if (association) {
      await deletePersonaUseCase.mutateAsync(association.id);
    }
  };

  // Handle case where use case is not yet loaded
  if (!useCase) {
    return (
      <MainLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        </PageContent>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={`Use Case - ${useCase.name}`}
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
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <EditableSection
              title="Basic Information"
              isEditing={isBasicInfoEditing}
              onEditToggle={handleBasicInfoEditToggle}
              onSave={handleBasicInfoSave}
              onCancel={handleBasicInfoCancel}
              isSaving={updateUseCase.isPending}
              hasErrors={Object.keys(basicInfoErrors).length > 0}
            >
              <EditableField
                label="Name"
                value={isBasicInfoEditing ? basicInfoForm.name : useCase.name}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('name')}
                required
                error={basicInfoErrors.name}
                placeholder="Enter use case name"
                maxLength={200}
              />
              <EditableField
                label="Description"
                value={isBasicInfoEditing ? basicInfoForm.description : useCase.description}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('description')}
                type="textarea"
                rows={4}
                error={basicInfoErrors.description}
                placeholder="Describe this use case..."
                maxLength={2000}
              />
            </EditableSection>

            {/* Tabbed Section: Quotes, Suggestions, Problems */}
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
                  {
                    key: 'suggestions',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiArchive className="w-3.5 h-3.5 text-blue-500" />
                        Suggestions ({suggestions.length})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        {suggestionRows.length === 0 ? (
                          <Empty
                            image="simple"
                            description="No suggestions for this use case"
                          />
                        ) : (
                          <Table
                            columns={feedbackColumns}
                            dataSource={suggestionRows}
                            rowKey="id"
                            pagination={false}
                          />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'problems',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiAlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        Problems ({problems.length})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        {problemRows.length === 0 ? (
                          <Empty
                            image="simple"
                            description="No problems for this use case"
                          />
                        ) : (
                          <Table
                            columns={feedbackColumns}
                            dataSource={problemRows}
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

          {/* Sidebar - Personas */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiUser className="text-[var(--primary)]" />
                  <h3 className="text-md font-semibold text-[var(--text)]">Personas</h3>
                </div>
                <Button
                  variant="default"
                  size="small"
                  onClick={() => setIsLinkModalOpen(true)}
                >
                  Link
                </Button>
              </div>

              {useCasePersonas.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No personas linked to this use case.
                </p>
              ) : (
                <ul className="space-y-2">
                  {useCasePersonas.map((puc: PersonaUseCase) => (
                    <li
                      key={puc.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                      <span className="text-sm text-[var(--text)] truncate">
                        {personaNameMap[puc.personaId] || 'Loading...'}
                      </span>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleUnlinkPersona(puc.personaId)}
                      >
                        Unlink
                      </Button>
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
        title="Delete Use Case"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
      >
        <p className="text-[var(--text)]">
          Are you sure you want to delete <strong>{useCase.name}</strong>?
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          This will also remove all links to personas and requirements. This action cannot be undone.
        </p>
      </Modal>

      {/* Link Persona Modal */}
      <Modal
        title="Link Persona"
        open={isLinkModalOpen}
        onCancel={() => setIsLinkModalOpen(false)}
        footer={null}
      >
        {availablePersonas.length === 0 ? (
          <p className="text-[var(--text-muted)]">
            No available personas to link. All personas are already linked.
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {availablePersonas.map((persona) => (
              <li
                key={persona.id}
                className="flex items-center justify-between p-3 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{persona.name}</p>
                  {persona.role && (
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">
                      {persona.role}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    handleLinkPersona(persona.id);
                  }}
                >
                  Link
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </MainLayout>
  );
}

export default function DiscoveryUseCaseDetailPage() {
  const { dehydratedState } = useLoaderData<DiscoveryUseCaseDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <DiscoveryUseCaseDetailContent />
    </HydrationBoundary>
  );
}
