/**
 * Collaboration hub - presence event helpers and hub methods.
 * Connection management lives in @/shared/signalr.
 */
import * as signalR from '@microsoft/signalr';
import { getConnection } from '@/shared/signalr';
import type { UserPresence, PresenceContext } from '../model/types';

function ensureConnection(): signalR.HubConnection {
  const connection = getConnection();
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error('Not connected to collaboration hub');
  }
  return connection;
}

// Event subscription helpers - Presence events
export function onUserJoined(callback: (user: UserPresence) => void): void {
  getConnection()?.on('OnUserJoined', callback);
}

export function offUserJoined(callback: (user: UserPresence) => void): void {
  getConnection()?.off('OnUserJoined', callback);
}

export function onUserLeft(callback: (userId: string) => void): void {
  getConnection()?.on('OnUserLeft', callback);
}

export function offUserLeft(callback: (userId: string) => void): void {
  getConnection()?.off('OnUserLeft', callback);
}

export function onPresenceUpdated(callback: (context: PresenceContext) => void): void {
  getConnection()?.on('OnPresenceUpdated', callback);
}

export function offPresenceUpdated(callback: (context: PresenceContext) => void): void {
  getConnection()?.off('OnPresenceUpdated', callback);
}

// Hub method invocations - Presence
export async function joinContext(contextType: string, contextId: string): Promise<void> {
  const connection = ensureConnection();
  await connection.invoke('JoinContext', contextType, contextId);
}

export async function leaveContext(contextType: string, contextId: string): Promise<void> {
  const connection = getConnection();
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    return; // Silently ignore if not connected (e.g., during cleanup)
  }
  await connection.invoke('LeaveContext', contextType, contextId);
}
