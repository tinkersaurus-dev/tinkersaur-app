/**
 * Card component for displaying and editing a single solution factor
 */

import { useState, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiCalendar, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import { MarkdownContent } from '@/shared/ui/MarkdownContent';
import { Input, Button } from '@/shared/ui';
import { RefinementPreview } from './RefinementPreview';
import type {
  SolutionFactor,
  SolutionFactorType,
  UpdateSolutionFactorDto,
} from '@/entities/solution-factor';

interface FactorCardProps {
  factor: SolutionFactor;
  factorType: SolutionFactorType;
  onUpdate: (id: string, updates: UpdateSolutionFactorDto) => Promise<void>;
  onDelete: (id: string) => void;
  onRefine?: (
    factorType: SolutionFactorType,
    content: string,
    instructions: string
  ) => Promise<string | null>;
  isUpdating?: boolean;
  isRefining?: boolean;
  showTargetDate?: boolean;
}

export function FactorCard({
  factor,
  factorType,
  onUpdate,
  onDelete,
  onRefine,
  isUpdating = false,
  isRefining = false,
  showTargetDate = false,
}: FactorCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(factor.content);
  const [editNotes, setEditNotes] = useState(factor.notes);
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [refinedContent, setRefinedContent] = useState<string | null>(null);
  const [refinementError, setRefinementError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (editContent.trim() === factor.content && editNotes === factor.notes) {
      setIsEditing(false);
      return;
    }

    await onUpdate(factor.id, {
      content: editContent.trim(),
      notes: editNotes,
    });
    setIsEditing(false);
  }, [factor.id, factor.content, factor.notes, editContent, editNotes, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditContent(factor.content);
    setEditNotes(factor.notes);
    setRefinementInstructions('');
    setRefinedContent(null);
    setRefinementError(null);
    setIsEditing(false);
  }, [factor.content, factor.notes]);

  const handleRefine = useCallback(async () => {
    if (!onRefine || !refinementInstructions.trim()) return;

    setRefinementError(null);
    try {
      const refined = await onRefine(factorType, editContent, refinementInstructions);
      if (refined) {
        setRefinedContent(refined);
      }
    } catch (err) {
      setRefinementError(err instanceof Error ? err.message : 'Failed to refine factor');
    }
  }, [onRefine, factorType, editContent, refinementInstructions]);

  const handleUseRefined = useCallback(async () => {
    if (refinedContent) {
      // Save the refined content immediately and exit edit mode
      await onUpdate(factor.id, {
        content: refinedContent.trim(),
        notes: editNotes,
      });
      setRefinedContent(null);
      setRefinementInstructions('');
      setRefinementError(null);
      setIsEditing(false);
    }
  }, [refinedContent, factor.id, editNotes, onUpdate]);

  const handleEditRefined = useCallback(() => {
    if (refinedContent) {
      setEditContent(refinedContent);
      setRefinedContent(null);
    }
  }, [refinedContent]);

  const handleKeepOriginal = useCallback(() => {
    setRefinedContent(null);
  }, []);

  const handleToggleActive = useCallback(() => {
    onUpdate(factor.id, { active: !factor.active });
  }, [factor.id, factor.active, onUpdate]);

  if (isEditing) {
    // Show refinement preview if we have refined content
    if (refinedContent !== null) {
      return (
        <div className="p-4 border border-[var(--border)] rounded-sm bg-[var(--bg)]">
          <RefinementPreview
            original={factor.content}
            refined={refinedContent}
            onUseRefined={handleUseRefined}
            onEditRefined={handleEditRefined}
            onKeepOriginal={handleKeepOriginal}
            isSaving={isUpdating}
          />
        </div>
      );
    }

    return (
      <div className="p-4 border border-[var(--border)] rounded-sm bg-[var(--bg)]">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Content
            </label>
            <Input.TextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              size="small"
              placeholder="Enter content (supports markdown)..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Notes (optional)
            </label>
            <Input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              size="small"
              placeholder="Add notes..."
            />
          </div>
          {onRefine && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Refinement Instructions
              </label>
              <Input.TextArea
                value={refinementInstructions}
                onChange={(e) => setRefinementInstructions(e.target.value)}
                rows={2}
                size="small"
                placeholder="Describe how to improve this factor (e.g., 'make it more concise', 'focus on enterprise customers')"
              />
            </div>
          )}
          {refinementError && (
            <div className="text-sm text-red-600">{refinementError}</div>
          )}
          <div className="flex justify-end gap-2">
            {onRefine && (
              <Button
                variant="text"
                size="small"
                onClick={handleRefine}
                disabled={!refinementInstructions.trim() || isRefining || isUpdating}
                icon={<FiZap className="w-3.5 h-3.5" />}
              >
                {isRefining ? 'Refining...' : 'Refine with AI'}
              </Button>
            )}
            <Button
              variant="text"
              size="small"
              onClick={handleCancel}
              disabled={isUpdating || isRefining}
              icon={<FiX className="w-4 h-4" />}
            />
            <Button
              variant="text"
              size="small"
              onClick={handleSave}
              disabled={isUpdating || isRefining}
              icon={<FiCheck className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border border-[var(--border)] rounded-sm bg-[var(--bg)] group ${
        !factor.active ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <MarkdownContent
            content={factor.content}
            className="markdown-content markdown-content--compact text-sm"
          />
          {factor.notes && (
            <p className="mt-2 text-xs text-[var(--text-muted)] italic">{factor.notes}</p>
          )}
          {showTargetDate && factor.targetDate && (
            <div className="mt-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <FiCalendar className="w-3 h-3" />
              <span>Target: {new Date(factor.targetDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="text"
            size="small"
            onClick={handleToggleActive}
            title={factor.active ? 'Mark inactive' : 'Mark active'}
            icon={factor.active ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
          />
          <Button
            variant="text"
            size="small"
            onClick={() => setIsEditing(true)}
            title="Edit"
            icon={<FiEdit2 className="w-4 h-4" />}
          />
          <Button
            variant="text"
            size="small"
            onClick={() => onDelete(factor.id)}
            title="Delete"
            icon={<FiTrash2 className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );
}
