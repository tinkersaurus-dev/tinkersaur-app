/**
 * CreateSolutionModal Component
 * Reusable modal for creating new solutions
 */

import { Input, Form, useForm, Modal, Select } from '~/core/components/ui';
import type { SolutionType, Solution } from '~/core/entities/product-management';
import { useCreateSolution } from '~/product-management/mutations';
import { useAuthStore } from '~/core/auth';
import { useSolutionStore } from '~/core/solution';

interface CreateSolutionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (solution: Solution) => void;
}

const solutionTypeOptions = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'process', label: 'Process' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

export function CreateSolutionModal({ open, onClose, onSuccess }: CreateSolutionModalProps) {
  const form = useForm<{
    name: string;
    description: string;
    type: SolutionType;
  }>({
    name: '',
    description: '',
    type: 'product',
  });

  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;
  const createSolution = useCreateSolution();
  const selectSolution = useSolutionStore((state) => state.selectSolution);

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (!teamId) {
        console.error('No team selected');
        return;
      }

      const newSolution = await createSolution.mutateAsync({
        teamId,
        ...values,
      });

      // Auto-select the newly created solution
      selectSolution(newSolution);

      onClose();
      form.reset();
      onSuccess?.(newSolution);
    } catch (error) {
      console.error('Failed to create solution:', error);
    }
  };

  const handleCancel = () => {
    onClose();
    form.reset();
  };

  return (
    <Modal
      title="Create Solution"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Create"
      okButtonProps={{ loading: createSolution.isPending }}
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
  );
}
