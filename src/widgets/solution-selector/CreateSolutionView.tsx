/**
 * CreateSolutionView Component
 * View content for creating solutions (used within SolutionSelectorModal)
 */

import { Input, Form, useForm, Select, Button } from '@/shared/ui';
import type { SolutionType, Solution } from '@/entities/solution';
import { useCreateSolution } from '@/entities/solution';
import { useAuthStore } from '@/features/auth';
import { useSolutionStore } from '@/app/model/stores/solution';

interface CreateSolutionViewProps {
  onCancel: () => void;
  onSuccess: (solution: Solution) => void;
}

const solutionTypeOptions = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'process', label: 'Process' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

export function CreateSolutionView({ onCancel, onSuccess }: CreateSolutionViewProps) {
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

  const handleCreate = async () => {
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

      selectSolution(newSolution);
      form.reset();
      onSuccess(newSolution);
    } catch (error) {
      console.error('Failed to create solution:', error);
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <div className="flex flex-col">
      <Form form={form} layout="vertical">
        <div className="space-y-4">
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

      {/* Footer buttons */}
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[var(--border)]">
        <Button variant="default" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          loading={createSolution.isPending}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
