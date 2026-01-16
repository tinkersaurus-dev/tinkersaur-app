/**
 * Use Case Detail Page
 * Displays use case details and its requirements in a table
 * Includes a Definition tab with embedded design studio for linked designworks
 */

import { useState, useCallback, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMessageCircle, FiArchive, FiAlertTriangle } from 'react-icons/fi';
import { useParams, useLoaderData } from 'react-router';
import { useSolutionStore } from '~/core/solution';
import { HydrationBoundary } from '@tanstack/react-query';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { Button, Tag, HStack, Table, Form, useForm, Modal, Select, Input, Card, Tabs, MarkdownContent } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Requirement, RequirementType } from '~/core/entities/product-management';
import { useSolutionQuery, useUseCaseQuery, useRequirementsQuery } from '../queries';
import { useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useUpdateUseCase } from '../mutations';
import { loadUseCaseDetail } from '../loaders';
import type { UseCaseDetailLoaderData } from '../loaders';
import type { Route } from './+types/use-case-detail';
import {
  UseCaseBasicInfo,
  UseCaseSupportingQuotes,
  UseCaseFeedbackTab,
  UseCasePersonasSidebar,
  UseCaseVersionsSidebar,
  UseCaseVersionDetailModal,
  useUseCaseFeedback,
} from '../components/use-case-detail';
import type { UseCaseVersion } from '~/core/entities/product-management/types/UseCaseVersion';
import { DesignStudioContent } from '~/design-studio/components/DesignStudioContent';
import { useUseCaseContent } from '../hooks/useUseCaseContent';
import '~/design-studio/styles/markdown-content.css';

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { solutionId, useCaseId } = params;
  if (!solutionId || !useCaseId) {
    throw new Response('Solution ID and Use Case ID required', { status: 400 });
  }
  return loadUseCaseDetail(solutionId, useCaseId);
}

const TYPE_COLORS: Record<RequirementType, string> = {
  functional: 'blue',
  'non-functional': 'orange',
  constraint: 'default',
};

function UseCaseDetailContent() {
  const { solutionId, useCaseId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [topLevelTab, setTopLevelTab] = useState('overview');
  const [activeTab, setActiveTab] = useState('requirements');
  const [selectedVersion, setSelectedVersion] = useState<UseCaseVersion | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

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
    useCaseId
  );

  const form = useForm<{
    text: string;
    type: RequirementType;
    priority: number;
  }>({
    text: '',
    type: 'functional',
    priority: 1,
  });

  const handleSaveBasicInfo = async (updates: { name: string; description?: string }) => {
    if (!useCaseId) return;
    await updateUseCase.mutateAsync({
      id: useCaseId,
      updates,
    });
  };

  const handleAdd = () => {
    setEditingRequirement(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = useCallback((requirement: Requirement) => {
    setEditingRequirement(requirement);
    form.setValue('text', requirement.text);
    form.setValue('type', requirement.type);
    form.setValue('priority', requirement.priority);
    setIsModalOpen(true);
  }, [form]);

  const handleDeleteClick = useCallback(async (requirement: Requirement) => {
    await deleteRequirement.mutateAsync(requirement.id);
  }, [deleteRequirement]);

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingRequirement) {
        await updateRequirement.mutateAsync({
          id: editingRequirement.id,
          updates: values,
        });
      } else {
        await createRequirement.mutateAsync({
          useCaseId: useCaseId!,
          ...values,
        });
      }

      setIsModalOpen(false);
      form.reset();
      setEditingRequirement(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
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

  const columns: TableColumn<Requirement>[] = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (value) => <span style={{ fontWeight: 600 }}>{value as number}</span>,
    },
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
        return <Tag color={TYPE_COLORS[type] as 'default' | 'blue' | 'orange'}>{type}</Tag>;
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
      title: 'Actions',
      key: 'actions',
      width: 120,
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
        titlePrefix='Use Case: '
        title={useCase.name}
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                      <UseCaseBasicInfo
                        useCase={useCase}
                        onSave={handleSaveBasicInfo}
                        isSaving={updateUseCase.isPending}
                      />

                      <Card>
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
                                    header={{
                                      title: 'Requirements',
                                      actions: (
                                        <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
                                        </Button>
                                      ),
                                    }}
                                    columns={columns}
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
                                    intakeSourceId={useCase.intakeSourceId}
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

                    {/* Sidebar - Personas and Versions */}
                    <div className="space-y-6">
                      <UseCasePersonasSidebar
                        useCaseId={useCaseId!}
                        teamId={useCase.teamId}
                      />
                      <UseCaseVersionsSidebar
                        useCaseId={useCaseId!}
                        onViewVersion={(version) => {
                          setSelectedVersion(version);
                          setIsVersionModalOpen(true);
                        }}
                        onVersionReverted={() => {
                          // Refetch the use case data after revert
                          // The queries will automatically refetch due to query invalidation
                        }}
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
                    {/* Toolbar placeholder */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]" />
                    {/* Content area */}
                    <div className="flex-1 overflow-auto p-4 bg-[var(--bg-light)]">
                      {specificationLoading ? (
                        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                          <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Loading specification...
                        </div>
                      ) : (
                        <div className="markdown-content markdown-content--compact">
                          <MarkdownContent content={specificationContent} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ),
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
        <Form form={form} layout="vertical">
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
              name="priority"
              label="Priority"
              required
              rules={{
                required: 'Please enter a priority',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Enter priority (0-100)"
                  error={!!error}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Version Detail Modal */}
      <UseCaseVersionDetailModal
        useCaseId={useCaseId!}
        version={selectedVersion}
        open={isVersionModalOpen}
        onClose={() => {
          setIsVersionModalOpen(false);
          setSelectedVersion(null);
        }}
      />
    </MainLayout>
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
