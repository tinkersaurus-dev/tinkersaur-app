/* eslint-disable no-console */
/**
 * LLM Diagram Generator Renderer
 *
 * Renders a special shape that allows users to generate diagrams using natural language prompts.
 * Contains a textarea for input and a play button to trigger generation.
 */

import { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import type { LLMGeneratorShapeData, DiagramType } from '~/core/entities/design-studio/types';
import { ShapeWrapper } from './ShapeWrapper';
import { generateMermaid, MermaidGeneratorAPIError } from '~/design-studio/lib/llm/mermaid-generator-api';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio/store';
import { useCanvasController } from '~/design-studio/components/canvas/core/CanvasControllerContext';
import { commandManager } from '~/core/commands/CommandManager';
import { ReplaceWithPreviewCommand } from '~/core/commands/canvas/ReplaceWithPreviewCommand';
import { toast } from 'sonner';

export function GenerateDiagramRenderer({
  shape,
  context,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: ShapeRendererProps): React.ReactElement {
  const { width: _width, height: _height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Get diagram info from canvas controller
  const { diagramId, diagram } = useCanvasController();
  const addShape = useDesignStudioEntityStore((state) => state._internalAddShape);
  const addConnector = useDesignStudioEntityStore((state) => state._internalAddConnector);
  const deleteShape = useDesignStudioEntityStore((state) => state._internalDeleteShape);
  const deleteConnector = useDesignStudioEntityStore((state) => state._internalDeleteConnector);
  const getShape = useDesignStudioEntityStore((state) => state._internalGetShape);
  const addShapesBatch = useDesignStudioEntityStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDesignStudioEntityStore((state) => state._internalAddConnectorsBatch);

  const diagramType = diagram?.type as DiagramType | undefined;

  // Parse shape data
  const generatorData = (shape.data || {}) as LLMGeneratorShapeData;
  const [prompt, setPrompt] = useState(generatorData.prompt || '');
  const [isLoading, setIsLoading] = useState(generatorData.isLoading || false);
  const [error, setError] = useState(generatorData.error);
  const [isGenerating, setIsGenerating] = useState(false); // Guard to prevent duplicate calls

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 2;
  const padding = 8;

  // Determine border color
  let borderColor = 'var(--border)';
  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  // Background color
  const backgroundColor = isSelected ? 'var(--bg-light)' : 'var(--bg)';

  const handleGenerate = async () => {
    console.log('[GenerateDiagramRenderer] handleGenerate called');
    console.log('[GenerateDiagramRenderer] isGenerating:', isGenerating);

    // Prevent duplicate calls
    if (isGenerating) {
      console.log('[GenerateDiagramRenderer] Already generating, ignoring duplicate call');
      return;
    }

    console.log('[GenerateDiagramRenderer] prompt:', prompt);
    console.log('[GenerateDiagramRenderer] diagramType:', diagramType);

    if (!prompt.trim()) {
      console.log('[GenerateDiagramRenderer] Error: empty prompt');
      setError('Please enter a prompt');
      return;
    }

    if (!diagramType) {
      console.log('[GenerateDiagramRenderer] Error: no diagram type');
      setError('Could not determine diagram type');
      toast.error('Could not determine diagram type');
      return;
    }

    // Skip dataflow diagrams (not implemented)
    if (diagramType === 'dataflow') {
      console.log('[GenerateDiagramRenderer] Error: dataflow not supported');
      setError('Dataflow diagrams are not supported yet');
      toast.error('Dataflow diagram generation is not available');
      return;
    }

    try {
      console.log('[GenerateDiagramRenderer] Setting loading and generating state...');
      setIsGenerating(true);
      setIsLoading(true);
      setError(undefined);

      console.log('[GenerateDiagramRenderer] Calling generateMermaid API...');
      const mermaidSyntax = await generateMermaid(prompt, diagramType);
      console.log('[GenerateDiagramRenderer] Received mermaid syntax:', mermaidSyntax.substring(0, 100) + '...');

      console.log('[GenerateDiagramRenderer] Creating ReplaceWithPreviewCommand...');
      const command = new ReplaceWithPreviewCommand(
        diagramId,
        diagramType,
        shape.id,
        mermaidSyntax,
        { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
        addShape,
        addConnector,
        deleteShape,
        deleteConnector,
        getShape,
        addShapesBatch,
        addConnectorsBatch
      );

      console.log('[GenerateDiagramRenderer] Executing command...');
      await commandManager.execute(command, diagramId);
      console.log('[GenerateDiagramRenderer] Command executed successfully');
      toast.success('Diagram generated successfully!');
    } catch (err) {
      console.error('[GenerateDiagramRenderer] Error caught:', err);
      const errorMessage = err instanceof MermaidGeneratorAPIError
        ? err.message
        : 'Failed to generate diagram';

      console.log('[GenerateDiagramRenderer] Setting error state:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      setIsGenerating(false);

      // Show toast notification
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
        gap: `${padding}px`,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '10px',
          fontWeight: 'semibold',
          color: 'var(--text)',
          textAlign: 'left',
        }}
      >
        Generate Diagram
      </div>

      {/* Prompt textarea */}
      <textarea
        data-interactive="true"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the diagram you want to generate..."
        disabled={isLoading}
        style={{
          width: '100%',
          flex: 1,
          padding: '6px',
          fontSize: '10px',
          fontFamily: 'inherit',
          color: 'var(--text)',
          backgroundColor: 'var(--bg-light)',
          border: `${1 / zoom}px solid var(--border)`,
          borderRadius: '2px',
          resize: 'none',
          outline: 'none',
          opacity: isLoading ? 0.6 : 1,
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
            fontSize: '8px',
            color: 'var(--error)',
            backgroundColor: 'var(--error-bg)',
            padding: '6px',
            borderRadius: '2px',
            border: `${1 / zoom}px solid var(--error)`,
            textAlign: 'left',
          }}
        >
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        data-interactive="true"
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        style={{
          width: '100%',
          height: '16px',
          padding: '8px',
          fontSize: '10px',
          fontWeight: 'semibold',
          color: isLoading || !prompt.trim() ? 'var(--text-muted)' : 'var(--bg)',
          backgroundColor: isLoading || !prompt.trim() ? 'var(--bg-muted)' : 'var(--primary)',
          border: 'none',
          borderRadius: '2px',
          cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'opacity 0.2s',
          opacity: isLoading || !prompt.trim() ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading && prompt.trim()) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {isLoading ? (
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
          </>
        ) : (
          <>
            <FaPlay size={8} />
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
