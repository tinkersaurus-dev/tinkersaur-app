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
import type { MermaidEditorShapeData, DiagramType } from '~/core/entities/design-studio/types';
import { ShapeWrapper } from './ShapeWrapper';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio/store';
import { useCanvasController } from '~/design-studio/components/canvas/core/CanvasControllerContext';
import { commandManager } from '~/core/commands/CommandManager';
import { UpdatePreviewCommand } from '~/core/commands/canvas/UpdatePreviewCommand';
import { toast } from 'sonner';
import { applySequenceDiagramPostProcessing } from '~/design-studio/utils/sequenceDiagramPostProcessing';

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
  const { diagramId, diagram } = useCanvasController();
  const addShape = useDesignStudioEntityStore((state) => state._internalAddShape);
  const addConnector = useDesignStudioEntityStore((state) => state._internalAddConnector);
  const deleteShape = useDesignStudioEntityStore((state) => state._internalDeleteShape);
  const deleteConnector = useDesignStudioEntityStore((state) => state._internalDeleteConnector);
  const getShape = useDesignStudioEntityStore((state) => state._internalGetShape);
  const addShapesBatch = useDesignStudioEntityStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDesignStudioEntityStore((state) => state._internalAddConnectorsBatch);
  const deleteShapesBatch = useDesignStudioEntityStore((state) => state._internalDeleteShapesBatch);
  const deleteConnectorsBatch = useDesignStudioEntityStore((state) => state._internalDeleteConnectorsBatch);
  const commandFactory = useDesignStudioEntityStore((state) => state.commandFactory);

  const diagramType = diagram?.type as DiagramType | undefined;

  // Parse shape data
  const editorData = (shape.data || {}) as unknown as MermaidEditorShapeData;
  const [mermaidSyntax, setMermaidSyntax] = useState(editorData.mermaidSyntax || '');
  const [error, setError] = useState(editorData.error);
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
        editorData.previewShapeId, // originalGeneratorShapeId (from the original preview)
        null, // oldPreviewShapeId (there's no old preview when updating from editor)
        addShape,
        addConnector,
        deleteShape,
        deleteConnector,
        getShape,
        addShapesBatch,
        addConnectorsBatch,
        deleteShapesBatch,
        deleteConnectorsBatch
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
          fontSize: '12px',
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
          fontSize: '11px',
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
            fontSize: '10px',
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
          fontSize: '12px',
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
