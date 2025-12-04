/**
 * Suggestion Comment Renderer
 *
 * Renders AI-generated improvement suggestions as comment shapes.
 * These shapes are transparent with red text and a lightbulb icon.
 * They are linked to their target shapes via curved connectors.
 */

import { LuLightbulb } from 'react-icons/lu';
import type { ShapeRendererProps } from './types';
import { isSuggestionCommentShapeData } from '~/core/entities/design-studio/types/Shape';

export function SuggestionCommentRenderer({
  shape,
  context,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: ShapeRendererProps): React.ReactElement {
  const { width, height } = shape;
  const { isSelected, isHovered } = context;

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

  // Selection/hover indicator
  let outlineStyle = 'none';
  if (showSelected) {
    outlineStyle = `2px solid var(--primary)`;
  } else if (showHover) {
    outlineStyle = `1px dashed var(--border)`;
  }

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
          color: '#dc2626', // Red color (Tailwind red-600)
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
          color: '#dc2626', // Red color (Tailwind red-600)
          fontSize: `${fontSize}px`,
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'inherit',
        }}
      >
        {suggestionText}
      </div>
    </div>
  );
}
