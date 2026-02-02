/**
 * Hook to join/leave a collaboration context
 */
import { useEffect } from 'react';
import { usePresenceStore } from '../model/usePresenceStore';
import { usePointingStore } from '@/features/pointing/model/usePointingStore';
import * as collaborationHub from '../api/collaborationHub';

export function useJoinContext(contextType: string, contextId: string | null | undefined) {
  const connectionState = usePresenceStore((state) => state.connectionState);
  const addActiveContext = usePresenceStore((state) => state.addActiveContext);
  const removeActiveContext = usePresenceStore((state) => state.removeActiveContext);
  const clearPointingState = usePointingStore((state) => state.clear);

  useEffect(() => {
    if (connectionState !== 'connected' || !contextId) {
      return;
    }

    // Join context
    collaborationHub
      .joinContext(contextType, contextId)
      .then(() => {
        addActiveContext(contextType, contextId);
      })
      .catch((error) => {
        console.error('[JoinContext] Failed to join context:', error);
      });

    // Leave context on cleanup
    return () => {
      collaborationHub.leaveContext(contextType, contextId).catch((error) => {
        console.error('[JoinContext] Failed to leave context:', error);
      });
      removeActiveContext(contextType, contextId);
      // Clear pointing state when leaving context to avoid stale data on return
      clearPointingState();
    };
  }, [connectionState, contextType, contextId, addActiveContext, removeActiveContext, clearPointingState]);
}
