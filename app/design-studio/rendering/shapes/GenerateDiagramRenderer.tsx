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
import { useDiagramStore } from '~/core/entities/design-studio';
import { useCanvasDiagram } from '~/design-studio/components/canvas/core/CanvasDiagramContext';
import { commandManager } from '~/core/commands/CommandManager';
import { ReplaceWithPreviewCommand } from '~/core/commands/canvas/preview-import/ReplaceWithPreviewCommand';
import { toast } from 'sonner';
import { applySequenceDiagramPostProcessing } from '~/design-studio/utils/sequenceDiagramPostProcessing';

export function GenerateDiagramRenderer({
  shape,
  context,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: ShapeRendererProps): React.ReactElement {
  const { width: _width, height: _height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Get diagram info from canvas diagram context
  const { diagramId, diagram } = useCanvasDiagram();
  const addShape = useDiagramStore((state) => state._internalAddShape);
  const addConnector = useDiagramStore((state) => state._internalAddConnector);
  const deleteShape = useDiagramStore((state) => state._internalDeleteShape);
  const deleteConnector = useDiagramStore((state) => state._internalDeleteConnector);
  const getShape = useDiagramStore((state) => state._internalGetShape);
  const addShapesBatch = useDiagramStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDiagramStore((state) => state._internalAddConnectorsBatch);
  const commandFactory = useDiagramStore((state) => state.commandFactory);

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

    // Prevent duplicate calls
    if (isGenerating) {
      return;
    }



    if (!prompt.trim()) {

      setError('Please enter a prompt');
      return;
    }

    if (!diagramType) {
  
      setError('Could not determine diagram type');
      toast.error('Could not determine diagram type');
      return;
    }

    // Skip dataflow diagrams (not implemented)
    if (diagramType === 'dataflow') {

      setError('Dataflow diagrams are not supported yet');
      toast.error('Dataflow diagram generation is not available');
      return;
    }

    try {
  
      setIsGenerating(true);
      setIsLoading(true);
      setError(undefined);


      const mermaidSyntax = await generateMermaid(prompt, diagramType);


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


      await commandManager.execute(command, diagramId);


      // Apply sequence diagram post-processing (lifeline heights and activation boxes)
      await applySequenceDiagramPostProcessing(diagramId, commandFactory);

      toast.success('Diagram generated successfully!');
    } catch (err) {

      const errorMessage = err instanceof MermaidGeneratorAPIError
        ? err.message
        : 'Failed to generate diagram';


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
          minHeight: '100px',
          //flex: 1,
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
