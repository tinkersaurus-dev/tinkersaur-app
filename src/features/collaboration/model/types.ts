/**
 * Collaboration types - mirrors backend DTOs from CollaborationHub
 */

export interface UserPresence {
  userId: string;
  name: string;
  email: string;
  joinedAt: Date;
}

export interface PresenceContext {
  contextType: string;
  contextId: string;
  users: UserPresence[];
}

export type { ConnectionState } from '@/shared/signalr';
