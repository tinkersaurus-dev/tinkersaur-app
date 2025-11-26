/**
 * Solutions List Page
 * Displays all solutions in a responsive card grid
 */

import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { AppLayout, PageHeader, PageContent } from '~/core/components';
import { Button, Input, Form, useForm, Modal, Select, Empty } from '~/core/components/ui';
import type { SolutionType } from '~/core/entities/product-management';
import { useSolutions, useSolutionCRUD } from '../hooks';
import { SolutionCard } from '../components';

const solutionTypeOptions = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'process', label: 'Process' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

export default function SolutionsListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const { handleCreate } = useSolutionCRUD();

  const handleAdd = () => {
    form.reset();
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      await handleCreate({
        organizationId: 'org-1', // Mock organization ID
        ...values,
      });

      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

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
        {loading ? (
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        ) : solutions.length === 0 ? (
          <Empty description="No solutions yet. Click 'Add Solution' to create one." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution) => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </div>
        )}
      </PageContent>

      <Modal
        title="Add Solution"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Create"
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
