/**
 * Use Case Detail Page
 * Displays use case details and its changes in a table
 */

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome } from 'react-icons/fi';
import { useNavigate, useParams, Link } from 'react-router';
import { AppLayout, PageHeader, PageContent } from '~/core/components';
import { Button, Input, Tag, HStack, Breadcrumb, Table, Form, useForm, Modal, Select } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Change, ChangeStatus } from '~/core/entities/product-management';
import { useSolution, useUseCase, useChanges, useChangeCRUD } from '../hooks';

const STATUS_COLORS: Record<ChangeStatus, string> = {
  draft: 'default',
  locked: 'blue',
  'in-design': 'orange',
  implemented: 'green',
};

export default function UseCaseDetailPage() {
  const navigate = useNavigate();
  const { solutionId, useCaseId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChange, setEditingChange] = useState<Change | null>(null);

  const form = useForm<{
    name: string;
    description: string;
    version: string;
    status: ChangeStatus;
  }>({
    name: '',
    description: '',
    version: '',
    status: 'draft',
  });

  // Use new hooks
  const { solution } = useSolution(solutionId);
  const { useCase } = useUseCase(useCaseId);
  const { changes, loading } = useChanges(useCaseId);
  const { handleCreate, handleUpdate, handleDelete } = useChangeCRUD();

  if (!solution || !useCase) {
    return (
      <AppLayout>
        <PageContent>
          <p>Use case not found</p>
        </PageContent>
      </AppLayout>
    );
  }

  const handleAdd = () => {
    setEditingChange(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (change: Change) => {
    setEditingChange(change);
    form.setValue('name', change.name);
    form.setValue('description', change.description);
    form.setValue('version', change.version);
    form.setValue('status', change.status);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (change: Change) => {
    await handleDelete(change.id);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingChange) {
        await handleUpdate(editingChange.id, values);
      } else {
        await handleCreate({
          useCaseId: useCaseId!,
          ...values,
        });
      }

      setIsModalOpen(false);
      form.reset();
      setEditingChange(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const columns: TableColumn<Change>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <a
          onClick={() => navigate(`/solutions/${solutionId}/use-cases/${useCaseId}/changes/${record.id}`)}
          className="text-[var(--primary)] hover:underline cursor-pointer"
        >
          {value as string}
        </a>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: unknown) => {
        const status = value as ChangeStatus;
        return <Tag color={STATUS_COLORS[status] as 'default' | 'blue' | 'orange' | 'green'}>{status}</Tag>;
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
              if (confirm('Are you sure you want to delete this change? All related requirements will also be deleted.')) {
                handleDeleteClick(record);
              }
            }}
          />
        </HStack>
      ),
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title={useCase.name}
        extra={
          <Breadcrumb
            items={[
              {
                title: <Link to="/solutions"><FiHome /> Solutions</Link>,
              },
              {
                title: <Link to={`/solutions/${solutionId}`}>{solution.name}</Link>,
              },
              {
                title: useCase.name,
              },
            ]}
          />
        }
        actions={
          <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
            Add Change
          </Button>
        }
      />

      <PageContent>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666' }}>{useCase.description}</p>
        </div>

        <Table
          columns={columns}
          dataSource={changes}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </PageContent>

      <Modal
        title={editingChange ? 'Edit Change' : 'Add Change'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingChange ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="name"
              label="Change Name"
              required
              rules={{
                required: 'Please enter a change name',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="Enter change name"
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
                  placeholder="Enter change description"
                  rows={4}
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="version"
              label="Version"
              required
              rules={{
                required: 'Please enter a version',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="e.g., 1.0.0"
                  error={!!error}
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
                    { value: 'draft', label: 'Draft' },
                    { value: 'locked', label: 'Locked' },
                    { value: 'in-design', label: 'In Design' },
                    { value: 'implemented', label: 'Implemented' },
                  ]}
                />
              )}
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </AppLayout>
  );
}
