/**
 * Link Use Case Modal
 * Modal for linking a folder (DesignWork) to a Use Case
 */

import React from 'react';
import { Modal } from '~/core/components/ui/Modal';
import { Form, useForm } from '~/core/components/ui/Form';
import { Select } from '~/core/components/ui/Select';
import { useUseCasesQuery } from '~/product-management/queries';

export interface LinkUseCaseFormData {
  useCaseId: string;
}

export interface LinkUseCaseModalProps {
  open: boolean;
  designWorkId?: string;
  currentUseCaseId?: string;
  solutionId: string;
  onClose: () => void;
  onLink: (designWorkId: string, useCaseId: string | undefined) => Promise<void>;
}

export function LinkUseCaseModal({
  open,
  designWorkId,
  currentUseCaseId,
  solutionId,
  onClose,
  onLink,
}: LinkUseCaseModalProps) {
  const { data: useCases = [], isLoading: loadingUseCases } = useUseCasesQuery(solutionId);

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

  // Build options: "None" + all use cases
  const useCaseOptions = [
    { value: '', label: 'None (Unlink)' },
    ...useCases.map((uc) => ({
      value: uc.id,
      label: uc.name,
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
              No use cases found in this solution. Create use cases in the Product Management area first.
            </p>
          )}
        </div>
      </Form>
    </Modal>
  );
}
