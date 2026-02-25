/**
 * LLM Diagram Generator Renderer
 *
 * Renders a special shape that allows users to generate diagrams using natural language prompts.
 * Contains a textarea for input and a play button to trigger generation.
 */

import { memo } from 'react';
import { FaPlay } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import { ShapeWrapper } from './ShapeWrapper';
import { useGeneratorReferences, useGenerateDiagram } from '@/features/diagram-management';
import { applySequenceDiagramPostProcessing } from '@/features/diagram-rendering/sequence/postProcessing';
import { ReferencedDiagramsList } from './components/ReferencedDiagramsList';
import { styles, spinKeyframes } from './GenerateDiagramRenderer.styles';

const PADDING = 8;
const BORDER_RADIUS = 2;

export const GenerateDiagramRenderer = memo(function GenerateDiagramRenderer({
  shape,
  context,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: ShapeRendererProps): React.ReactElement {
  const { isSelected, isHovered, zoom } = context;

  // Preview logic: manage referenced diagrams
  const { referencedDiagrams, handleDrop, handleRemoveReference, handleDragOver } =
    useGeneratorReferences(shape);

  // Update logic: manage generation workflow
  const { prompt, isLoading, error, handleGenerate, handlePromptChange } =
    useGenerateDiagram(shape, referencedDiagrams, applySequenceDiagramPostProcessing);

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  let borderColor = 'var(--border)';

  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  const backgroundColor = isSelected ? 'var(--bg-light)' : 'var(--bg)';
  const isButtonDisabled = isLoading || !prompt.trim();

  return (
    <ShapeWrapper
      shape={shape}
      isSelected={isSelected}
      isHovered={isHovered}
      zoom={zoom}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      borderRadius={BORDER_RADIUS}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={styles.container(PADDING)}
    >
      {/* Header */}
      <div style={styles.header()}>
        Generate Diagram
      </div>

      {/* Prompt textarea */}
      <textarea
        data-interactive="true"
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Describe the diagram you want to generate..."
        disabled={isLoading}
        style={styles.promptTextarea(zoom, isLoading)}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      />

      {/* Referenced Diagrams List */}
      <ReferencedDiagramsList
        diagrams={referencedDiagrams}
        onRemove={handleRemoveReference}
        zoom={zoom}
      />

      {/* Error display */}
      {error && (
        <div style={styles.errorDisplay(zoom)}>
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        data-interactive="true"
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        style={styles.generateButton(isButtonDisabled)}
        onMouseEnter={(e) => {
          if (!isButtonDisabled) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {isLoading ? (
          <div style={styles.spinner()} />
        ) : (
          <FaPlay size={8} />
        )}
      </button>

      {/* Spinning animation for loading indicator */}
      <style>{spinKeyframes}</style>
    </ShapeWrapper>
  );
});
