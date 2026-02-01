/**
 * Mermaid Editor Renderer
 *
 * Renders an editable textarea for mermaid syntax with:
 * - Large textarea for editing mermaid code
 * - "Update Diagram" button to re-parse and show preview
 * - Error display for invalid syntax
 */

import { useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import { getMermaidEditorShapeData } from '@/entities/shape';
import type { DiagramType } from '@/entities/diagram';
import { ShapeWrapper } from './ShapeWrapper';
import { useDiagramStore } from '@/entities/diagram';
import { useCanvasDiagram } from '@/widgets/canvas/ui/contexts/CanvasDiagramContext';
import { commandManager } from '@/features/canvas-commands/model/CommandManager';
import { UpdatePreviewCommand } from '@/features/canvas-commands/commands/preview-import/UpdatePreviewCommand';
import { toast } from 'sonner';
import { applySequenceDiagramPostProcessing } from '@/features/diagram-rendering/sequence/postProcessing';

export function MermaidEditorRenderer({
  shape,
  context,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: ShapeRendererProps): React.ReactElement {
  const { width: _width, height: _height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Get diagram info and store functions
  const { diagramId, diagram } = useCanvasDiagram();
  const addShape = useDiagramStore((state) => state._internalAddShape);
  const addConnector = useDiagramStore((state) => state._internalAddConnector);
  const deleteShape = useDiagramStore((state) => state._internalDeleteShape);
  const deleteConnector = useDiagramStore((state) => state._internalDeleteConnector);
  const getShape = useDiagramStore((state) => state._internalGetShape);
  const addShapesBatch = useDiagramStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDiagramStore((state) => state._internalAddConnectorsBatch);
  const deleteShapesBatch = useDiagramStore((state) => state._internalDeleteShapesBatch);
  const deleteConnectorsBatch = useDiagramStore((state) => state._internalDeleteConnectorsBatch);
  const updateShape = useDiagramStore((state) => state._internalUpdateShape);
  const commandFactory = useDiagramStore((state) => state.commandFactory);

  const diagramType = diagram?.type as DiagramType | undefined;

  // Parse shape data using type-safe helper
  const editorData = getMermaidEditorShapeData(shape);
  const [mermaidSyntax, setMermaidSyntax] = useState(editorData?.mermaidSyntax || '');
  const [error, setError] = useState(editorData?.error);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 4;
  const padding = 12;

  // Determine border color
  let borderColor = 'var(--border)';
  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  const backgroundColor = isSelected ? 'var(--bg-light)' : 'var(--bg)';

  const handleUpdateDiagram = async () => {
    if (!diagramId || !diagramType) {
      setError('Could not determine diagram type');
      toast.error('Could not determine diagram type');
      return;
    }

    if (!mermaidSyntax.trim()) {
      setError('Please enter mermaid syntax');
      return;
    }

    try {
      setIsUpdating(true);
      setError(undefined);

      const command = new UpdatePreviewCommand(
        diagramId,
        diagramType,
        shape.id,
        mermaidSyntax,
        { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
        editorData?.previewShapeId || '', // originalGeneratorShapeId (from the original preview)
        null, // oldPreviewShapeId (there's no old preview when updating from editor)
        addShape,
        addConnector,
        deleteShape,
        deleteConnector,
        getShape,
        addShapesBatch,
        addConnectorsBatch,
        deleteShapesBatch,
        deleteConnectorsBatch,
        updateShape
      );

      await commandManager.execute(command, diagramId);

      // Apply sequence diagram post-processing (lifeline heights and activation boxes)
      await applySequenceDiagramPostProcessing(diagramId, commandFactory);

      toast.success('Diagram updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update diagram';
      setError(errorMessage);
      setIsUpdating(false);
      toast.error(errorMessage);
    }
  };

  return (
    <ShapeWrapper
      shape={shape}
      isSelected={isSelected}
      isHovered={isHovered}
      zoom={zoom}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: `${padding}px`,
        gap: `${padding}px`
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'bold',
          color: 'var(--text)',
          textAlign: 'center',
        }}
      >
        Edit Mermaid Syntax
      </div>

      {/* Mermaid syntax textarea */}
      <textarea
        data-interactive="true"
        value={mermaidSyntax}
        onChange={(e) => setMermaidSyntax(e.target.value)}
        placeholder="Enter mermaid syntax here..."
        disabled={isUpdating}
        spellCheck={false}
        style={{
          width: '100%',
          height:'300px',
          padding: '8px',
          fontSize: 'var(--font-size-base)',
          fontFamily: 'monospace',
          color: 'var(--text)',
          backgroundColor: 'var(--bg)',
          border: `${1 / zoom}px solid var(--border)`,
          borderRadius: '2px',
          resize: 'none',
          outline: 'none',
          opacity: isUpdating ? 0.6 : 1,
          whiteSpace: 'pre',
          overflowWrap: 'normal',
          overflowX: 'auto',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      />

      {/* Error display */}
      {error && (
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--error)',
            backgroundColor: 'var(--error-bg)',
            padding: '6px',
            borderRadius: '2px',
            border: `${1 / zoom}px solid var(--error)`,
          }}
        >
          {error}
        </div>
      )}

      {/* Update diagram button */}
      <button
        data-interactive="true"
        onClick={handleUpdateDiagram}
        disabled={isUpdating || !mermaidSyntax.trim()}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'bold',
          color: isUpdating || !mermaidSyntax.trim() ? 'var(--text-muted)' : 'var(--bg)',
          backgroundColor: isUpdating || !mermaidSyntax.trim() ? 'var(--bg-muted)' : 'var(--primary)',
          border: 'none',
          borderRadius: '2px',
          cursor: isUpdating || !mermaidSyntax.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'opacity 0.2s',
          opacity: isUpdating || !mermaidSyntax.trim() ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isUpdating && mermaidSyntax.trim()) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {isUpdating ? (
          <>
            <div
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid var(--text-muted)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Updating...
          </>
        ) : (
          <>
            <FaSyncAlt size={10} />
            Update Diagram
          </>
        )}
      </button>

      {/* Spinning animation for loading indicator */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </ShapeWrapper>
  );
}
