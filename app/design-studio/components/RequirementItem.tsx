/**
 * RequirementItem Component
 * A single draggable requirement row for the Overview tab
 */

import { Tag } from '~/core/components/ui';
import type { RequirementWithUseCase } from '~/product-management/queries/useRequirementsBySolutionQuery';
import { REQUIREMENT_TYPE_CONFIG, REQUIREMENT_STATUS_CONFIG } from '~/core/entities/product-management/types';

interface RequirementItemProps {
  requirement: RequirementWithUseCase;
  folderNames?: string[];
}

export function RequirementItem({ requirement, folderNames = [] }: RequirementItemProps) {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'requirement',
        requirementId: requirement.id,
      })
    );

    // Create drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText =
      'position:absolute;top:-1000px;padding:4px 8px;background:var(--bg-light);border:1px solid var(--border);border-radius:4px;font-size:10px;max-width:200px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;';
    dragImage.textContent = requirement.text.substring(0, 40) + (requirement.text.length > 40 ? '...' : '');
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="hover:bg-[var(--highlight)] cursor-grab active:cursor-grabbing transition-colors"
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '4px' }}>
        {requirement.text}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <Tag color={REQUIREMENT_TYPE_CONFIG[requirement.type].color}>{REQUIREMENT_TYPE_CONFIG[requirement.type].label}</Tag>
        <Tag color={REQUIREMENT_STATUS_CONFIG[requirement.status].color}>{REQUIREMENT_STATUS_CONFIG[requirement.status].label}</Tag>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span>{requirement.useCaseName}</span>
        {folderNames.length > 0 && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--success)' }}>
              → {folderNames.join(', ')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
