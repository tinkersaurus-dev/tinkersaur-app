/**
 * EpicEditModal - Modal for editing epic details
 */

import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/shared/ui';
import type { Epic, UpdateEpicDto, EpicStatus } from '@/entities/planning';
import { EpicStatus as EpicStatusEnum, EpicStatusLabels } from '@/entities/planning';
import { useUpdateEpic } from '../api/usePlanningMutations';

interface EpicEditModalProps {
  epic: Epic;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EpicEditModal({ epic, open, onClose, onSuccess }: EpicEditModalProps) {
  const [title, setTitle] = useState(epic.title);
  const [description, setDescription] = useState(epic.description);
  const [status, setStatus] = useState<EpicStatus>(epic.status as EpicStatus);

  const updateMutation = useUpdateEpic();

  const handleSubmit = async () => {
    const data: UpdateEpicDto = {};

    if (title !== epic.title) data.title = title;
    if (description !== epic.description) data.description = description;
    if (status !== epic.status) data.status = status;

    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }

    await updateMutation.mutateAsync({ epicId: epic.id, data });
    onSuccess();
  };

  const statusOptions = Object.values(EpicStatusEnum).map((value) => ({
    value,
    label: EpicStatusLabels[value],
  }));

  return (
    <Modal open={open} onCancel={onClose} title="Edit Epic" width={500} footer={null}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Epic title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Epic description"
            rows={4}
            className="w-full px-3 py-2 border border-[var(--border-muted)] rounded-md bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Status</label>
          <Select
            value={status}
            onChange={(value) => setStatus(value as EpicStatus)}
            options={statusOptions}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={updateMutation.isPending}
          disabled={!title.trim()}
        >
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}
