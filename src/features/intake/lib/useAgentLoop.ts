import { useCallback, useEffect, useRef } from 'react';
import { useIntakeStore } from '../model/useIntakeStore';
import * as agentHub from '../api/agentHub';
import type {
  AgentToolCall,
  AgentSessionStarted,
  AgentSessionComplete,
  AgentError,
  Extraction,
  ExtractionType,
  DocumentType,
} from '../model/types';

export function useAgentLoop() {
  const store = useIntakeStore();
  const contentBufferRef = useRef('');

  const handleSessionStarted = useCallback(
    (session: AgentSessionStarted) => {
      store.startSession(session.sessionId);
    },
    [store]
  );

  const handleToolCall = useCallback(
    (toolCall: AgentToolCall) => {


      switch (toolCall.name) {
        case 'detect_document_type': {
          const args = toolCall.arguments as {
            type: DocumentType;
            suggested: ExtractionType[];
            confidence: number;
          };
          store.setDocumentType(args.type);
          store.setSuggestedExtractions(args.suggested);
          break;
        }

        case 'add_extraction': {
          const args = toolCall.arguments as {
            type: ExtractionType;
            entity: Record<string, unknown>;
          };

          const extractionId = crypto.randomUUID();
          const extraction: Extraction = {
            id: extractionId,
            type: args.type,
            entity: args.entity as unknown as Extraction['entity'],
            status: 'pending',
          };

          store.addExtraction(extraction);

          // Store the first quote for highlighting (position found at render time)
          // Skip highlighting for personas since they appear in the sidebar
          if (args.type !== 'personas') {
            const quotes = (args.entity.quotes as string[]) ?? [];
            if (quotes.length > 0 && quotes[0]) {
              store.addHighlight({
                id: crypto.randomUUID(),
                extractionId,
                quote: quotes[0],
                type: args.type,
              });
            } else {
              console.warn(`[Extraction] No quotes for ${args.type}:`, args.entity);
            }
          }
          break;
        }

        case 'show_suggestions': {
          const args = toolCall.arguments as { types: ExtractionType[] };
          store.setSuggestedExtractions(args.types);
          break;
        }

        default:
          console.warn('Unknown tool call:', toolCall.name);
      }
    },
    [store]
  );

  const handleDelta = useCallback((content: string) => {
    contentBufferRef.current += content;
  }, []);

  const handleComplete = useCallback(
    (_session: AgentSessionComplete) => {
      store.setPhase('complete');
    },
    [store]
  );

  const handleError = useCallback(
    (error: AgentError) => {
      store.setError(error.error);
      store.setPhase('idle');
    },
    [store]
  );

  const handleCancelled = useCallback(
    (_sessionId: string) => {
      store.setPhase('idle');
    },
    [store]
  );

  // Start extraction analysis
  const startExtraction = useCallback(async () => {
    const { documentContent, documentType, selectedExtractions } =
      useIntakeStore.getState();

    if (!documentContent || selectedExtractions.length === 0) {
      return;
    }

    store.setPhase('extracting');
    store.setError(null);
    contentBufferRef.current = '';

    try {
      await agentHub.startAnalysis({
        content: documentContent,
        documentType: documentType ?? undefined,
        extractionTypes: selectedExtractions,
      });
    } catch (error) {
      console.error('Failed to start extraction:', error);
      store.setError(error instanceof Error ? error.message : 'Failed to start extraction');
      store.setPhase('suggesting'); // Go back to suggestions so user can retry
    }
  }, [store]);

  // Detect document type (first step after paste)
  const detectType = useCallback(async (content: string) => {
    store.setDocumentContent(content);
    store.setPhase('detecting');
    store.setError(null);

    try {
      const detection = await agentHub.detectDocumentType(content);
      if (detection) {
        store.setDocumentType(detection.type);
        store.setSuggestedExtractions(detection.suggested);
      } else {
        // No detection result, fall back to all types
        store.setSuggestedExtractions(['personas', 'useCases', 'feedback', 'outcomes']);
      }
      store.setPhase('suggesting');
    } catch (error) {
      console.error('Failed to detect document type:', error);
      // Fall back to manual selection
      store.setSuggestedExtractions(['personas', 'useCases', 'feedback', 'outcomes']);
      store.setPhase('suggesting');
    }
  }, [store]);

  // Set up event handlers - only register, don't manage connection lifecycle
  // Connection is managed by IntakePage
  useEffect(() => {
    agentHub.onSessionStarted(handleSessionStarted);
    agentHub.onToolCall(handleToolCall);
    agentHub.onDelta(handleDelta);
    agentHub.onComplete(handleComplete);
    agentHub.onError(handleError);
    agentHub.onCancelled(handleCancelled);

    return () => {
      agentHub.offSessionStarted(handleSessionStarted);
      agentHub.offToolCall(handleToolCall);
      agentHub.offDelta(handleDelta);
      agentHub.offComplete(handleComplete);
      agentHub.offError(handleError);
      agentHub.offCancelled(handleCancelled);
    };
  }, [
    handleSessionStarted,
    handleToolCall,
    handleDelta,
    handleComplete,
    handleError,
    handleCancelled,
  ]);

  return {
    startExtraction,
    detectType,
  };
}
