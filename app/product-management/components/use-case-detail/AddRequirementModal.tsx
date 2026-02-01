/**
 * AddRequirementModal Component
 * Modal for adding new requirements with optional EARS generation
 */

import { useState, useCallback } from 'react';
import { FiZap } from 'react-icons/fi';
import { Modal, Form, useForm, Input, Button, HStack } from '@/shared/ui';
import type { RequirementType, RequirementStatus } from '@/entities/requirement';
import { generateEarsRequirement, EarsGenerationAPIError } from '@/features/llm-generation';
import { toast } from 'sonner';

interface AddRequirementModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (data: { text: string; type: RequirementType; status: RequirementStatus }) => Promise<void>;
  teamId: string;
  isSaving?: boolean;
}

export function AddRequirementModal({
  open,
  onCancel,
  onSave,
  teamId,
  isSaving = false,
}: AddRequirementModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedType, setGeneratedType] = useState<RequirementType | null>(null);

  const form = useForm<{ text: string }>({
    text: '',
  });

  const handleGenerate = useCallback(async () => {
    const text = form.getValues().text.trim();
    if (!text) {
      toast.error('Please enter requirement text first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateEarsRequirement(text, teamId);
      form.setValue('text', result.text);
      setGeneratedType(result.type);
      toast.success(`Generated EARS requirement (${result.type})`);
    } catch (error) {
      if (error instanceof EarsGenerationAPIError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to generate EARS requirement');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [form, teamId]);

  const handleSave = useCallback(async () => {
    const text = form.getValues().text.trim();
    if (!text) {
      toast.error('Please enter requirement text');
      return;
    }

    await onSave({
      text,
      type: generatedType || 'functional',
      status: 'Todo',
    });

    // Reset state after save
    form.reset();
    setGeneratedType(null);
  }, [form, generatedType, onSave]);

  const handleClose = useCallback(() => {
    form.reset();
    setGeneratedType(null);
    onCancel();
  }, [form, onCancel]);

  const typeLabel = generatedType
    ? generatedType === 'non-functional'
      ? 'Non-Functional'
      : generatedType.charAt(0).toUpperCase() + generatedType.slice(1)
    : null;

  const customFooter = (
    <HStack gap="md">
      <Button variant="default" onClick={handleClose} disabled={isSaving || isGenerating}>
        Cancel
      </Button>
      <Button
        variant="default"
        icon={<FiZap />}
        onClick={handleGenerate}
        loading={isGenerating}
        disabled={isSaving}
      >
        Generate EARS
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        loading={isSaving}
        disabled={isGenerating}
      >
        Save
      </Button>
    </HStack>
  );

  return (
    <Modal
      title="Add Requirement"
      open={open}
      onCancel={handleClose}
      footer={customFooter}
      width={600}
    >
      <Form form={form} layout="vertical">
        <div className="space-y-4 mt-4">
          <Form.Item
            name="text"
            label="Requirement Text"
            help={
              generatedType
                ? `Type detected: ${typeLabel}`
                : 'Enter your requirement, then optionally click "Generate EARS" to format it'
            }
          >
            {({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="e.g., Users should be able to reset their password via email"
                rows={6}
              />
            )}
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
