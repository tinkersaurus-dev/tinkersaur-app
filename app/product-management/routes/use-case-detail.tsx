/**
 * Use Case Detail Page
 * Displays use case details and its requirements in a table
 */

import { useState, useCallback, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome, FiMessageCircle } from 'react-icons/fi';
import { useParams, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { Button, Input, Tag, HStack, Breadcrumb, Table, Form, useForm, Modal, Select, Card, Tabs, Empty, EditableSection, EditableField } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Requirement, RequirementType } from '~/core/entities/product-management';
import { useSolutionQuery, useUseCaseQuery, useRequirementsQuery } from '../queries';
import { useIntakeSourceQuery } from '~/discovery/queries';
import { SOURCE_TYPES, type SourceTypeKey } from '~/core/entities/discovery/types/SourceType';
import { useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useUpdateUseCase } from '../mutations';
import { loadUseCaseDetail } from '../loaders';
import type { UseCaseDetailLoaderData } from '../loaders';
import type { Route } from './+types/use-case-detail';

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

// Quote row type for the quotes table
interface QuoteRow {
  id: string;
  quote: string;
  source: string;
}

function UseCaseDetailContent() {
  const { solutionId, useCaseId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [activeTab, setActiveTab] = useState('quotes');

  // TanStack Query hooks
  const { data: solution } = useSolutionQuery(solutionId);
  const { data: useCase } = useUseCaseQuery(useCaseId);
  const { data: requirements = [], isLoading } = useRequirementsQuery(useCaseId);
  const createRequirement = useCreateRequirement();
  const updateRequirement = useUpdateRequirement();
  const deleteRequirement = useDeleteRequirement();
  const updateUseCase = useUpdateUseCase();

  // Basic info edit state
  const [isBasicInfoEditing, setIsBasicInfoEditing] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({ name: '', description: '' });
  const [basicInfoErrors, setBasicInfoErrors] = useState<Record<string, string>>({});

  // Fetch intake source for quote source display
  const { data: intakeSource } = useIntakeSourceQuery(useCase?.intakeSourceId);

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

  const form = useForm<{
    text: string;
    type: RequirementType;
    priority: number;
  }>({
    text: '',
    type: 'functional',
    priority: 1,
  });

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
        extra={
          <Breadcrumb
            items={[
              {
                title: <><FiHome /> Solutions</>,
                href: '/solutions/scope',
              },
              {
                title: solution.name,
                href: `/solutions/scope/${solutionId}`,
              },
              {
                title: useCase.name,
              },
            ]}
          />
        }
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
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
                ]}
              />
            </Card>
          </div>
        </div>
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
