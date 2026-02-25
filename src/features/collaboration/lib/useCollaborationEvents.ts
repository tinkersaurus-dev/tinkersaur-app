/**
 * Hook to register collaboration presence event handlers.
 * Registers handlers once when connected, not on every context change.
 */
import { useEffect, useRef } from 'react';
import { usePresenceStore } from '../model/usePresenceStore';
import * as collaborationHub from '../api/collaborationHub';
import type { UserPresence, PresenceContext } from '../model/types';

export function useCollaborationEvents() {
  const connectionState = usePresenceStore((state) => state.connectionState);

  // Use refs for store actions to avoid re-registering handlers when they change
  const presenceStoreRef = useRef(usePresenceStore.getState());

  // Keep refs updated - intentionally runs on every render to keep refs in sync
  useEffect(() => {
    presenceStoreRef.current = usePresenceStore.getState();
  });

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

    // Register event handlers
    collaborationHub.onUserJoined(handleUserJoined);
    collaborationHub.onUserLeft(handleUserLeft);
    collaborationHub.onPresenceUpdated(handlePresenceUpdated);

    // Cleanup
    return () => {
      collaborationHub.offUserJoined(handleUserJoined);
      collaborationHub.offUserLeft(handleUserLeft);
      collaborationHub.offPresenceUpdated(handlePresenceUpdated);
    };
  }, [connectionState]); // Only re-register when connection state changes
}
