/**
 * Hook to register collaboration event handlers
 * Registers handlers once when connected, not on every context change
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePresenceStore } from '../model/usePresenceStore';
import { usePointingStore } from '@/features/pointing/model/usePointingStore';
import * as collaborationHub from '../api/collaborationHub';
import * as pointingHub from '@/features/pointing/api/pointingHub';
import { queryKeys } from '@/shared/lib/query';
import type { UserPresence, PresenceContext } from '../model/types';
import type { PointingSession, Vote, VoteResults, FacilitationTransferred } from '@/features/pointing/model/types';
import { toast } from '@/shared/lib/utils';

export function useCollaborationEvents() {
  const connectionState = usePresenceStore((state) => state.connectionState);
  const queryClient = useQueryClient();

  // Use refs for store actions to avoid re-registering handlers when they change
  const presenceStoreRef = useRef(usePresenceStore.getState());
  const pointingStoreRef = useRef(usePointingStore.getState());
  const queryClientRef = useRef(queryClient);
  const fetchingResultsRef = useRef<Set<string>>(new Set());

  // Keep refs updated - intentionally runs on every render to keep refs in sync
  useEffect(() => {
    presenceStoreRef.current = usePresenceStore.getState();
    pointingStoreRef.current = usePointingStore.getState();
    queryClientRef.current = queryClient;
  });

  // Cleanup fetchingResultsRef on unmount to prevent memory leaks
  useEffect(() => {
    const fetchingResults = fetchingResultsRef.current;
    return () => {
      fetchingResults.clear();
    };
  }, []);

  useEffect(() => {
    if (connectionState !== 'connected') return;


    // Presence event handlers
    const handleUserJoined = (user: UserPresence) => {
      // Add user to all active contexts
      const { activeContexts, addUserToContext } = presenceStoreRef.current;
      activeContexts.forEach((contextKey) => {
        addUserToContext(contextKey, user);
      });
    };

    const handleUserLeft = (userId: string) => {
      const { activeContexts, removeUserFromContext } = presenceStoreRef.current;
      activeContexts.forEach((contextKey) => {
        removeUserFromContext(contextKey, userId);
      });
    };

    const handlePresenceUpdated = (context: PresenceContext) => {
      presenceStoreRef.current.updatePresenceContext(context);
    };

    // Pointing event handlers
    const handlePointingSessionStarted = (session: PointingSession) => {
      pointingStoreRef.current.setSession(session);
    };

    const handleVoteReceived = (storyId: string, vote: Vote) => {
      pointingStoreRef.current.addVoteToSession(storyId, vote);
    };

    const handleAllVotesIn = async (storyId: string) => {
      // Prevent concurrent fetches for the same story
      if (fetchingResultsRef.current.has(storyId)) {
        return;
      }

      fetchingResultsRef.current.add(storyId);
      try {
        const results = await pointingHub.getVoteResults(storyId);
        if (results) {
          pointingStoreRef.current.setResults(storyId, results);
        }
      } catch (error) {
        const err = error as Error;
        console.error('Failed to fetch vote results:', error);
        toast.error(err.message || 'Failed to load vote results');
      } finally {
        fetchingResultsRef.current.delete(storyId);
      }
    };

    const handleRevoteStarted = (storyId: string) => {
      pointingStoreRef.current.clearMyVote(storyId);
      pointingStoreRef.current.clearResults(storyId);
    };

    const handlePointingSessionCompleted = (storyId: string, _finalPoints: number) => {
      pointingStoreRef.current.removeSession(storyId);
      // Invalidate planning queries to refresh story points for all users
      queryClientRef.current.invalidateQueries({ queryKey: queryKeys.planning.all });
    };

    const handlePointingSessionCancelled = (storyId: string) => {
      pointingStoreRef.current.removeSession(storyId);
      // Invalidate planning queries in case any state needs refreshing
      queryClientRef.current.invalidateQueries({ queryKey: queryKeys.planning.all });
    };

    const handleSessionTimedOut = (storyId: string, results: VoteResults) => {
      pointingStoreRef.current.setResults(storyId, results);
    };

    const handleFacilitationTransferred = (data: FacilitationTransferred) => {
      pointingStoreRef.current.updateFacilitator(data.storyId, data.newFacilitatorId);
      toast.info('You are now facilitating this pointing session');
    };

    // Register event handlers
    collaborationHub.onUserJoined(handleUserJoined);
    collaborationHub.onUserLeft(handleUserLeft);
    collaborationHub.onPresenceUpdated(handlePresenceUpdated);

    pointingHub.onPointingSessionStarted(handlePointingSessionStarted);
    pointingHub.onVoteReceived(handleVoteReceived);
    pointingHub.onAllVotesIn(handleAllVotesIn);
    pointingHub.onRevoteStarted(handleRevoteStarted);
    pointingHub.onPointingSessionCompleted(handlePointingSessionCompleted);
    pointingHub.onPointingSessionCancelled(handlePointingSessionCancelled);
    pointingHub.onSessionTimedOut(handleSessionTimedOut);
    pointingHub.onFacilitationTransferred(handleFacilitationTransferred);

    // Cleanup
    return () => {
      collaborationHub.offUserJoined(handleUserJoined);
      collaborationHub.offUserLeft(handleUserLeft);
      collaborationHub.offPresenceUpdated(handlePresenceUpdated);

      pointingHub.offPointingSessionStarted(handlePointingSessionStarted);
      pointingHub.offVoteReceived(handleVoteReceived);
      pointingHub.offAllVotesIn(handleAllVotesIn);
      pointingHub.offRevoteStarted(handleRevoteStarted);
      pointingHub.offPointingSessionCompleted(handlePointingSessionCompleted);
      pointingHub.offPointingSessionCancelled(handlePointingSessionCancelled);
      pointingHub.offSessionTimedOut(handleSessionTimedOut);
      pointingHub.offFacilitationTransferred(handleFacilitationTransferred);
    };
  }, [connectionState]); // Only re-register when connection state changes
}
