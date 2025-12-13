/**
 * Use Case Detail Page
 * Displays use case details and its requirements in a table
 */

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome } from 'react-icons/fi';
import { useParams, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { PageHeader, PageContent } from '~/core/components';
import { SolutionManagementLayout } from '../components';
import { Button, Input, Tag, HStack, Breadcrumb, Table, Form, useForm, Modal, Select } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Requirement, RequirementType } from '~/core/entities/product-management';
import { useSolutionQuery, useUseCaseQuery, useRequirementsQuery } from '../queries';
import { useCreateRequirement, useUpdateRequirement, useDeleteRequirement } from '../mutations';
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

function UseCaseDetailContent() {
  const { solutionId, useCaseId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

  // TanStack Query hooks
  const { data: solution } = useSolutionQuery(solutionId);
  const { data: useCase } = useUseCaseQuery(useCaseId);
  const { data: requirements = [], isLoading } = useRequirementsQuery(useCaseId);
  const createRequirement = useCreateRequirement();
  const updateRequirement = useUpdateRequirement();
  const deleteRequirement = useDeleteRequirement();

  const form = useForm<{
    text: string;
    type: RequirementType;
    priority: number;
  }>({
    text: '',
    type: 'functional',
    priority: 1,
  });

  const handleAdd = () => {
    setEditingRequirement(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    form.setValue('text', requirement.text);
    form.setValue('type', requirement.type);
    form.setValue('priority', requirement.priority);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (requirement: Requirement) => {
    await deleteRequirement.mutateAsync(requirement.id);
  };

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
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            variant="danger"
            icon={<FiTrash2 />}
            size="small"
            onClick={() => {
              if (confirm('Are you sure you want to delete this requirement?')) {
                handleDeleteClick(record);
              }
            }}
          />
        </HStack>
      ),
    },
  ];

  // Handle case where data is not yet loaded
  if (!solution || !useCase) {
    return (
      <SolutionManagementLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        </PageContent>
      </SolutionManagementLayout>
    );
  }

  return (
    <SolutionManagementLayout>
      <PageHeader
        title={useCase.name}
        extra={
          <Breadcrumb
            items={[
              {
                title: <><FiHome /> Solutions</>,
                href: '/solutions',
              },
              {
                title: solution.name,
                href: `/solutions/${solutionId}`,
              },
              {
                title: useCase.name,
              },
            ]}
          />
        }
        actions={
          <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
            Add Requirement
          </Button>
        }
      />

      <PageContent>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666' }}>{useCase.description}</p>
        </div>

        <Table
          columns={columns}
          dataSource={requirements}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={isLoading}
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
    </SolutionManagementLayout>
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
