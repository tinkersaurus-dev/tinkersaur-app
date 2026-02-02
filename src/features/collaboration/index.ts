/**
 * Collaboration feature exports
 */

// Types
export type { UserPresence, PresenceContext, ConnectionState } from './model/types';

// Store
export { usePresenceStore } from './model/usePresenceStore';

// Hub API
export * as collaborationHub from './api/collaborationHub';

// Hooks
export { useCollaborationConnection } from './lib/useCollaborationConnection';
export { useCollaborationEvents } from './lib/useCollaborationEvents';
export { useJoinContext } from './lib/useJoinContext';

// UI Components
export { PresenceIndicator } from './ui/PresenceIndicator';
