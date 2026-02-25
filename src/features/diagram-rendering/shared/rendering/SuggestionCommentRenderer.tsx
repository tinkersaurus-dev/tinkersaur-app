/**
 * Suggestion Comment Renderer
 *
 * Renders AI-generated improvement suggestions as comment shapes.
 * These shapes are transparent with red text and a lightbulb icon.
 * They are linked to their target shapes via curved connectors.
 * Includes Accept and Reject buttons for user interaction.
 */

import { useState } from 'react';
import { LuLightbulb } from 'react-icons/lu';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { ImSpinner8 } from 'react-icons/im';
import type { ShapeRendererProps } from './types';
import { isSuggestionCommentShapeData } from '@/entities/shape';
import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';
import { useCanvasDiagram } from '@/widgets/canvas/ui/contexts/CanvasDiagramContext';
import { commandManager } from '@/shared/model/commands';
import { RejectSuggestionCommand } from '@/features/canvas-commands/commands/suggestions/RejectSuggestionCommand';
import { ApplySuggestionCommand } from '@/features/canvas-commands/commands/suggestions/ApplySuggestionCommand';
import { useAuthStore } from '@/shared/auth';
import { toast } from 'sonner';

export function SuggestionCommentRenderer({
  shape,
  context,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: ShapeRendererProps): React.ReactElement {
  const { width, height } = shape;
  const { isSelected, isHovered } = context;
  const [isApplying, setIsApplying] = useState(false);

  // Get diagram context and store functions
  const { diagramId } = useCanvasDiagram();
  const diagrams = useDiagramStore((state) => state.diagrams);
  const diagram = diagrams[diagramId];
  const getShape = useDiagramStore((state) => state._internalGetShape);
  const deleteShape = useDiagramStore((state) => state._internalDeleteShape);
  const addShape = useDiagramStore((state) => state._internalAddShape);
  const deleteConnector = useDiagramStore((state) => state._internalDeleteConnector);
  const addConnector = useDiagramStore((state) => state._internalAddConnector);
  const addShapesBatch = useDiagramStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDiagramStore((state) => state._internalAddConnectorsBatch);

  // Create a getDiagram function that matches the expected signature
  const getDiagram = (id: string) => diagrams[id];

  // Get teamId for API calls
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  // Extract suggestion data
  const suggestionData = shape.data && isSuggestionCommentShapeData(shape.data)
    ? shape.data
    : null;
  const suggestionText = suggestionData?.suggestion || shape.label || 'Suggestion';

  // Disable interactivity for preview shapes
  const isInteractive = !shape.isPreview;
  const showHover = isInteractive && isHovered;
  const showSelected = isInteractive && isSelected;

  // Icon size scales slightly with zoom
  const iconSize = 14;
  const padding = 6;
  const fontSize = 11;
  const buttonHeight = 24;

  // Selection/hover indicator
  let outlineStyle = 'none';
  if (showSelected) {
    outlineStyle = `2px solid var(--primary)`;
  } else if (showHover) {
    outlineStyle = `1px dashed var(--border)`;
  }

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!diagramId) {
      toast.error('Diagram not found');
      return;
    }

    try {
      const command = new RejectSuggestionCommand(
        diagramId,
        shape.id,
        getShape,
        deleteShape,
        addShape,
        getDiagram,
        deleteConnector,
        addConnector
      );
      await commandManager.execute(command, diagramId);
      toast.success('Suggestion rejected');
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      toast.error('Failed to reject suggestion');
    }
  };

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!diagramId || !diagram?.type) {
      toast.error('Diagram not found');
      return;
    }

    setIsApplying(true);
    try {
      const command = new ApplySuggestionCommand(
        diagramId,
        diagram.type,
        shape.id,
        teamId,
        getShape,
        deleteShape,
        addShape,
        getDiagram,
        deleteConnector,
        addConnector,
        addShapesBatch,
        addConnectorsBatch
      );
      await commandManager.execute(command, diagramId);
      toast.success('Suggestion applied - review the preview');
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply suggestion');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        width: `${width}px`,
        minHeight: `${height}px`,
        // Transparent background - no fill, no border
        backgroundColor: 'transparent',
        border: 'none',
        // Selection/hover visual feedback
        outline: outlineStyle,
        outlineOffset: '2px',
        borderRadius: '4px',
        // Layout
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: `${padding}px`,
        padding: `${padding}px`,
        // Interaction
        cursor: isInteractive ? 'pointer' : 'default',
        userSelect: 'none',
        // Don't block clicks to shapes beneath when not interacting
        pointerEvents: isInteractive ? 'auto' : 'none',
      }}
      onMouseDown={(e) => {
        if (isInteractive && onMouseDown) {
          e.stopPropagation();
          onMouseDown(e, shape.id);
        }
      }}
      onMouseEnter={(e) => {
        if (isInteractive && onMouseEnter) {
          onMouseEnter(e, shape.id);
        }
      }}
      onMouseLeave={(e) => {
        if (isInteractive && onMouseLeave) {
          onMouseLeave(e, shape.id);
        }
      }}
    >
      {/* Lightbulb icon */}
      <div
        style={{
          flexShrink: 0,
          color: 'var(--canvas-suggestion-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '1px',
        }}
      >
        <LuLightbulb size={iconSize} />
      </div>

      {/* Suggestion text */}
      <div
        style={{
          flex: 1,
          color: 'var(--canvas-suggestion-color)',
          fontSize: `${fontSize}px`,
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'inherit',
        }}
      >
        {suggestionText}
      </div>

      {/* Action buttons - show on hover or selected */}
      {isInteractive && (showHover || showSelected) && (
        <div
          data-interactive="true"
          style={{
            position: 'absolute',
            bottom: `${-buttonHeight - 8}px`,
            right: '0',
            display: 'flex',
            gap: '6px',
            pointerEvents: 'auto',
          }}
        >
          {/* Reject button */}
          <button
            data-interactive="true"
            onClick={handleReject}
            disabled={isApplying}
            style={{
              height: `${buttonHeight}px`,
              padding: '0 8px',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'bold',
              color: 'var(--text)',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              cursor: isApplying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: isApplying ? 0.5 : 1,
              transition: 'background-color 0.2s, opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isApplying) {
                e.currentTarget.style.backgroundColor = 'var(--bg-light)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg)';
            }}
          >
            <FaTimes size={10} />
            Reject
          </button>

          {/* Apply button */}
          <button
            data-interactive="true"
            onClick={handleApply}
            disabled={isApplying}
            style={{
              height: `${buttonHeight}px`,
              padding: '0 8px',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'bold',
              color: 'var(--bg)',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: '2px',
              cursor: isApplying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: isApplying ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isApplying) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isApplying ? '0.7' : '1';
            }}
          >
            {isApplying ? (
              <ImSpinner8 size={10} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <FaCheck size={10} />
            )}
            {isApplying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
