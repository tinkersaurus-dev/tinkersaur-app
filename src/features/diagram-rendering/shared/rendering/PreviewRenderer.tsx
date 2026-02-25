/**
 * LLM Preview Renderer
 *
 * Renders a preview of LLM-generated diagram with:
 * - Dashed border around the entire preview
 * - Nested shapes and connectors (read-only preview)
 * - Two action buttons: "Edit Mermaid" and "Apply"
 */

import { FaEdit, FaCheck } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import { getLLMPreviewShapeData, type LLMPreviewShapeData } from '@/entities/shape';
import { ShapeWrapper } from './ShapeWrapper';
import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';
import { useCanvasDiagram } from '@/widgets/canvas/ui/contexts/CanvasDiagramContext';
import { commandManager } from '@/shared/model/commands';
import { ReplaceWithEditorCommand } from '@/features/canvas-commands/commands/preview-import/ReplaceWithEditorCommand';
import { ApplyPreviewCommand } from '@/features/canvas-commands/commands/preview-import/ApplyPreviewCommand';
import { toast } from 'sonner';
import { applySequenceDiagramPostProcessing } from '@/features/diagram-rendering/sequence/postProcessing';

export function PreviewRenderer({
  shape,
  context,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: ShapeRendererProps): React.ReactElement {
  const { width: _width, height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Get diagram info from canvas diagram context
  const { diagramId } = useCanvasDiagram();
  const diagram = useDiagramStore((state) => state.diagrams[diagramId]);
  const addShape = useDiagramStore((state) => state._internalAddShape);
  const addConnector = useDiagramStore((state) => state._internalAddConnector);
  const deleteShape = useDiagramStore((state) => state._internalDeleteShape);
  const deleteConnector = useDiagramStore((state) => state._internalDeleteConnector);
  const getShape = useDiagramStore((state) => state._internalGetShape);
  const getConnector = useDiagramStore((state) => state._internalGetConnector);
  const addShapesBatch = useDiagramStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDiagramStore((state) => state._internalAddConnectorsBatch);
  const deleteShapesBatch = useDiagramStore((state) => state._internalDeleteShapesBatch);
  const deleteConnectorsBatch = useDiagramStore((state) => state._internalDeleteConnectorsBatch);
  const commandFactory = useDiagramStore((state) => state.commandFactory);

  // Parse shape data using type-safe helper - the preview shapes and connectors are already in the diagram
  const previewData = getLLMPreviewShapeData(shape) as LLMPreviewShapeData;

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 4;
  const buttonPadding = 8;
  const buttonHeight = 32;
  const buttonGap = 8;

  // Determine border color
  let borderColor = 'var(--primary)';
  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  const backgroundColor = 'transparent';

  const handleEditMermaid = async () => {
    try {
      const command = new ReplaceWithEditorCommand(
        diagramId,
        shape.id,
        previewData.mermaidSyntax,
        { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
        addShape,
        addConnector,
        deleteShape,
        deleteConnector,
        getShape,
        getConnector,
        deleteShapesBatch,
        deleteConnectorsBatch
      );

      await commandManager.execute(command, diagramId);
      toast.success('Switched to mermaid editor');
    } catch (error) {
      console.error('Error switching to editor:', error);
      toast.error('Failed to open mermaid editor');
    }
  };

  const handleApply = async () => {
    try {
      const command = new ApplyPreviewCommand(
        diagramId,
        shape.id,
        addShape,
        addConnector,
        deleteShape,
        deleteConnector,
        getShape,
        getConnector,
        addShapesBatch,
        addConnectorsBatch,
        deleteShapesBatch,
        deleteConnectorsBatch,
        diagram?.type
      );

      await commandManager.execute(command, diagramId);

      // Apply sequence diagram post-processing (lifeline heights and activation boxes)
      await applySequenceDiagramPostProcessing(diagramId, commandFactory);

      toast.success('Diagram applied successfully!');
    } catch (error) {
      console.error('Error applying preview:', error);
      toast.error('Failed to apply diagram');
    }
  };

  return (
    <ShapeWrapper
      shape={shape}
      isSelected={isSelected}
      isHovered={isHovered}
      zoom={zoom}
      borderColor="transparent"
      borderWidth={0}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      hoverPadding={0}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        height: `${height}px`,
        outlineWidth: `${borderWidth}px`,
        outlineStyle: 'dashed',
        outlineColor: borderColor,
        outlineOffset: `-${borderWidth}px`,
        overflow: 'visible',
      }}
    >
      {/* Preview shapes and connectors are rendered automatically by the canvas
          as regular diagram entities (they're marked with isPreview: true) */}

      {/* Action buttons (only show when hovered or selected) */}
      {(isHovered || isSelected) && (
        <div
          data-interactive="true"
          style={{
            position: 'absolute',
            bottom: `${-buttonHeight - buttonPadding}px`,
            right: '0',
            display: 'flex',
            gap: `${buttonGap}px`,
            pointerEvents: 'auto',
          }}
        >
          {/* Edit Mermaid button */}
          <button
            data-interactive="true"
            onClick={handleEditMermaid}
            style={{
              height: `${buttonHeight}px`,
              padding: '0 12px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'bold',
              color: 'var(--text)',
              backgroundColor: 'var(--bg)',
              border: `${1 / zoom}px solid var(--border)`,
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg)';
            }}
          >
            <FaEdit size={12} />
            Edit Mermaid
          </button>

          {/* Apply button */}
          <button
            data-interactive="true"
            onClick={handleApply}
            style={{
              height: `${buttonHeight}px`,
              padding: '0 12px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'bold',
              color: 'var(--bg)',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <FaCheck size={12} />
            Apply
          </button>
        </div>
      )}
    </ShapeWrapper>
  );
}
