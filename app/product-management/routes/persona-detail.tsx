/**
 * Persona Detail Page
 * Displays full persona information with linked use cases
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { FiArrowLeft, FiTrash2, FiLink, FiTarget, FiAlertCircle, FiArchive, FiAlertTriangle } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { Button, Card, Modal, Tabs, Empty, Table, EditableSection, EditableField } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { PersonaUseCase } from '~/core/entities/product-management/types';
import type { Feedback } from '~/core/entities/discovery/types';
import { usePersonaQuery, usePersonaUseCasesQuery, useUseCaseDetailsQuery } from '../queries';
import { useDeletePersona, useCreatePersonaUseCase, useDeletePersonaUseCase, useUpdatePersona } from '../mutations';
import { loadPersonaDetail } from '../loaders';
import type { PersonaDetailLoaderData } from '../loaders';
import type { Route } from './+types/persona-detail';
import { useFeedbacksPaginatedQuery, useIntakeSourceDetailsQuery } from '~/discovery/queries';
import type { QuoteWithSource } from '~/core/entities/discovery/types/Quote';

// Feedback row type for table display
interface FeedbackRow {
  id: string;
  content: string;
  quotes: QuoteWithSource[];
  sourceName: string;
}

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { personaId } = params;
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
  const { data: personaUseCases = [] } = usePersonaUseCasesQuery(personaId);
  const deletePersona = useDeletePersona();
  const createPersonaUseCase = useCreatePersonaUseCase();
  const deletePersonaUseCase = useDeletePersonaUseCase();
  const updatePersona = useUpdatePersona();

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

  // Fetch use case details for displaying names
  const useCaseIds = useMemo(() =>
    personaUseCases.map((puc: PersonaUseCase) => puc.useCaseId),
    [personaUseCases]
  );

  const { nameMap: useCaseNameMap } = useUseCaseDetailsQuery(useCaseIds);

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

  // Prepare feedback rows for table display
  const suggestionRows = useMemo((): FeedbackRow[] => {
    return suggestions.map((f: Feedback) => ({
      id: f.id,
      content: f.content,
      quotes: f.quotes,
      sourceName: f.intakeSourceId ? intakeSourceNameMap[f.intakeSourceId] || '—' : '—',
    }));
  }, [suggestions, intakeSourceNameMap]);

  const problemRows = useMemo((): FeedbackRow[] => {
    return problems.map((f: Feedback) => ({
      id: f.id,
      content: f.content,
      quotes: f.quotes,
      sourceName: f.intakeSourceId ? intakeSourceNameMap[f.intakeSourceId] || '—' : '—',
    }));
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

  // Available use cases for linking (requires fetching use cases from team's solutions)
  // TODO: To implement, fetch solutions by persona.teamId, then fetch use cases for each solution,
  // then filter out IDs already in personaUseCases
  const availableUseCases: Array<{ id: string; name: string; description?: string }> = [];

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
    if (personaId) {
      await createPersonaUseCase.mutateAsync({
        personaId,
        useCaseId,
      });
    }
  };

  const handleUnlinkUseCase = async (useCaseId: string) => {
    // Find the persona-use case association to delete
    const association = personaUseCases.find(
      (puc: PersonaUseCase) => puc.personaId === personaId && puc.useCaseId === useCaseId
    );
    if (association) {
      await deletePersonaUseCase.mutateAsync(association.id);
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

              {personaUseCases.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No use cases linked to this persona.
                </p>
              ) : (
                <ul className="space-y-2">
                  {personaUseCases.map((puc: PersonaUseCase) => (
                    <li
                      key={puc.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                      <span className="text-sm text-[var(--text)] truncate">
                        {useCaseNameMap[puc.useCaseId] || 'Loading...'}
                      </span>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleUnlinkUseCase(puc.useCaseId)}
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
            {availableUseCases.map((useCase) => (
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
