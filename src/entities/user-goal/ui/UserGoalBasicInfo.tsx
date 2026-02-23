/**
 * Basic info section component for user goal details
 * Handles displaying and editing user goal name and description
 */

import { useState } from 'react';
import { EditableSection, EditableField } from '@/shared/ui';
import type { UserGoal } from '../model/types';

interface FormState {
  name: string;
  description: string;
}

type FormErrors = Record<string, string>;

export interface UserGoalBasicInfoProps {
  userGoal: UserGoal;
  onSave: (updates: { name: string; description?: string }) => Promise<void>;
  isSaving?: boolean;
}

export function UserGoalBasicInfo({ userGoal, onSave, isSaving = false }: UserGoalBasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', description: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleEditToggle = () => {
    if (!isEditing) {
      setForm({
        name: userGoal.name,
        description: userGoal.description || '',
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async (): Promise<boolean> => {
    const validationErrors: FormErrors = {};
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

  const updateField = (field: keyof FormState) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
        value={isEditing ? form.name : userGoal.name}
        isEditing={isEditing}
        onChange={updateField('name')}
        required
        error={errors.name}
        placeholder="Enter user goal name"
        maxLength={200}
      />
      <EditableField
        label="Description"
        value={isEditing ? form.description : userGoal.description}
        isEditing={isEditing}
        onChange={updateField('description')}
        type="textarea"
        rows={4}
        error={errors.description}
        placeholder="Describe this user goal..."
        maxLength={2000}
      />
    </EditableSection>
  );
}
