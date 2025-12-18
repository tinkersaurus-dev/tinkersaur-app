/**
 * Solution Detail Page
 * Displays solution details and its use cases in a table
 */

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome, FiSettings } from 'react-icons/fi';
import { MdDesignServices } from 'react-icons/md';
import { useParams, Link, useNavigate, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { PageHeader, PageContent } from '~/core/components';
import { SolutionManagementLayout } from '../components';
import { Button, Input, HStack, Breadcrumb, Table, Form, useForm, Modal, Select, Tabs } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { UseCase, SolutionType } from '~/core/entities/product-management';
import { useSolutionQuery, useUseCasesQuery } from '../queries';
import { useCreateUseCase, useUpdateUseCase, useDeleteUseCase, useUpdateSolution, useDeleteSolution } from '../mutations';
import { loadSolutionDetail } from '../loaders';
import type { SolutionDetailLoaderData } from '../loaders';
import type { Route } from './+types/solution-detail';

const solutionTypeOptions = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'process', label: 'Process' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { solutionId } = params;
  if (!solutionId) {
    throw new Response('Solution ID required', { status: 400 });
  }
  return loadSolutionDetail(solutionId);
}

function SolutionDetailContent() {
  const { solutionId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // TanStack Query hooks
  const { data: solution, isLoading: solutionLoading, isError } = useSolutionQuery(solutionId);
  const { data: useCases = [], isLoading } = useUseCasesQuery(solutionId);
  const createUseCase = useCreateUseCase();
  const updateUseCase = useUpdateUseCase();
  const deleteUseCase = useDeleteUseCase();
  const updateSolution = useUpdateSolution();
  const deleteSolution = useDeleteSolution();

  const form = useForm<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });

  const settingsForm = useForm<{
    name: string;
    description: string;
    type: SolutionType;
  }>({
    name: '',
    description: '',
    type: 'product',
  });

  const handleOpenSettings = () => {
    if (solution) {
      settingsForm.setValue('name', solution.name);
      settingsForm.setValue('description', solution.description);
      settingsForm.setValue('type', solution.type);
    }
    setDeleteConfirmText('');
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
    setDeleteConfirmText('');
    settingsForm.reset();
  };

  const handleSaveSettings = async () => {
    const isValid = await settingsForm.trigger();
    if (!isValid) return;

    const values = settingsForm.getValues();
    await updateSolution.mutateAsync({
      id: solutionId!,
      updates: values,
    });
    handleCloseSettings();
  };

  const handleDeleteSolution = async () => {
    if (deleteConfirmText !== 'CONFIRM') return;

    const success = await deleteSolution.mutateAsync(solutionId!);
    if (success) {
      navigate('/solutions');
    }
  };

  const handleOpenDesignStudio = () => {
    navigate(`/studio/${solutionId}`);
  };

  const handleAdd = () => {
    setEditingUseCase(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (useCase: UseCase) => {
    setEditingUseCase(useCase);
    form.setValue('name', useCase.name);
    form.setValue('description', useCase.description);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (useCase: UseCase) => {
    await deleteUseCase.mutateAsync(useCase.id);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingUseCase) {
        await updateUseCase.mutateAsync({
          id: editingUseCase.id,
          updates: values,
        });
      } else {
        await createUseCase.mutateAsync({
          solutionId: solutionId!,
          ...values,
        });
      }

      setIsModalOpen(false);
      form.reset();
      setEditingUseCase(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const columns: TableColumn<UseCase>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Link to={`/solutions/${solutionId}/use-cases/${record.id}`} className="text-[var(--primary)] hover:underline">
          {value as string}
        </Link>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
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
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            variant="danger"
            icon={<FiTrash2 />}
            size="small"
            onClick={() => {
              if (confirm('Are you sure you want to delete this use case? All related changes and requirements will also be deleted.')) {
                handleDeleteClick(record);
              }
            }}
          />
        </HStack>
      ),
    },
  ];

  // Handle loading state
  if (solutionLoading) {
    return (
      <SolutionManagementLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        </PageContent>
      </SolutionManagementLayout>
    );
  }

  // Handle error or not found state
  if (isError || !solution) {
    return (
      <SolutionManagementLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Solution not found</div>
        </PageContent>
      </SolutionManagementLayout>
    );
  }

  return (
    <SolutionManagementLayout>
      <PageHeader
        titlePrefix={solution.type.charAt(0).toUpperCase() + solution.type.slice(1) + ': '}
        title={solution.name}
        extra={
          <Breadcrumb
            items={[
              {
                title: <><FiHome /> Solutions</>,
                href: '/solutions',
              },
              {
                title: solution.name,
              },
            ]}
          />
        }
        actions={
          <HStack gap="sm">
            <Button variant="text" icon={<FiSettings />} onClick={handleOpenSettings}>
              Settings
            </Button>
            <Button variant="default" icon={<MdDesignServices />} onClick={handleOpenDesignStudio}>
              Open Design Studio
            </Button>
          </HStack>
        }
      />

      <PageContent>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666' }}>{solution.description}</p>
        </div>

        <Table
          header={{
            title: 'Use Cases',
            actions: (
              <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
              </Button>
            ),
          }}
          columns={columns}
          dataSource={useCases}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={isLoading}
        />
      </PageContent>

      <Modal
        title={editingUseCase ? 'Edit Use Case' : 'Add Use Case'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingUseCase ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="name"
              label="Use Case Name"
              required
              rules={{
                required: 'Please enter a use case name',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="Enter use case name"
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              required
              rules={{
                required: 'Please enter a description',
              }}
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Enter use case description"
                  rows={4}
                  error={!!error}
                />
              )}
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        title="Solution Settings"
        open={isSettingsModalOpen}
        onCancel={handleCloseSettings}
        footer={null}
        width={600}
      >
        <Tabs
          items={[
            {
              key: 'info',
              label: 'Info',
              children: (
                <div className="pt-4">
                  <Form form={settingsForm} layout="vertical">
                    <div className="space-y-4">
                      <Form.Item
                        name="name"
                        label="Name"
                        required
                        rules={{
                          required: 'Please enter a solution name',
                        }}
                      >
                        {({ field, error }) => (
                          <Input
                            {...field}
                            placeholder="Enter solution name"
                            error={!!error}
                          />
                        )}
                      </Form.Item>

                      <Form.Item
                        name="type"
                        label="Type"
                        required
                        rules={{
                          required: 'Please select a solution type',
                        }}
                      >
                        {({ field, error }) => (
                          <Select
                            {...field}
                            options={solutionTypeOptions}
                            placeholder="Select solution type"
                            error={!!error}
                          />
                        )}
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label="Description"
                        required
                        rules={{
                          required: 'Please enter a description',
                        }}
                      >
                        {({ field, error }) => (
                          <Input.TextArea
                            {...field}
                            placeholder="Enter solution description"
                            rows={4}
                            error={!!error}
                          />
                        )}
                      </Form.Item>
                    </div>
                  </Form>
                  <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border)]">
                    <Button
                      variant="primary"
                      onClick={handleSaveSettings}
                      loading={updateSolution.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              key: 'lifecycle',
              label: 'Lifecycle',
              children: (
                <div className="pt-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-sm mb-4">
                    <h4 className="text-red-800 font-medium mb-2">Delete Solution</h4>
                    <p className="text-red-700 text-sm mb-4">
                      This will permanently delete this solution and all associated use cases and design work. This action cannot be undone.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-red-700 mb-1">
                          Type <strong>CONFIRM</strong> to enable deletion
                        </label>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type CONFIRM to delete"
                        />
                      </div>
                      <Button
                        variant="danger"
                        onClick={handleDeleteSolution}
                        disabled={deleteConfirmText !== 'CONFIRM'}
                        loading={deleteSolution.isPending}
                      >
                        Delete Solution
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </SolutionManagementLayout>
  );
}

export default function SolutionDetailPage() {
  const { dehydratedState } = useLoaderData<SolutionDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <SolutionDetailContent />
    </HydrationBoundary>
  );
}
