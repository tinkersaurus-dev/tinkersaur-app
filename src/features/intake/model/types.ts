// Agent Session Types
export interface AgentSession {
  id: string;
  startedAt: Date;
}

export type AnalysisPhase =
  | 'idle'
  | 'detecting'
  | 'suggesting'
  | 'extracting'
  | 'complete';

// Document Types
export type DocumentType =
  | 'meeting-transcript'
  | 'user-interview'
  | 'stakeholder-interview'
  | 'support-ticket'
  | 'survey-response'
  | 'requirements-document'
  | 'product-brief';

// Extraction Types
export type ExtractionType = 'personas' | 'useCases' | 'feedback' | 'outcomes' | 'requirements';

export type ExtractionStatus = 'pending' | 'accepted' | 'rejected';

export interface Extraction {
  id: string;
  type: ExtractionType;
  entity: PersonaEntity | UseCaseEntity | FeedbackEntity | OutcomeEntity | RequirementEntity;
  status: ExtractionStatus;
}

export interface DocumentHighlight {
  id: string;
  extractionId: string;
  quote: string;
  type?: ExtractionType;
}

// Entity Types
export interface PersonaEntity {
  name: string;
  role: string;
  description: string;
  goals?: string[];
  painPoints?: string[];
  quotes?: string[];
}

export interface UseCaseEntity {
  name: string;
  description: string;
  quotes?: string[];
}

export interface FeedbackEntity {
  type: 'suggestion' | 'problem' | 'concern' | 'praise' | 'question';
  content: string;
  quotes?: string[];
}

export interface OutcomeEntity {
  description: string;
  target: string;
  quotes?: string[];
}

export interface RequirementEntity {
  text: string;
  type: 'functional' | 'non-functional' | 'constraint';
  quotes?: string[];
}

// Agent Tool Call Types
export interface AgentToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface DocumentTypeDetection {
  type: DocumentType;
  confidence: number;
  suggested: ExtractionType[];
}

// Hub Event Types
export interface AgentSessionStarted {
  sessionId: string;
  startedAt: string;
}

export interface AgentSessionComplete {
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AgentError {
  sessionId: string;
  error: string;
}

// Inline Similarity Match (for feedback, useCases, outcomes)
export interface InlineSimilarityMatch {
  extractionId: string;
  entityId: string;
  entityType: ExtractionType;
  similarity: number;
  result: unknown; // SimilarFeedbackResult | SimilarUseCaseResult | SimilarOutcomeResult
}

// Pending merge types for inline entities
export interface FeedbackPendingMerge {
  extractionId: string;
  parentFeedbackId: string;
}

export interface OutcomePendingMerge {
  extractionId: string;
  parentOutcomeId: string;
}

export interface UseCasePendingMerge {
  extractionId: string;
  targetUseCaseId: string;
  sourceUseCaseIds: string[];
  mergedUseCase: { name: string; description: string };
  quotes?: string[];
}

// Persona Merge Types
export interface PersonaPendingMerge {
  extractionId: string;
  targetPersonaId: string;
  mergedPersona: {
    name: string;
    description: string;
    role: string;
    goals: string[];
    painPoints: string[];
  };
  quotes?: string[];
}

// Request Types
export interface AnalyzeDocumentRequest {
  content: string;
  documentType?: DocumentType;
  extractionTypes?: ExtractionType[];
}
