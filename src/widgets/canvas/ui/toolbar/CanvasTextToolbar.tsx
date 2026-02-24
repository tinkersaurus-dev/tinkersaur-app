import React from 'react';
import { LuFileCode, LuLightbulb, LuLoader } from 'react-icons/lu';
import { Button } from '@/shared/ui';
import { useMermaidViewerStore } from '@/features/diagram-management';
import { hasMermaidExporter } from '@/features/diagram-rendering/shared/mermaid';
import type { DiagramType } from '@/entities/diagram';

export interface CanvasTextToolbarProps {
  diagramType: DiagramType | undefined;
  onGenerateSuggestions?: () => void;
  isSuggestionsLoading?: boolean;
}

/**
 * CanvasTextToolbar - Right-side toolbar for text-based interactions
 *
 * Positioned in the top-right corner of the canvas, this toolbar provides
 * text-based diagram operations like mermaid syntax export, AI prompts, etc.
 *
 * Currently includes:
 * - Mermaid syntax viewer button
 * - AI suggestions button
 */
const CanvasTextToolbar: React.FC<CanvasTextToolbarProps> = ({
  diagramType,
  onGenerateSuggestions,
  isSuggestionsLoading = false,
}) => {
  const { toggleOpen } = useMermaidViewerStore();

  // Check if mermaid export is available for this diagram type
  const isMermaidAvailable = diagramType ? hasMermaidExporter(diagramType) : false;

  const positionStyles: React.CSSProperties = {
    top: '16px',
    right: '16px',
  };

  return (
    <div className="absolute z-10 flex gap-1 p-1" style={positionStyles}>
      <div className="flex flex-col gap-1">
        {/* Mermaid Viewer Button */}
        <Button
          size="small"
          variant="default"
          icon={<LuFileCode size={16} />}
          onClick={toggleOpen}
          disabled={!isMermaidAvailable}
          title={
            isMermaidAvailable
              ? 'View Mermaid syntax'
              : 'Mermaid export not available for this diagram type'
          }
          className="
            bg-[var(--bg-light)] hover:bg-[var(--highlight)]
            border-none
            transition-colors duration-150
            shadow-sm
          "
        />

        {/* AI Suggestions Button */}
        <Button
          size="small"
          variant="default"
          icon={
            isSuggestionsLoading ? (
              <LuLoader size={16} className="animate-spin" />
            ) : (
              <LuLightbulb size={16} />
            )
          }
          onClick={onGenerateSuggestions}
          disabled={!isMermaidAvailable || isSuggestionsLoading || !onGenerateSuggestions}
          title={
            isSuggestionsLoading
              ? 'Generating suggestions...'
              : isMermaidAvailable
              ? 'Get AI improvement suggestions'
              : 'Suggestions not available for this diagram type'
          }
          className="
            bg-[var(--bg-light)] hover:bg-[var(--highlight)]
            border-none
            transition-colors duration-150
            shadow-sm
          "
        />
      </div>
    </div>
  );
};

export default CanvasTextToolbar;
