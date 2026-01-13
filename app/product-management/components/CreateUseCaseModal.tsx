/**
 * CreateUseCaseModal Component
 * Modal for creating new use cases with two tabs:
 * 1. Manual Entry - User enters name and description directly
 * 2. Generate - User provides rough description, LLM generates structured use case
 */

import { useState, useCallback } from 'react';
import { FiZap } from 'react-icons/fi';
import { Input, Form, useForm, Modal, Select, Button, Tabs } from '~/core/components/ui';
import type { Solution } from '~/core/entities/product-management';
import { useCreateUseCase } from '../mutations';
import { useGenerateUseCase } from '../hooks';

interface CreateUseCaseModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  solutions: Solution[];
}

interface ManualFormData {
  name: string;
  description: string;
  solutionId: string;
}

type GenerateStep = 'input' | 'preview';

export function CreateUseCaseModal({
  open,
  onClose,
  teamId,
  solutions,
}: CreateUseCaseModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'generate'>('manual');

  // Manual form state
  const manualForm = useForm<ManualFormData>({
    name: '',
    description: '',
    solutionId: '',
  });

  // Generate tab state
  const [roughDescription, setRoughDescription] = useState('');
  const [generateStep, setGenerateStep] = useState<GenerateStep>('input');
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [generateSolutionId, setGenerateSolutionId] = useState('');

  const createUseCase = useCreateUseCase();
  const { generate, isGenerating, generatedUseCase, error: generateError, reset: resetGeneration } = useGenerateUseCase();

  // Solution options for dropdown
  const solutionOptions = [
    { value: '', label: 'Unassigned' },
    ...solutions.map((s) => ({ value: s.id, label: s.name })),
  ];

  // Reset all state when modal closes
  const handleClose = useCallback(() => {
    onClose();
    manualForm.reset();
    setActiveTab('manual');
    setRoughDescription('');
    setGenerateStep('input');
    setEditedName('');
    setEditedDescription('');
    setGenerateSolutionId('');
    resetGeneration();
  }, [onClose, manualForm, resetGeneration]);

  // Handle manual tab submission
  const handleManualSubmit = async () => {
    const isValid = await manualForm.trigger();
    if (!isValid) return;

    const values = manualForm.getValues();

    await createUseCase.mutateAsync({
      teamId,
      name: values.name,
      description: values.description || '',
      solutionId: values.solutionId || undefined,
    });

    handleClose();
  };

  // Handle generate button click
  const handleGenerate = async () => {
    const result = await generate(roughDescription);
    if (result) {
      setEditedName(result.name);
      setEditedDescription(result.description);
      setGenerateStep('preview');
    }
  };

  // Handle regenerate (go back to input step)
  const handleRegenerate = () => {
    setGenerateStep('input');
    setEditedName('');
    setEditedDescription('');
    resetGeneration();
  };

  // Handle generate tab submission
  const handleGenerateSubmit = async () => {
    if (!editedName.trim()) return;

    await createUseCase.mutateAsync({
      teamId,
      name: editedName,
      description: editedDescription || '',
      solutionId: generateSolutionId || undefined,
    });

    handleClose();
  };

  // Determine if OK button should be disabled
  const isOkDisabled = activeTab === 'manual'
    ? !manualForm.formState.isValid
    : generateStep !== 'preview' || !editedName.trim();

  // Determine if OK button should show loading
  const isOkLoading = createUseCase.isPending;

  // Handle OK click based on active tab
  const handleOk = () => {
    if (activeTab === 'manual') {
      handleManualSubmit();
    } else {
      handleGenerateSubmit();
    }
  };

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key as 'manual' | 'generate');
  };

  return (
    <Modal
      title="Create Use Case"
      open={open}
      onOk={handleOk}
      onCancel={handleClose}
      okText="Create"
      okButtonProps={{
        loading: isOkLoading,
        disabled: isOkDisabled,
      }}
      width={600}
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'manual',
            label: 'Manual Entry',
            children: (
              <Form form={manualForm} layout="vertical">
                <div className="space-y-4 pt-4">
                  <Form.Item
                    name="name"
                    label="Name"
                    required
                    rules={{
                      required: 'Please enter a use case name',
                      maxLength: { value: 200, message: 'Name must be 200 characters or less' },
                    }}
                  >
                    {({ field, error }) => (
                      <Input
                        {...field}
                        placeholder="Enter use case name"
                        error={!!error}
                        maxLength={200}
                      />
                    )}
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={{
                      maxLength: { value: 2000, message: 'Description must be 2000 characters or less' },
                    }}
                  >
                    {({ field, error }) => (
                      <Input.TextArea
                        {...field}
                        placeholder="Describe what the user is trying to accomplish"
                        rows={4}
                        error={!!error}
                        maxLength={2000}
                      />
                    )}
                  </Form.Item>

                  <Form.Item
                    name="solutionId"
                    label="Solution"
                  >
                    {({ field }) => (
                      <Select
                        {...field}
                        options={solutionOptions}
                        placeholder="Select a solution (optional)"
                      />
                    )}
                  </Form.Item>
                </div>
              </Form>
            ),
          },
          {
            key: 'generate',
            label: 'Generate',
            children: (
              <div className="space-y-4 pt-4">
                {generateStep === 'input' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                        Describe the use case
                      </label>
                      <Input.TextArea
                        value={roughDescription}
                        onChange={(e) => setRoughDescription(e.target.value)}
                        placeholder="Enter a rough description of what users need to accomplish. The AI will generate a structured use case from this."
                        rows={4}
                      />
                    </div>

                    {generateError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
                        <p className="text-sm text-red-700">{generateError}</p>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      icon={<FiZap />}
                      onClick={handleGenerate}
                      loading={isGenerating}
                      disabled={!roughDescription.trim() || isGenerating}
                    >
                      Generate Use Case
                    </Button>
                  </>
                )}

                {generateStep === 'preview' && generatedUseCase && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--text-muted)]">
                        Generated from your description. Edit as needed before saving.
                      </span>
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                      >
                        <FiZap className="w-3.5 h-3.5" />
                        Regenerate
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                        Name
                      </label>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Use case name"
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                        Description
                      </label>
                      <Input.TextArea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Use case description"
                        rows={4}
                        maxLength={2000}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                        Solution
                      </label>
                      <Select
                        value={generateSolutionId}
                        onChange={(value) => setGenerateSolutionId(value as string)}
                        options={solutionOptions}
                        placeholder="Select a solution (optional)"
                      />
                    </div>
                  </>
                )}

                {isGenerating && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[var(--text-muted)]">Generating use case...</p>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
