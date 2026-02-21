/**
 * Use Case Detail Page
 * Displays use case details and its requirements in a table
 * Includes a Definition tab with embedded design studio for linked designworks
 */

import { useState, useCallback, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiMessageCircle, FiArchive, FiAlertTriangle, FiArrowLeft, FiPlus } from 'react-icons/fi';
import { useParams, useLoaderData, useNavigate } from 'react-router';
import { useSolutionStore } from '@/entities/solution';
import { HydrationBoundary } from '@tanstack/react-query';
import { PageHeader, PageContent } from '@/shared/ui';
import { Button, Tag, HStack, Table, Form, useForm, Modal, Select, Input, Card, Tabs, MarkdownContent, Checkbox } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import type { Requirement, RequirementType, RequirementStatus } from '@/entities/requirement';
import { REQUIREMENT_TYPE_CONFIG, REQUIREMENT_STATUS_CONFIG } from '@/entities/requirement';
import type { LoaderFunctionArgs } from 'react-router';
import { useSolutionQuery } from '@/entities/solution';
import { useUseCaseQuery, useUpdateUseCase } from '@/entities/use-case';
import { useRequirementsQuery, useCreateRequirement, useUpdateRequirement, useDeleteRequirement } from '@/entities/requirement';
import { loadUseCaseDetail } from './loader';
import type { UseCaseDetailLoaderData } from './loader';
import {
  UseCaseBasicInfo,
  UseCaseSupportingQuotes,
  UseCaseFeedbackTab,
  UseCaseVersionsTab,
  AddRequirementModal,
} from '@/entities/use-case';
import { UseCasePersonasSidebar } from '@/entities/use-case/ui/use-case-detail/UseCasePersonasSidebar';
import { useUseCaseFeedback } from '@/entities/use-case/ui/use-case-detail/useUseCaseFeedback';
import { SpecificationDiffView } from '@/entities/use-case-version';
import { DesignStudioContent } from '@/widgets/studio-content';
import { useDesignWorksForContext } from '@/features/diagram-management';
import { useUseCaseContent } from '@/entities/use-case';
import { useUseCaseVersionStore } from '@/entities/use-case-version/store/useUseCaseVersionStore';
import { formatVersionDisplay } from '@/entities/use-case-version';

// Loader function for SSR data fetching
export async function loader({ params }: LoaderFunctionArgs) {
  const solutionId = params.solutionId;
  const useCaseId = params.useCaseId;
  if (!solutionId || !useCaseId) {
    throw new Response('Solution ID and Use Case ID required', { status: 400 });
  }
  return loadUseCaseDetail(solutionId, useCaseId);
}


