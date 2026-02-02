/**
 * Basic info section component for use case details
 * Handles displaying and editing use case name and description
 */

import { useState } from 'react';
import { EditableSection, EditableField } from '@/shared/ui';
import type { UseCase } from '@/entities/use-case';
import type { BasicInfoFormState, BasicInfoErrors } from './types';

export interface UseCaseBasicInfoProps {
  useCase: UseCase;
  onSave: (updates: { name: string; description?: string }) => Promise<void>;
  isSaving?: boolean;
}

export function UseCaseBasicInfo({ useCase, onSave, isSaving = false }: UseCaseBasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<BasicInfoFormState>({ name: '', description: '' });
  const [errors, setErrors] = useState<BasicInfoErrors>({});

  const handleEditToggle = () => {
    if (!isEditing) {
      setForm({
        name: useCase.name,
        description: useCase.description || '',
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async (): Promise<boolean> => {
    // Validate
    const validationErrors: BasicInfoErrors = {};
    if (!form.name.trim()) {
      validationErrors.name = 'Name is required';
    } else if (form.name.length > 200) {
      validationErrors.name = 'Name must be 200 characters or less';
    }
    if (form.description && form.description.length > 2000) {
      validationErrors.description = 'Description must be 2000 characters or less';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    // Save
    try {
      await onSave({
        name: form.name,
        description: form.description || undefined,
      });
      setIsEditing(false);
      return true;
    } catch {
      return false;
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  const updateField = (field: keyof BasicInfoFormState) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <EditableSection
      title="Basic Information"
      isEditing={isEditing}
      onEditToggle={handleEditToggle}
      onSave={handleSave}
      onCancel={handleCancel}
      shadow={false}
      isSaving={isSaving}
      hasErrors={Object.keys(errors).length > 0}
    >
      <EditableField
        label="Name"
        value={isEditing ? form.name : useCase.name}
        isEditing={isEditing}
        onChange={updateField('name')}
        required
        error={errors.name}
        placeholder="Enter use case name"
        maxLength={200}
      />
      <EditableField
        label="Description"
        value={isEditing ? form.description : useCase.description}
        isEditing={isEditing}
        onChange={updateField('description')}
        type="textarea"
        rows={4}
        error={errors.description}
        placeholder="Describe this use case..."
        maxLength={2000}
      />
    </EditableSection>
  );
}
