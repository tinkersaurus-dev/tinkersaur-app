/**
 * Hook to register pointing event handlers.
 * Registers handlers when the collaboration connection is established.
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ConnectionState } from '@/shared/signalr';
import { usePointingStore } from '../model/usePointingStore';
import * as pointingHub from '../api/pointingHub';
import { queryKeys } from '@/shared/lib/query';
import type { PointingSession, Vote, VoteResults, FacilitationTransferred } from '../model/types';
import { toast } from '@/shared/lib/utils';

export function usePointingEvents(connectionState: ConnectionState) {
  const queryClient = useQueryClient();

  // Use refs for store actions to avoid re-registering handlers when they change
  const pointingStoreRef = useRef(usePointingStore.getState());
  const queryClientRef = useRef(queryClient);
  const fetchingResultsRef = useRef<Set<string>>(new Set());

  // Keep refs updated - intentionally runs on every render to keep refs in sync
  useEffect(() => {
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
