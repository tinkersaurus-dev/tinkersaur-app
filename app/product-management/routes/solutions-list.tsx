/**
 * Solutions List Page
 * Displays all solutions in a table with CRUD operations
 */

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router';
import { AppLayout, PageHeader, PageContent } from '~/core/components';
import { Button, Input, HStack, Table, Form, useForm, Modal, Select } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Solution, SolutionType } from '~/core/entities/product-management';
import { useSolutions, useSolutionCRUD } from '../hooks';

const solutionTypeOptions = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'process', label: 'Process' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

export default function SolutionsListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null);

  const form = useForm<{
    name: string;
    description: string;
    type: SolutionType;
  }>({
    name: '',
    description: '',
    type: 'product',
  });

  // Use new hooks
  const { solutions, loading } = useSolutions('org-1'); // Mock organization ID
  const { handleCreate, handleUpdate, handleDelete } = useSolutionCRUD();

  const handleAdd = () => {
    setEditingSolution(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (solution: Solution) => {
    setEditingSolution(solution);
    form.setValue('name', solution.name);
    form.setValue('description', solution.description);
    form.setValue('type', solution.type);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (solution: Solution) => {
    await handleDelete(solution.id);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingSolution) {
        await handleUpdate(editingSolution.id, values);
      } else {
        await handleCreate({
          organizationId: 'org-1', // Mock organization ID
          ...values,
        });
      }

      setIsModalOpen(false);
      form.reset();
      setEditingSolution(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const columns: TableColumn<Solution>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Link to={`/solutions/${record.id}`} className="text-[var(--primary)] hover:underline">
          {value as string}
        </Link>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (value: unknown) => {
        const type = value as SolutionType;
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
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
              if (confirm('Are you sure you want to delete this solution? All related use cases, changes, and requirements will also be deleted.')) {
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
        title="Solutions"
        actions={
          <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
            Add Solution
          </Button>
        }
      />

      <PageContent>
        <Table
          columns={columns}
          dataSource={solutions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </PageContent>

      <Modal
        title={editingSolution ? 'Edit Solution' : 'Add Solution'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingSolution ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="name"
              label="Solution Name"
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
              label="Solution Type"
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
      </Modal>
    </AppLayout>
  );
}
