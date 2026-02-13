import type { Feedback } from '@/entities/feedback';

// Cluster preview from API
export interface FeedbackClusterPreview {
  suggestedName: string;
  items: Feedback[];
}

export interface GenerateClustersResponse {
  success: boolean;
  clusters: FeedbackClusterPreview[];
  ungroupedCount: number;
  error?: string;
}

// Local state for editing clusters in modal
export interface EditableCluster {
  id: string; // Local temporary ID for drag-drop
  suggestedName: string;
  items: Feedback[];
  selectedParentId: string | null;
}

export interface ApplyClusterRequest {
  parentFeedbackId: string;
  childFeedbackIds: string[];
}

export interface ApplyClustersRequest {
  teamId: string;
  clusters: ApplyClusterRequest[];
}

export interface ApplyClustersResponse {
  totalClustersApplied: number;
  totalItemsMerged: number;
}
