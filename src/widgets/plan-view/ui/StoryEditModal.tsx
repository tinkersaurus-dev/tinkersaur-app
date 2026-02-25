/**
 * StoryEditModal - Modal for editing story details
 */

import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/shared/ui';
import type { Story, UpdateStoryDto, StoryStatus } from '@/entities/planning';
import { StoryStatus as StoryStatusEnum, StoryStatusLabels } from '@/entities/planning';
import { useUpdateStory } from '@/features/planning';

interface StoryEditModalProps {
  story: Story;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StoryEditModal({ story, open, onClose, onSuccess }: StoryEditModalProps) {
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);
  const [storyPoints, setStoryPoints] = useState<string>(
    story.storyPoints !== null ? String(story.storyPoints) : ''
  );
  const [status, setStatus] = useState<StoryStatus>(story.status as StoryStatus);

  const updateMutation = useUpdateStory();

  const handleSubmit = async () => {
    const data: UpdateStoryDto = {};

    if (title !== story.title) data.title = title;
    if (description !== story.description) data.description = description;
    if (status !== story.status) data.status = status;

    const pointsNum = storyPoints ? parseInt(storyPoints, 10) : null;
    if (pointsNum !== story.storyPoints) {
      data.storyPoints = pointsNum;
    }

    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }

    await updateMutation.mutateAsync({ storyId: story.id, data });
    onSuccess();
  };

  const statusOptions = Object.values(StoryStatusEnum).map((value) => ({
    value,
    label: StoryStatusLabels[value],
  }));

  return (
    <Modal open={open} onCancel={onClose} title="Edit Story" width={500} footer={null}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Story description"
            rows={4}
            className="w-full px-3 py-2 border border-[var(--border-muted)] rounded-md bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Story Points</label>
          <Input
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
            placeholder="e.g., 3"
            min={1}
            max={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Status</label>
          <Select
            value={status}
            onChange={(value) => setStatus(value as StoryStatus)}
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
