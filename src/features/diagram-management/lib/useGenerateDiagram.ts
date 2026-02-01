/**
 * useGenerateDiagram Hook
 *
 * Manages the diagram generation workflow including:
 * - Prompt state management
 * - Loading and error states
 * - LLM generation API call
 * - Command execution for preview replacement
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useDiagramStore } from '@/entities/diagram';
import { useCanvasDiagram } from '@/shared/contexts/CanvasDiagramContext';
import { generateMermaid, MermaidGeneratorAPIError } from '@/features/llm-generation';
import { commandManager } from '@/features/canvas-commands/model/CommandManager';
import { ReplaceWithPreviewCommand } from '@/features/canvas-commands/commands/preview-import/ReplaceWithPreviewCommand';
import { applySequenceDiagramPostProcessing } from '@/features/diagram-rendering/sequence/postProcessing';
import { useAuthStore } from '@/features/auth';
import type { LLMGeneratorShapeData, Shape } from '@/entities/shape';
import type { DiagramType, Diagram } from '@/entities/diagram';

export interface UseGenerateDiagramReturn {
  prompt: string;
  isLoading: boolean;
  error: string | undefined;
  isGenerating: boolean;
  handleGenerate: () => Promise<void>;
  handlePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function useGenerateDiagram(
  shape: Shape,
  referencedDiagrams: Diagram[]
): UseGenerateDiagramReturn {
  // Get diagram info from canvas diagram context
  const { diagramId, diagram } = useCanvasDiagram();

  // Get entity store methods for command execution
  const addShape = useDiagramStore((state) => state._internalAddShape);
  const addConnector = useDiagramStore((state) => state._internalAddConnector);
  const deleteShape = useDiagramStore((state) => state._internalDeleteShape);
  const deleteConnector = useDiagramStore((state) => state._internalDeleteConnector);
  const getShape = useDiagramStore((state) => state._internalGetShape);
  const addShapesBatch = useDiagramStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDiagramStore((state) => state._internalAddConnectorsBatch);
  const commandFactory = useDiagramStore((state) => state.commandFactory);
  const _internalUpdateShape = useDiagramStore((state) => state._internalUpdateShape);

  // Get teamId for API calls
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  const diagramType = diagram?.type as DiagramType | undefined;

  // Parse shape data - this will update when shape.data changes
  const generatorData = useMemo(() => (shape.data || {}) as LLMGeneratorShapeData, [shape.data]);

  // Local state
  const [prompt, setPrompt] = useState(generatorData.prompt || '');
  const [isLoading, setIsLoading] = useState(generatorData.isLoading || false);
  const [error, setError] = useState(generatorData.error);
  const [isGenerating, setIsGenerating] = useState(false); // Guard to prevent duplicate calls

  // Memoized handler for prompt textarea
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);

  const handleGenerate = useCallback(async () => {
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

      const mermaidSyntax = await generateMermaid(enhancedPrompt, diagramType, teamId);

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
  }, [
    isGenerating,
    prompt,
    diagramType,
    teamId,
    referencedDiagrams,
    diagramId,
    shape.id,
    shape.x,
    shape.y,
    shape.width,
    shape.height,
    addShape,
    addConnector,
    deleteShape,
    deleteConnector,
    getShape,
    addShapesBatch,
    addConnectorsBatch,
    _internalUpdateShape,
    commandFactory,
  ]);

  return {
    prompt,
    isLoading,
    error,
    isGenerating,
    handleGenerate,
    handlePromptChange,
  };
}