function UseCaseDetailContent() {
  const { solutionId, useCaseId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [topLevelTab, setTopLevelTab] = useState('overview');
  const [activeTab, setActiveTab] = useState('requirements');

  // Version comparison state
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Solution store for auto-select
  const selectSolution = useSolutionStore((state) => state.selectSolution);

  // TanStack Query hooks
  const { data: solution } = useSolutionQuery(solutionId);
  const { data: useCase } = useUseCaseQuery(useCaseId);
  const { data: requirements = [], isLoading } = useRequirementsQuery(useCaseId);
  const createRequirement = useCreateRequirement();
  const updateRequirement = useUpdateRequirement();
  const deleteRequirement = useDeleteRequirement();
  const updateUseCase = useUpdateUseCase();

  // Load designworks at page level for both Definition and Specification tabs
  const { loading: designWorksLoading } = useDesignWorksForContext({
    solutionId: solutionId!,
    useCaseId,
  });

  // Auto-select solution when viewing this page
  useEffect(() => {
    if (solution) {
      selectSolution(solution);
    }
  }, [solution, selectSolution]);

  // Feedback data for tabs
  const { suggestions, problems, suggestionsCount, problemsCount } = useUseCaseFeedback(
    useCase?.teamId,
    useCaseId
  );

  // Use case content compilation for Specification tab
  const { content: specificationContent, loading: specificationLoading } = useUseCaseContent(
    solutionId,
    useCaseId,
    useCase?.name,
    useCase?.description
  );

  // Version store for specification comparison
  const {
    versions,
    versionDetails,
    fetchVersions,
    fetchVersionDetail,
  } = useUseCaseVersionStore();
  const useCaseVersions = versions[useCaseId!] || [];
  const selectedVersionDetail = selectedVersionId ? versionDetails[selectedVersionId] : null;

  // Fetch versions on mount for specification comparison
  useEffect(() => {
    if (useCaseId) {
      fetchVersions(useCaseId);
    }
  }, [useCaseId, fetchVersions]);

  // Fetch version detail when a version is selected for comparison
  useEffect(() => {
    if (selectedVersionId && useCaseId) {
      fetchVersionDetail(useCaseId, selectedVersionId);
    }
  }, [selectedVersionId, useCaseId, fetchVersionDetail]);

  const requirementForm = useForm<{
    text: string;
    type: RequirementType;
    status: RequirementStatus;
  }>({
    text: '',
    type: 'functional',
    status: 'Todo',
  });

  const handleSaveBasicInfo = async (updates: { name: string; description?: string }) => {
    if (!useCaseId) return;
    await updateUseCase.mutateAsync({
      id: useCaseId,
      updates,
    });
  };

  const handleEdit = useCallback((requirement: Requirement) => {
    setEditingRequirement(requirement);
    requirementForm.setValue('text', requirement.text);
    requirementForm.setValue('type', requirement.type);
    requirementForm.setValue('status', requirement.status);
    setIsModalOpen(true);
  }, [requirementForm]);

  const handleDeleteClick = useCallback(async (requirement: Requirement) => {
    await deleteRequirement.mutateAsync(requirement.id);
  }, [deleteRequirement]);

  const handleOk = async () => {
    try {
      const isValid = await requirementForm.trigger();
      if (!isValid) return;

      const values = requirementForm.getValues();

      if (editingRequirement) {
        await updateRequirement.mutateAsync({
          id: editingRequirement.id,
          updates: values,
        });
      } else {
        await createRequirement.mutateAsync({
          teamId: useCase!.teamId,
          useCaseId: useCaseId!,
          ...values,
        });
      }

      setIsModalOpen(false);
      requirementForm.reset();
      setEditingRequirement(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    requirementForm.reset();
  };

  const handleBack = () => {
    navigate('/solutions/scope/');
  };

  // Memoized handlers for table actions to prevent unnecessary re-renders
  const handleEditRecord = useCallback((record: Requirement) => {
    handleEdit(record);
  }, [handleEdit]);

  const handleDeleteRecord = useCallback((record: Requirement) => {
    if (confirm('Are you sure you want to delete this requirement?')) {
      handleDeleteClick(record);
    }
  }, [handleDeleteClick]);

  const handleAddRequirement = useCallback(async (data: {
    text: string;
    type: RequirementType;
    status: RequirementStatus;
  }) => {
    if (!useCase) return;
    await createRequirement.mutateAsync({
      teamId: useCase.teamId,
      useCaseId: useCaseId!,
      ...data,
    });
    setIsAddModalOpen(false);
  }, [createRequirement, useCaseId, useCase]);

  const requirementColumns: TableColumn<Requirement>[] = [
    {
      title: 'Requirement',
      dataIndex: 'text',
      key: 'text',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (value: unknown) => {
        const type = value as RequirementType;
        const config = REQUIREMENT_TYPE_CONFIG[type];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: unknown) => {
        const status = value as RequirementStatus;
        const config = REQUIREMENT_STATUS_CONFIG[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: unknown) => new Date(value as Date).toLocaleDateString(),
      width: 120,
    },
    {
      title: (
        <HStack gap="sm">
          <span>Actions</span>
          <Button
            variant="text"
            size="small"
            icon={<FiPlus />}
            onClick={() => setIsAddModalOpen(true)}
            title="Add requirement"
          />
        </HStack>
      ),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <HStack gap="sm">
          <Button
            variant="text"
            icon={<FiEdit2 />}
            onClick={() => handleEditRecord(record)}
            size="small"
          />
          <Button
            variant="danger"
            icon={<FiTrash2 />}
            size="small"
            onClick={() => handleDeleteRecord(record)}
          />
        </HStack>
      ),
    },
  ];

  // Handle case where data is not yet loaded
  if (!solution || !useCase) {
    return (
      <PageContent>
        <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
      </PageContent>
    );
  }

  return (
    <>
      <PageHeader
        titlePrefix='Use Case: '
        title={useCase.name}
        extra={
          <Button variant="default" icon={<FiArrowLeft />} onClick={handleBack}>
            Back to Use Cases
          </Button>
        }
      />

      <PageContent>
        {/* Top-level tabs: Overview and Definition */}
        <Tabs
          type="line"
          activeKey={topLevelTab}
          onChange={setTopLevelTab}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <div className="pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 qhd:grid-cols-4 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 qhd:col-span-3 space-y-6">
                      <UseCaseBasicInfo
                        useCase={useCase}
                        onSave={handleSaveBasicInfo}
                        isSaving={updateUseCase.isPending}
                      />

                      <Card shadow={false}>
                        <Tabs
                          type="line"
                          activeKey={activeTab}
                          onChange={setActiveTab}
                          items={[
                            {
                              key: 'requirements',
                              label: (
                                <span className="flex items-center gap-1.5">
                                  Requirements ({requirements.length})
                                </span>
                              ),
                              children: (
                                <div className="pt-4">
                                  <Table
                 
                                    columns={requirementColumns}
                                    dataSource={requirements}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                    loading={isLoading}
                                  />
                                </div>
                              ),
                            },
                            {
                              key: 'quotes',
                              label: (
                                <span className="flex items-center gap-1.5">
                                  <FiMessageCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
                                  Supporting Quotes ({useCase.quotes?.length || 0})
                                </span>
                              ),
                              children: (
                                <div className="pt-4">
                                  <UseCaseSupportingQuotes
                                    quotes={useCase.quotes || []}
                                  />
                                </div>
                              ),
                            },
                            {
                              key: 'suggestions',
                              label: (
                                <span className="flex items-center gap-1.5">
                                  <FiArchive className="w-3.5 h-3.5 text-blue-500" />
                                  Suggestions ({suggestionsCount})
                                </span>
                              ),
                              children: (
                                <div className="pt-4">
                                  <UseCaseFeedbackTab
                                    feedbackRows={suggestions}
                                    emptyDescription="No suggestions for this use case"
                                  />
                                </div>
                              ),
                            },
                            {
                              key: 'problems',
                              label: (
                                <span className="flex items-center gap-1.5">
                                  <FiAlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                  Problems ({problemsCount})
                                </span>
                              ),
                              children: (
                                <div className="pt-4">
                                  <UseCaseFeedbackTab
                                    feedbackRows={problems}
                                    emptyDescription="No problems for this use case"
                                  />
                                </div>
                              ),
                            },
                          ]}
                        />
                      </Card>
                    </div>

                    {/* Sidebar - Personas */}
                    <div className="space-y-6">
                      <UseCasePersonasSidebar
                        useCase={useCase}
                        teamId={useCase.teamId}
                      />
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'definition',
              label: 'Definition',
              children: (
                <div className="pt-0 h-[calc(90vh-100px)]">
                  <DesignStudioContent
                    solutionId={solutionId!}
                    useCaseId={useCaseId}
                    className=""
                  />
                </div>
              ),
            },
            {
              key: 'specification',
              label: 'Specification',
              children: (
                <div className="pt-0 h-[calc(90vh-100px)]">
                  <div className="h-full flex flex-col overflow-hidden bg-[var(--bg)]">
                    {/* Content area */}
                    <div className="flex-1 overflow-hidden p-4">
                      <div className="max-w-6xl mx-auto bg-[var(--bg-light)] h-full overflow-auto">
                        {/* Version comparison toolbar */}
                        <div className="flex items-center gap-3 px-6 py-2 border-b border-[var(--border)] bg-[var(--bg-light)] sticky top-0 z-10">
                          <Checkbox
                            id="compare-toggle"
                            checked={compareEnabled}
                            size="small"
                            onChange={(e) => {
                              setCompareEnabled(e.target.checked);
                              if (!e.target.checked) {
                                setSelectedVersionId(null);
                              }
                            }}
                            label="Compare with a version"
                          />
                          <Select
                            value={selectedVersionId || ''}
                            onChange={(value) => setSelectedVersionId(value || null)}
                            placeholder="Select version..."
                            size="small"
                            disabled={!compareEnabled}
                            options={useCaseVersions.map((v) => ({
                              value: v.id,
                              label: formatVersionDisplay(v),
                            }))}
                            className="w-64"
                          />
                        </div>
                        <div className="p-6">
                          {(specificationLoading || designWorksLoading) ? (
                            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Loading specification...
                            </div>
                          ) : compareEnabled && selectedVersionId && selectedVersionDetail ? (
                            <SpecificationDiffView
                              currentSpec={specificationContent}
                              versionSpec={selectedVersionDetail.compiledSpecification}
                            />
                          ) : compareEnabled && selectedVersionId && !selectedVersionDetail ? (
                            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Loading version...
                            </div>
                          ) : (
                            <div className="markdown-content markdown-content--compact">
                              <MarkdownContent content={specificationContent} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'versions',
              label: 'Versions',
              children: <UseCaseVersionsTab useCaseId={useCaseId!} />,
            },
          ]}
        />
      </PageContent>

      <Modal
        title={editingRequirement ? 'Edit Requirement' : 'Add Requirement'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingRequirement ? 'Update' : 'Create'}
      >
        <Form form={requirementForm} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="text"
              label="Requirement Text"
              required
              rules={{
                required: 'Please enter the requirement text',
              }}
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Enter requirement text"
                  rows={4}
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              required
              rules={{
                required: 'Please select a type',
              }}
            >
              {({ field, error }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select type"
                  error={!!error}
                  options={[
                    { value: 'functional', label: 'Functional' },
                    { value: 'non-functional', label: 'Non-Functional' },
                    { value: 'constraint', label: 'Constraint' },
                  ]}
                />
              )}
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              required
              rules={{
                required: 'Please select a status',
              }}
            >
              {({ field, error }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select status"
                  error={!!error}
                  options={[
                    { value: 'Todo', label: 'To Do' },
                    { value: 'InProgress', label: 'In Progress' },
                    { value: 'Done', label: 'Done' },
                  ]}
                />
              )}
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <AddRequirementModal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onSave={handleAddRequirement}
        teamId={useCase.teamId}
        isSaving={createRequirement.isPending}
      />
    </>
  );
}

export default function UseCaseDetailPage() {
  const { dehydratedState } = useLoaderData<UseCaseDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <UseCaseDetailContent />
    </HydrationBoundary>
  );
}
