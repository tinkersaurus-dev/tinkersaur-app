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
  const startSession = useIntakeStore((s) => s.startSession);
  const setPhase = useIntakeStore((s) => s.setPhase);
  const setDocumentType = useIntakeStore((s) => s.setDocumentType);
  const setSuggestedExtractions = useIntakeStore((s) => s.setSuggestedExtractions);
  const addExtraction = useIntakeStore((s) => s.addExtraction);
  const addHighlight = useIntakeStore((s) => s.addHighlight);
  const setError = useIntakeStore((s) => s.setError);
  const setDocumentContent = useIntakeStore((s) => s.setDocumentContent);
  const contentBufferRef = useRef('');

  const handleSessionStarted = useCallback(
    (session: AgentSessionStarted) => {
      startSession(session.sessionId);
    },
    [startSession]
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
          setDocumentType(args.type);
          setSuggestedExtractions(args.suggested);
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

          addExtraction(extraction);

          // Store the first quote for highlighting (position found at render time)
          // Skip highlighting for personas since they appear in the sidebar
          if (args.type !== 'personas') {
            const quotes = (args.entity.quotes as string[]) ?? [];
            if (quotes.length > 0 && quotes[0]) {
              addHighlight({
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
          setSuggestedExtractions(args.types);
          break;
        }

        default:
          console.warn('Unknown tool call:', toolCall.name);
      }
    },
    [setDocumentType, setSuggestedExtractions, addExtraction, addHighlight]
  );

  const handleDelta = useCallback((content: string) => {
    contentBufferRef.current += content;
  }, []);

  const handleComplete = useCallback(
    (_session: AgentSessionComplete) => {
      setPhase('complete');
    },
    [setPhase]
  );

  const handleError = useCallback(
    (error: AgentError) => {
      setError(error.error);
      setPhase('idle');
    },
    [setError, setPhase]
  );

  const handleCancelled = useCallback(
    (_sessionId: string) => {
      setPhase('idle');
    },
    [setPhase]
  );

  // Start extraction analysis
  const startExtraction = useCallback(async () => {
    const { documentContent, documentType, selectedExtractions } =
      useIntakeStore.getState();

    if (!documentContent || selectedExtractions.length === 0) {
      return;
    }

    setPhase('extracting');
    setError(null);
    contentBufferRef.current = '';

    try {
      await agentHub.startAnalysis({
        content: documentContent,
        documentType: documentType ?? undefined,
        extractionTypes: selectedExtractions,
      });
    } catch (error) {
      console.error('Failed to start extraction:', error);
      setError(error instanceof Error ? error.message : 'Failed to start extraction');
      setPhase('suggesting'); // Go back to suggestions so user can retry
    }
  }, [setPhase, setError]);

  // Detect document type (first step after paste)
  const detectType = useCallback(async (content: string) => {
    setDocumentContent(content);
    setPhase('detecting');
    setError(null);

    try {
      const detection = await agentHub.detectDocumentType(content);
      if (detection) {
        setDocumentType(detection.type);
        setSuggestedExtractions(detection.suggested);
      } else {
        // No detection result, fall back to all types
        setSuggestedExtractions(['personas', 'userGoals', 'feedback', 'outcomes']);
      }
      setPhase('suggesting');
    } catch (error) {
      console.error('Failed to detect document type:', error);
      // Fall back to manual selection
      setSuggestedExtractions(['personas', 'userGoals', 'feedback', 'outcomes']);
      setPhase('suggesting');
    }
  }, [setDocumentContent, setPhase, setError, setDocumentType, setSuggestedExtractions]);

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
