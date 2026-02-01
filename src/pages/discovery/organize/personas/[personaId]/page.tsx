/**
 * Persona Detail Page
 * Displays full persona information with linked use cases
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { FiArrowLeft, FiTrash2, FiLink, FiTarget, FiAlertCircle, FiArchive, FiAlertTriangle, FiMessageCircle } from 'react-icons/fi';
import { PageHeader, PageContent } from '@/shared/ui';
import { MainLayout } from '@/app/layouts/MainLayout';
import { Button, Card, Modal, Tabs, Empty, Table, EditableSection, EditableField } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import type { Feedback } from '@/entities/feedback';
import type { QuoteWithSource } from '@/entities/quote';
import type { UseCase } from '@/entities/use-case';
import type { LoaderFunctionArgs } from 'react-router';
import { usePersonaQuery, useDeletePersona, useUpdatePersona } from '@/entities/persona';
import { useUseCasesByTeamQuery } from '@/entities/use-case';
import { loadPersonaDetail } from './loader';
import type { PersonaDetailLoaderData } from './loader';
import { useFeedbacksPaginatedQuery, useIntakeSourceDetailsQuery } from '@/features/intake-analysis';

// Feedback row type for table display
interface FeedbackRow {
  id: string;
  content: string;
  quotes: QuoteWithSource[];
  sourceName: string;
  weight: number;
}

// Quote row type for table display
interface QuoteRow {
  id: string;
  quote: string;
  source: string;
}

// Quote table columns
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

// Loader function for SSR data fetching
export async function loader({ params }: LoaderFunctionArgs) {
  const personaId = params.personaId;
  if (!personaId) {
    throw new Response('Persona ID required', { status: 400 });
  }
  return loadPersonaDetail(personaId);
}

function PersonaDetailContent() {
  const { personaId } = useParams<{ personaId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('goals-painpoints');

  // TanStack Query hooks
  const { data: persona } = usePersonaQuery(personaId);
  const deletePersona = useDeletePersona();
  const updatePersona = useUpdatePersona();

  // Fetch use cases for linking
  const { data: allUseCases = [] } = useUseCasesByTeamQuery(persona?.teamId);

  // Basic info edit state
  const [isBasicInfoEditing, setIsBasicInfoEditing] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({ name: '', role: '', description: '' });
  const [basicInfoErrors, setBasicInfoErrors] = useState<Record<string, string>>({});

  // Fetch feedback for this persona
  const { data: feedbackData } = useFeedbacksPaginatedQuery(
    persona?.teamId && personaId ? {
      teamId: persona.teamId,
      personaIds: [personaId],
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

  // Get linked use case IDs from the persona
  const linkedUseCaseIds = useMemo(() => new Set(persona?.useCaseIds ?? []), [persona?.useCaseIds]);

  // Get linked use cases for displaying names
  const linkedUseCases = useMemo(() => {
    return allUseCases.filter((uc: UseCase) => linkedUseCaseIds.has(uc.id));
  }, [allUseCases, linkedUseCaseIds]);

  // Available use cases for linking (filter out already linked ones)
  const availableUseCases = useMemo(() => {
    return allUseCases.filter((uc: UseCase) => !linkedUseCaseIds.has(uc.id));
  }, [allUseCases, linkedUseCaseIds]);

  // Get unique intake source IDs from feedback
  const intakeSourceIds = useMemo(() => {
    const ids = new Set<string>();
    feedbackData?.items.forEach((f: Feedback) => {
      if (f.intakeSourceId) {
        ids.add(f.intakeSourceId);
      }
    });
    return Array.from(ids);
  }, [feedbackData]);

  // Fetch intake sources for feedback - using batch hook for clean name mapping
  const { nameMap: intakeSourceNameMap } = useIntakeSourceDetailsQuery(intakeSourceIds);

  // Prepare feedback rows for table display, sorted by weight descending
  const suggestionRows = useMemo((): FeedbackRow[] => {
    return suggestions
      .map((f: Feedback) => ({
        id: f.id,
        content: f.content,
        quotes: f.quotes,
        sourceName: f.intakeSourceId ? intakeSourceNameMap[f.intakeSourceId] || '—' : '—',
        weight: f.weight,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [suggestions, intakeSourceNameMap]);

  const problemRows = useMemo((): FeedbackRow[] => {
    return problems
      .map((f: Feedback) => ({
        id: f.id,
        content: f.content,
        quotes: f.quotes,
        sourceName: f.intakeSourceId ? intakeSourceNameMap[f.intakeSourceId] || '—' : '—',
        weight: f.weight,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [problems, intakeSourceNameMap]);

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
      key: 'weight',
      title: 'Weight',
      dataIndex: 'weight',
      width: 80,
      render: (value) => {
        const weight = value as number;
        if (weight === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>;
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
            +{weight}
          </span>
        );
      },
    },
    {
      key: 'quotes',
      title: 'Quotes',
      dataIndex: 'quotes',
      render: (value) => {
        const quotes = value as QuoteWithSource[];
        if (quotes.length === 0) return <span className="text-sm text-[var(--text-muted)]">—</span>;
        return (
          <div className="space-y-1">
            {quotes.map((quote) => (
              <span
                key={quote.id}
                className="text-xs text-[var(--text-muted)] italic"
              >
                "{quote.content}"
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

  // Basic info edit handlers
  const handleBasicInfoEditToggle = () => {
    if (!isBasicInfoEditing && persona) {
      setBasicInfoForm({
        name: persona.name,
        role: persona.role || '',
        description: persona.description || '',
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
    if (basicInfoForm.role && basicInfoForm.role.length > 200) {
      errors.role = 'Role must be 200 characters or less';
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
      await updatePersona.mutateAsync({
        id: personaId!,
        updates: {
          name: basicInfoForm.name,
          role: basicInfoForm.role || undefined,
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
    navigate('/discovery/organize/personas');
  };

  const handleDeleteConfirm = async () => {
    if (personaId) {
      await deletePersona.mutateAsync(personaId);
      navigate('/discovery/organize/personas');
    }
    setIsDeleteModalOpen(false);
  };

  const handleLinkUseCase = async (useCaseId: string) => {
    if (personaId && persona) {
      const newUseCaseIds = [...(persona.useCaseIds ?? []), useCaseId];
      await updatePersona.mutateAsync({
        id: personaId,
        updates: { useCaseIds: newUseCaseIds },
      });
    }
  };

  const handleUnlinkUseCase = async (useCaseId: string) => {
    if (personaId && persona) {
      const newUseCaseIds = (persona.useCaseIds ?? []).filter((id) => id !== useCaseId);
      await updatePersona.mutateAsync({
        id: personaId,
        updates: { useCaseIds: newUseCaseIds },
      });
    }
  };

  // Handle case where persona is not yet loaded
  if (!persona) {
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
        title={`Persona - ${persona.name}`}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 qhd:grid-cols-4 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 qhd:col-span-3 space-y-6">
            {/* Basic Info Card */}
            <EditableSection
              title="Basic Information"
              isEditing={isBasicInfoEditing}
              onEditToggle={handleBasicInfoEditToggle}
              onSave={handleBasicInfoSave}
              onCancel={handleBasicInfoCancel}
              isSaving={updatePersona.isPending}
              hasErrors={Object.keys(basicInfoErrors).length > 0}
            >
              <EditableField
                label="Name"
                value={isBasicInfoEditing ? basicInfoForm.name : persona.name}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('name')}
                required
                error={basicInfoErrors.name}
                placeholder="Enter persona name"
                maxLength={200}
              />
              <EditableField
                label="Role"
                value={isBasicInfoEditing ? basicInfoForm.role : persona.role}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('role')}
                error={basicInfoErrors.role}
                placeholder="e.g., Product Manager, Developer"
                maxLength={200}
              />
              <EditableField
                label="Description"
                value={isBasicInfoEditing ? basicInfoForm.description : persona.description}
                isEditing={isBasicInfoEditing}
                onChange={updateBasicInfoField('description')}
                type="textarea"
                rows={4}
                error={basicInfoErrors.description}
                placeholder="Describe this persona..."
                maxLength={2000}
              />
            </EditableSection>

            {/* Tabbed Section: Goals/Pain Points, Suggestions, Problems */}
            <Card>
              <Tabs
                type="line"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'goals-painpoints',
                    label: 'Goals & Pain Points',
                    children: (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {/* Goals column */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FiTarget className="text-green-500" />
                            <h4 className="text-base font-semibold text-[var(--text)]">Goals</h4>
                          </div>
                          {persona.goals.length === 0 ? (
                            <p className="text-[var(--text-muted)] text-xs">No goals defined.</p>
                          ) : (
                            <ul className="space-y-2">
                              {persona.goals.map((goal) => (
                                <li key={goal} className="flex gap-2 text-sm text-[var(--text)]">
                                  <span className="text-xs text-green-500 shrink-0">•</span>
                                  <span className="text-xs">{goal}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {/* Pain Points column */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FiAlertCircle className="text-orange-500" />
                            <h4 className="text-base font-semibold text-[var(--text)]">Pain Points</h4>
                          </div>
                          {persona.painPoints.length === 0 ? (
                            <p className="text-[var(--text-muted)] text-xs">No pain points defined.</p>
                          ) : (
                            <ul className="space-y-2">
                              {persona.painPoints.map((painPoint) => (
                                <li key={painPoint} className="flex gap-2 text-sm text-[var(--text)]">
                                  <span className="text-xs text-orange-500 shrink-0">•</span>
                                  <span className="text-xs">{painPoint}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
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
                            description="No suggestions for this persona"
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
                            description="No problems for this persona"
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
                  {
                    key: 'quotes',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiMessageCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Supporting Quotes ({persona.quotes?.length || 0})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        {(!persona.quotes || persona.quotes.length === 0) ? (
                          <Empty
                            image="simple"
                            description="No supporting quotes for this persona"
                          />
                        ) : (
                          <Table
                            columns={quoteColumns}
                            dataSource={persona.quotes.map((q) => ({
                              id: q.id,
                              quote: q.content,
                              source: q.sourceName ?? 'Unknown source',
                            }))}
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

          {/* Sidebar - Use Cases */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiLink className="text-[var(--primary)]" />
                  <h3 className="text-md font-semibold text-[var(--text)]">Use Cases</h3>
                </div>
                <Button
                  variant="default"
                  size="small"
                  onClick={() => setIsLinkModalOpen(true)}
                >
                  Link
                </Button>
              </div>

              {linkedUseCases.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No use cases linked to this persona.
                </p>
              ) : (
                <ul className="space-y-2">
                  {linkedUseCases.map((useCase: UseCase) => (
                    <li
                      key={useCase.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                      <span className="text-sm text-[var(--text)] truncate">
                        {useCase.name}
                      </span>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleUnlinkUseCase(useCase.id)}
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
        title="Delete Persona"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
      >
        <p className="text-[var(--text)]">
          Are you sure you want to delete <strong>{persona.name}</strong>?
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          This will also remove all links to use cases. This action cannot be undone.
        </p>
      </Modal>

      {/* Link Use Case Modal */}
      <Modal
        title="Link Use Case"
        open={isLinkModalOpen}
        onCancel={() => setIsLinkModalOpen(false)}
        footer={null}
      >
        {availableUseCases.length === 0 ? (
          <p className="text-[var(--text-muted)]">
            No available use cases to link. All use cases are already linked.
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {availableUseCases.map((useCase: UseCase) => (
              <li
                key={useCase.id}
                className="flex items-center justify-between p-3 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{useCase.name}</p>
                  {useCase.description && (
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">
                      {useCase.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    handleLinkUseCase(useCase.id);
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

export default function PersonaDetailPage() {
  const { dehydratedState } = useLoaderData<PersonaDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <PersonaDetailContent />
    </HydrationBoundary>
  );
}
