/**
 * Create Diagram Modal
 * Modal for creating a new diagram with name and type selection
 */

import React from 'react';
import { Modal } from '~/core/components/ui/Modal';
import { Form, useForm } from '~/core/components/ui/Form';
import { Input } from '~/core/components/ui/Input';
import { Select } from '~/core/components/ui/Select';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';

export interface CreateDiagramFormData {
  name: string;
  type: DiagramType;
}

export interface CreateDiagramModalProps {
  open: boolean;
  designWorkId?: string;
  onClose: () => void;
  onCreate: (data: { designWorkId: string; name: string; type: DiagramType }) => Promise<void>;
}

const diagramTypeOptions = [
  { value: 'bpmn', label: 'BPMN Diagram' },
  { value: 'dataflow', label: 'Data Flow Diagram' },
  { value: 'class', label: 'Class Diagram' },
  { value: 'sequence', label: 'Sequence Diagram' },
  { value: 'architecture', label: 'Architecture Diagram' },
];

export function CreateDiagramModal({
  open,
  designWorkId,
  onClose,
  onCreate,
}: CreateDiagramModalProps) {
  const form = useForm<CreateDiagramFormData>({
    name: '',
    type: 'bpmn',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: CreateDiagramFormData) => {
    if (!designWorkId) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        designWorkId,
        name: data.name,
        type: data.type,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create diagram:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={form.handleSubmit(handleSubmit)}
      title="Create Diagram"
      okText="Create"
      cancelText="Cancel"
      okButtonProps={{
        disabled: !form.formState.isValid || isSubmitting,
        loading: isSubmitting,
      }}
      width={480}
    >
      <Form form={form} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Form.Item
            name="name"
            label="Diagram Name"
            required
            rules={{
              required: true,
              validate: (value) => {
                if (typeof value === 'string' && value.trim().length === 0) {
                  return 'Diagram name cannot be empty';
                }
                return true;
              },
            }}
          >
            {({ field, error }) => (
              <Input
                {...field}
                placeholder="Enter diagram name"
                error={!!error}
                autoFocus
              />
            )}
          </Form.Item>

          <Form.Item
            name="type"
            label="Diagram Type"
            required
          >
            {({ field }) => (
              <Select
                {...field}
                options={diagramTypeOptions}
                placeholder="Select diagram type"
              />
            )}
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
