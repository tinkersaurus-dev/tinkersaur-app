/**
 * Collaboration feature exports
 */

// Types
export type { UserPresence, PresenceContext, ConnectionState } from './model/types';
export type { HubError } from './model/hubErrors';
export { HubErrorCode, parseHubError, isHubErrorCode, getHubErrorMessage } from './model/hubErrors';

// Store
export { usePresenceStore } from './model/usePresenceStore';

// Hub API
export * as collaborationHub from './api/collaborationHub';

// Hooks
export { useCollaborationConnection } from './lib/useCollaborationConnection';
export { useCollaborationEvents } from './lib/useCollaborationEvents';
export { useJoinContext } from './lib/useJoinContext';

// Error handling
export { handleHubError, type HubErrorHandlerOptions } from './lib/handleHubError';

// UI Components
export { PresenceIndicator } from './ui/PresenceIndicator';
