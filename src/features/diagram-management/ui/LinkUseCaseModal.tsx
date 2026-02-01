/**
 * Link Use Case Modal
 * Modal for linking a folder (DesignWork) to a Use Case
 * Shows all use cases from the team (not just the current solution)
 */

import React from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Form, useForm } from '@/shared/ui/Form';
import { Select } from '@/shared/ui/Select';
import { useUseCasesByTeamQuery, type UseCase } from '@/entities/use-case';

export interface LinkUseCaseFormData {
  useCaseId: string;
}

export interface LinkUseCaseModalProps {
  open: boolean;
  designWorkId?: string;
  currentUseCaseId?: string;
  solutionId: string;
  teamId: string | undefined;
  onClose: () => void;
  onLink: (designWorkId: string, useCaseId: string | undefined) => Promise<void>;
}

export function LinkUseCaseModal({
  open,
  designWorkId,
  currentUseCaseId,
  solutionId,
  teamId,
  onClose,
  onLink,
}: LinkUseCaseModalProps) {
  // Fetch all use cases from the team (not filtered by solution)
  const { data: useCases = [], isLoading: loadingUseCases } = useUseCasesByTeamQuery(teamId);

  const form = useForm<LinkUseCaseFormData>({
    useCaseId: currentUseCaseId || '',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (open) {
      form.reset({ useCaseId: currentUseCaseId || '' });
    }
  }, [open, currentUseCaseId, form]);

  const handleSubmit = async (data: LinkUseCaseFormData) => {
    if (!designWorkId) return;

    setIsSubmitting(true);
    try {
      // Empty string means unlink (set to undefined)
      const useCaseIdToSet = data.useCaseId || undefined;
      await onLink(designWorkId, useCaseIdToSet);
      onClose();
    } catch (error) {
      console.error('Failed to link use case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  // Build options: "None" + all use cases, grouped by solution assignment
  const assignedUseCases = useCases.filter((uc: UseCase) => uc.solutionId === solutionId);
  const otherUseCases = useCases.filter((uc: UseCase) => uc.solutionId !== solutionId);

  const useCaseOptions = [
    { value: '', label: 'None (Unlink)' },
    ...assignedUseCases.map((uc: UseCase) => ({
      value: uc.id,
      label: uc.name,
    })),
    ...otherUseCases.map((uc: UseCase) => ({
      value: uc.id,
      label: `${uc.name}${uc.solutionId ? '' : ' (Unassigned)'}`,
    })),
  ];

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={form.handleSubmit(handleSubmit)}
      title="Link to Use Case"
      okText="Link"
      cancelText="Cancel"
      okButtonProps={{
        disabled: isSubmitting || loadingUseCases,
        loading: isSubmitting,
      }}
      width={480}
    >
      <Form form={form} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Form.Item
            name="useCaseId"
            label="Use Case"
          >
            {({ field }) => (
              <Select
                {...field}
                options={useCaseOptions}
                placeholder={loadingUseCases ? 'Loading use cases...' : 'Select a use case'}
                disabled={loadingUseCases}
              />
            )}
          </Form.Item>

          {useCases.length === 0 && !loadingUseCases && (
            <p className="text-sm text-[var(--text-secondary)]">
              No use cases found in this team. Create use cases in the Product Management area first.
            </p>
          )}
        </div>
      </Form>
    </Modal>
  );
}
