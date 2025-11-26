import React from 'react';
import { LuFileCode } from 'react-icons/lu';
import { Button } from '~/core/components/ui/Button';
import { useMermaidViewerStore } from '../../store/mermaid/mermaidViewerStore';
import { hasMermaidExporter } from '~/design-studio/diagrams/shared/mermaid';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';

export interface CanvasTextToolbarProps {
  diagramType: DiagramType | undefined;
}

/**
 * CanvasTextToolbar - Right-side toolbar for text-based interactions
 *
 * Positioned in the top-right corner of the canvas, this toolbar provides
 * text-based diagram operations like mermaid syntax export, AI prompts, etc.
 *
 * Currently includes:
 * - Mermaid syntax viewer button
 *
 * Future additions:
 * - AI prompt button for diagram generation
 * - Import diagram from text
 */
const CanvasTextToolbar: React.FC<CanvasTextToolbarProps> = ({ diagramType }) => {
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

        {/* Future: AI Prompt Button */}
        {/* <Button
          size="small"
          variant="default"
          icon={<RiChat4Line size={16} />}
          onClick={handleAIPrompt}
          title="Generate diagram from AI prompt"
          className="..."
        /> */}
      </div>
    </div>
  );
};

export default CanvasTextToolbar;
