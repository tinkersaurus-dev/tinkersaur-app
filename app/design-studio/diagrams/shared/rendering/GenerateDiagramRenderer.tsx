/**
 * LLM Diagram Generator Renderer
 *
 * Renders a special shape that allows users to generate diagrams using natural language prompts.
 * Contains a textarea for input and a play button to trigger generation.
 */

import { useState, useEffect, useMemo } from 'react';
import { FaPlay } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import type { ShapeRendererProps } from './types';
import type { LLMGeneratorShapeData, DiagramType } from '~/core/entities/design-studio/types';
import { ShapeWrapper } from './ShapeWrapper';
import { generateMermaid, MermaidGeneratorAPIError } from '~/design-studio/lib/llm/mermaid-generator-api';
import { useDiagramStore } from '~/core/entities/design-studio';
import { useCanvasDiagram } from '~/design-studio/components/canvas/core/CanvasDiagramContext';
import { useCanvasInstance } from '~/design-studio/store/content/useCanvasInstance';
import { commandManager } from '~/core/commands/CommandManager';
import { ReplaceWithPreviewCommand } from '~/core/commands/canvas/preview-import/ReplaceWithPreviewCommand';
import { toast } from 'sonner';
import { applySequenceDiagramPostProcessing } from '~/design-studio/diagrams/sequence/postProcessing';

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

  // Get canvas instance store for local state updates
  const canvasInstance = useCanvasInstance(diagramId, diagram?.type);
  const updateLocalShape = canvasInstance((state) => state.updateLocalShape);

  // Get entity store methods for persistence
  const addShape = useDiagramStore((state) => state._internalAddShape);
  const addConnector = useDiagramStore((state) => state._internalAddConnector);
  const deleteShape = useDiagramStore((state) => state._internalDeleteShape);
  const deleteConnector = useDiagramStore((state) => state._internalDeleteConnector);
  const getShape = useDiagramStore((state) => state._internalGetShape);
  const addShapesBatch = useDiagramStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDiagramStore((state) => state._internalAddConnectorsBatch);
  const commandFactory = useDiagramStore((state) => state.commandFactory);
  const _internalUpdateShape = useDiagramStore((state) => state._internalUpdateShape);
  const diagrams = useDiagramStore((state) => state.diagrams);
  const fetchDiagram = useDiagramStore((state) => state.fetchDiagram);

  const diagramType = diagram?.type as DiagramType | undefined;

  // Parse shape data - this will update when shape.data changes
  const generatorData = (shape.data || {}) as LLMGeneratorShapeData;
  const [prompt, setPrompt] = useState(generatorData.prompt || '');
  const [isLoading, setIsLoading] = useState(generatorData.isLoading || false);
  const [error, setError] = useState(generatorData.error);
  const [isGenerating, setIsGenerating] = useState(false); // Guard to prevent duplicate calls

  // Referenced diagrams - read directly from shape data (reactive)
  const referencedDiagramIds = useMemo(
    () => generatorData.referencedDiagramIds || [],
    [generatorData.referencedDiagramIds]
  );
  const referencedDiagrams = referencedDiagramIds
    .map((id) => diagrams[id])
    .filter((d) => d !== undefined);

  // Fetch referenced diagrams that aren't loaded yet
  useEffect(() => {
    referencedDiagramIds.forEach((id) => {
      if (!diagrams[id]) {
        fetchDiagram(id);
      }
    });
  }, [referencedDiagramIds, diagrams, fetchDiagram]);

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

  // Handle drag over to allow drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drop of diagram from sidebar
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const dragDataStr = e.dataTransfer.getData('application/json');

      if (!dragDataStr) return;

      const dragData = JSON.parse(dragDataStr);

      // Only handle diagram drops (not reference drops)
      if (dragData.type !== 'diagram') {
        return;
      }

      const { diagramId: droppedDiagramId } = dragData;

      // Don't add if already referenced
      if (referencedDiagramIds.includes(droppedDiagramId)) {
        toast.info('This diagram is already referenced');
        return;
      }

      // Add to referenced diagrams
      const updatedReferencedDiagramIds = [...referencedDiagramIds, droppedDiagramId];

      const updatedData = {
        ...generatorData,
        referencedDiagramIds: updatedReferencedDiagramIds,
      };

      // Update BOTH stores: local canvas state (for immediate UI update) and entity store (for persistence)
      updateLocalShape(shape.id, {
        data: updatedData,
      });

      await _internalUpdateShape(diagramId, shape.id, {
        data: updatedData,
      });

      toast.success('Diagram reference added');
    } catch (err) {
      console.error('Failed to handle diagram drop:', err);
      toast.error('Failed to add diagram reference');
    }
  };

  // Handle removing a reference
  const handleRemoveReference = async (diagramIdToRemove: string) => {
    const updatedReferencedDiagramIds = referencedDiagramIds.filter(
      (id) => id !== diagramIdToRemove
    );

    const updatedData = {
      ...generatorData,
      referencedDiagramIds: updatedReferencedDiagramIds,
    };

    // Update BOTH stores: local canvas state (for immediate UI update) and entity store (for persistence)
    updateLocalShape(shape.id, {
      data: updatedData,
    });

    await _internalUpdateShape(diagramId, shape.id, {
      data: updatedData,
    });

    toast.success('Diagram reference removed');
  };

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

    // Skip architecture diagrams (not implemented)
    if (diagramType === 'architecture') {

      setError('Architecture diagrams are not supported yet');
      toast.error('Architecture diagram generation is not available');
      return;
    }

    try {

      setIsGenerating(true);
      setIsLoading(true);
      setError(undefined);

      // Build enhanced prompt with referenced diagrams
      let enhancedPrompt = prompt;

      if (referencedDiagrams.length > 0) {
        enhancedPrompt += '\n\n---\n\n';
        enhancedPrompt += 'REFERENCE DIAGRAMS:\n';
        enhancedPrompt += 'The following diagrams are provided as context. Use them where necessary and relevant to ensure consistency with the existing product/service design.\n\n';

        referencedDiagrams.forEach((refDiagram, index) => {
          enhancedPrompt += `Reference ${index + 1}:\n`;
          enhancedPrompt += `Type: ${refDiagram.type}\n`;
          enhancedPrompt += `Name: ${refDiagram.name}\n`;
          enhancedPrompt += `Mermaid:\n\`\`\`\n${refDiagram.mermaidSyntax || '(No mermaid syntax available)'}\n\`\`\`\n\n`;
        });
      }

      const mermaidSyntax = await generateMermaid(enhancedPrompt, diagramType);


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
        addConnectorsBatch,
        _internalUpdateShape
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
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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

      {/* Referenced Diagrams List */}
      {referencedDiagrams.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '8px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontWeight: 'semibold', color: 'var(--text)' }}>
            Referenced Diagrams:
          </div>
          {referencedDiagrams.map((refDiagram) => (
            <div
              key={refDiagram.id}
              data-interactive="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '4px',
                padding: '4px 6px',
                backgroundColor: 'var(--bg-light)',
                border: `${1 / zoom}px solid var(--border)`,
                borderRadius: '2px',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                [{refDiagram.type}] {refDiagram.name}
              </span>
              <button
                data-interactive="true"
                onClick={() => handleRemoveReference(refDiagram.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '14px',
                  height: '14px',
                  padding: 0,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  borderRadius: '2px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--error-bg)';
                  e.currentTarget.style.color = 'var(--error)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <MdClose size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

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
