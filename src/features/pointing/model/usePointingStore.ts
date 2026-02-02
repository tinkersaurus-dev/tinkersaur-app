/**
 * Zustand store for pointing session state
 */
import { create } from 'zustand';
import type { PointingSession, Vote, VoteResults, PointValue, TimeoutOption } from './types';

interface PointingState {
  // Active sessions by storyId
  activeSessions: Record<string, PointingSession>;

  // Current user's votes by storyId
  myVotes: Record<string, PointValue | null>;

  // Vote results by storyId (available after all votes in)
  results: Record<string, VoteResults>;

  // UI state
  openDrawerStoryId: string | null;
  selectedTimeout: TimeoutOption;

  // Loading states
  startingSession: boolean;
  submittingVote: boolean;

  // Actions
  setSession: (session: PointingSession) => void;
  updateSessionVotes: (storyId: string, votes: Vote[]) => void;
  addVoteToSession: (storyId: string, vote: Vote) => void;
  updateFacilitator: (storyId: string, newFacilitatorId: string) => void;
  removeSession: (storyId: string) => void;
  setMyVote: (storyId: string, points: PointValue | null) => void;
  clearMyVote: (storyId: string) => void;
  setResults: (storyId: string, results: VoteResults) => void;
  clearResults: (storyId: string) => void;

  // UI Actions
  openDrawer: (storyId: string) => void;
  closeDrawer: () => void;
  setSelectedTimeout: (timeout: TimeoutOption) => void;

  // Loading Actions
  setStartingSession: (loading: boolean) => void;
  setSubmittingVote: (loading: boolean) => void;

  // Queries
  getSessionForStory: (storyId: string) => PointingSession | undefined;
  hasActiveSession: (storyId: string) => boolean;
  hasVoted: (storyId: string) => boolean;

  // Clear all
  clear: () => void;
}

export const usePointingStore = create<PointingState>((set, get) => ({
  activeSessions: {},
  myVotes: {},
  results: {},
  openDrawerStoryId: null,
  selectedTimeout: 2,
  startingSession: false,
  submittingVote: false,

  setSession: (session) =>
    set((state) => ({
      activeSessions: {
        ...state.activeSessions,
        [session.storyId]: session,
      },
    })),

  updateSessionVotes: (storyId, votes) =>
    set((state) => {
      const session = state.activeSessions[storyId];
      if (!session) return state;
      return {
        activeSessions: {
          ...state.activeSessions,
          [storyId]: { ...session, votes },
        },
      };
    }),

  addVoteToSession: (storyId, vote) =>
    set((state) => {
      const session = state.activeSessions[storyId];
      if (!session) return state;
      // Replace existing vote from same user or add new
      const existingVotes = session.votes.filter((v) => v.userId !== vote.userId);
      return {
        activeSessions: {
          ...state.activeSessions,
          [storyId]: { ...session, votes: [...existingVotes, vote] },
        },
      };
    }),

  updateFacilitator: (storyId, newFacilitatorId) =>
    set((state) => {
      const session = state.activeSessions[storyId];
      if (!session) return state;
      return {
        activeSessions: {
          ...state.activeSessions,
          [storyId]: { ...session, facilitatorId: newFacilitatorId },
        },
      };
    }),

  removeSession: (storyId) =>
    set((state) => {
      const { [storyId]: _, ...rest } = state.activeSessions;
      const { [storyId]: __, ...restVotes } = state.myVotes;
      const { [storyId]: ___, ...restResults } = state.results;
      return {
        activeSessions: rest,
        myVotes: restVotes,
        results: restResults,
        // Close drawer if it was open for this story
        openDrawerStoryId: state.openDrawerStoryId === storyId ? null : state.openDrawerStoryId,
      };
    }),

  setMyVote: (storyId, points) =>
    set((state) => ({
      myVotes: { ...state.myVotes, [storyId]: points },
    })),

  clearMyVote: (storyId) =>
    set((state) => {
      const { [storyId]: _, ...rest } = state.myVotes;
      return { myVotes: rest };
    }),

  setResults: (storyId, results) =>
    set((state) => ({
      results: { ...state.results, [storyId]: results },
    })),

  clearResults: (storyId) =>
    set((state) => {
      const { [storyId]: _, ...rest } = state.results;
      return { results: rest };
    }),

  openDrawer: (storyId) => set({ openDrawerStoryId: storyId }),

  closeDrawer: () => set({ openDrawerStoryId: null }),

  setSelectedTimeout: (timeout) => set({ selectedTimeout: timeout }),

  setStartingSession: (loading) => set({ startingSession: loading }),

  setSubmittingVote: (loading) => set({ submittingVote: loading }),

  getSessionForStory: (storyId) => get().activeSessions[storyId],

  hasActiveSession: (storyId) => {
    const session = get().activeSessions[storyId];
    return session?.status === 'Voting';
  },

  hasVoted: (storyId) => storyId in get().myVotes,

  clear: () =>
    set({
      activeSessions: {},
      myVotes: {},
      results: {},
      openDrawerStoryId: null,
      startingSession: false,
      submittingVote: false,
    }),
}));
