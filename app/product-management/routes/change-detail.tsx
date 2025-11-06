/**
 * Change Detail Page
 * Displays change details and its requirements in a table
 */

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome } from 'react-icons/fi';
import { useParams, Link } from 'react-router';
import { AppLayout, PageHeader, PageContent } from '~/core/components';
import { Button, Input, InputNumber, Tag, HStack, Breadcrumb, Table, Form, useForm, Modal, Select } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Requirement, RequirementType } from '~/core/entities/product-management';
import { useSolution, useFeature, useChange, useRequirements, useRequirementCRUD } from '../hooks';

const TYPE_COLORS: Record<RequirementType, string> = {
  functional: 'blue',
  'non-functional': 'orange',
  constraint: 'red',
};

export default function ChangeDetailPage() {
  const { solutionId, featureId, changeId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

  const form = useForm<{
    text: string;
    type: RequirementType;
    priority: number;
  }>({
    text: '',
    type: 'functional',
    priority: 1,
  });

  // Use new hooks
  const { solution } = useSolution(solutionId);
  const { feature } = useFeature(featureId);
  const { change } = useChange(changeId);
  const { requirements, loading } = useRequirements(changeId);
  const { handleCreate, handleUpdate, handleDelete } = useRequirementCRUD();

  if (!solution || !feature || !change) {
    return (
      <AppLayout>
        <PageContent>
          <p>Change not found</p>
        </PageContent>
      </AppLayout>
    );
  }

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
    await handleDelete(requirement.id);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingRequirement) {
        await handleUpdate(editingRequirement.id, values);
      } else {
        await handleCreate({
          changeId: changeId!,
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
      sorter: (a, b) => a.priority - b.priority,
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
      width: 150,
      render: (value: unknown) => {
        const type = value as RequirementType;
        return <Tag color={TYPE_COLORS[type] as 'blue' | 'orange' | 'red'}>{type}</Tag>;
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

  return (
    <AppLayout>
      <PageHeader
        title={change.name}
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
                title: <Link to={`/solutions/${solutionId}/features/${featureId}`}>{feature.name}</Link>,
              },
              {
                title: change.name,
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
          <p style={{ color: '#666' }}>{change.description}</p>
          <HStack gap="sm">
            <Tag>Version: {change.version}</Tag>
            <Tag color={change.status === 'implemented' ? 'green' : 'blue'}>
              Status: {change.status}
            </Tag>
          </HStack>
        </div>

        <Table
          columns={columns}
          dataSource={requirements}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </PageContent>

      <Modal
        title={editingRequirement ? 'Edit Requirement' : 'Add Requirement'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingRequirement ? 'Update' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="text"
              label="Requirement Text"
              required
              rules={{
                required: 'Please enter requirement text',
              }}
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Enter requirement description"
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
                <InputNumber
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={10}
                  placeholder="Enter priority (1-10)"
                  className="w-full"
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
