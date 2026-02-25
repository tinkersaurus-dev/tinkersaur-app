/**
 * Hook to join/leave a collaboration context
 */
import { useEffect, useRef } from 'react';
import { usePresenceStore } from '../model/usePresenceStore';
import * as collaborationHub from '../api/collaborationHub';

interface JoinContextOptions {
  onLeave?: () => void;
}

export function useJoinContext(
  contextType: string,
  contextId: string | null | undefined,
  options?: JoinContextOptions
) {
  const connectionState = usePresenceStore((state) => state.connectionState);
  const addActiveContext = usePresenceStore((state) => state.addActiveContext);
  const removeActiveContext = usePresenceStore((state) => state.removeActiveContext);

  // Use a ref so the callback can change without re-triggering the effect
  const onLeaveRef = useRef(options?.onLeave);
  useEffect(() => {
    onLeaveRef.current = options?.onLeave;
  });

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
      onLeaveRef.current?.();
    };
  }, [connectionState, contextType, contextId, addActiveContext, removeActiveContext]);
}
