/**
 * Pointing types - mirrors backend DTOs from CollaborationHub
 */

// Standard Fibonacci sequence for story points
export const POINT_VALUES = [1, 2, 3, 5, 8, 13, 21] as const;
export type PointValue = (typeof POINT_VALUES)[number];

// Timeout options in minutes
export const TIMEOUT_OPTIONS = [1, 2, 5] as const;
export type TimeoutOption = (typeof TIMEOUT_OPTIONS)[number];

export type PointingSessionStatus = 'Voting' | 'Reviewing' | 'Completed' | 'Cancelled';

export interface Vote {
  userId: string;
  userName: string;
  points: number | null; // null = passed/declined to vote
  votedAt: Date;
}

export interface PointingSession {
  sessionId: string;
  storyId: string;
  storyTitle: string;
  initiatorId: string;
  facilitatorId: string;
  startedAt: Date;
  timeoutSeconds: number;
  status: PointingSessionStatus;
  votes: Vote[];
}

export interface FacilitationTransferred {
  sessionId: string;
  storyId: string;
  newFacilitatorId: string;
}

export interface VoteResults {
  votes: Vote[];
  isUnanimous: boolean;
  unanimousValue: number | null;
  voteCounts: Record<number, number>; // points -> count
  majorityValue: number | null;
}
