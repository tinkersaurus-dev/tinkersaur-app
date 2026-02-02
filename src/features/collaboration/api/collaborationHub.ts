/**
 * SignalR connection management for collaboration features
 */
import * as signalR from '@microsoft/signalr';
import { getAuthToken } from '@/shared/api/httpClient';
import type { UserPresence, PresenceContext } from '../model/types';

// Get API base URL (follows pattern from httpClient.ts)
const getHubUrl = (): string => {
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:5062';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5062';
};

// Singleton connection instance
let connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection | null {
  return connection;
}

export function getConnectionState(): signalR.HubConnectionState | null {
  return connection?.state ?? null;
}

// Track pending connection promise to avoid race conditions
let connectionPromise: Promise<signalR.HubConnection> | null = null;

// Reconnection tracking
const MAX_RECONNECT_ATTEMPTS = 10;
let reconnectionExhausted = false;

export function isReconnectionExhausted(): boolean {
  return reconnectionExhausted;
}

function resetReconnectionState(): void {
  reconnectionExhausted = false;
}

export async function connect(): Promise<signalR.HubConnection> {
  // If already connected, return the existing connection
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  // If already connecting, wait for that connection
  if (connectionPromise) {
    return connectionPromise;
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error('No auth token available');
  }

  // Reset reconnection state for new connection
  resetReconnectionState();

  // Create connection but don't start yet
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${getHubUrl()}/hubs/collaboration?access_token=${token}`)
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        const attemptNumber = retryContext.previousRetryCount + 1;

        // Stop after max attempts
        if (attemptNumber > MAX_RECONNECT_ATTEMPTS) {
          reconnectionExhausted = true;
          return null; // Signals SignalR to stop reconnecting
        }

        // Exponential backoff: 0, 2s, 4s, 8s, 16s, then max 30s
        if (retryContext.previousRetryCount < 5) {
          return Math.pow(2, retryContext.previousRetryCount) * 1000;
        }
        return 30000;
      },
    })
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // Start connection and track the promise
  connectionPromise = connection.start().then(() => {
    connectionPromise = null;
    return connection!;
  }).catch((error) => {
    connectionPromise = null;
    connection = null;
    throw error;
  });

  return connectionPromise;
}

export async function disconnect(): Promise<void> {
  // Wait for pending connection to complete before disconnecting
  if (connectionPromise) {
    try {
      await connectionPromise;
    } catch {
      // Ignore connection errors during disconnect
    }
  }

  if (connection) {
    await connection.stop();
    connection = null;
  }
}

// Event subscription helpers - Presence events
export function onUserJoined(callback: (user: UserPresence) => void): void {
  connection?.on('OnUserJoined', callback);
}

export function offUserJoined(callback: (user: UserPresence) => void): void {
  connection?.off('OnUserJoined', callback);
}

export function onUserLeft(callback: (userId: string) => void): void {
  connection?.on('OnUserLeft', callback);
}

export function offUserLeft(callback: (userId: string) => void): void {
  connection?.off('OnUserLeft', callback);
}

export function onPresenceUpdated(callback: (context: PresenceContext) => void): void {
  connection?.on('OnPresenceUpdated', callback);
}

export function offPresenceUpdated(callback: (context: PresenceContext) => void): void {
  connection?.off('OnPresenceUpdated', callback);
}

// Hub method invocations - Presence
export async function joinContext(contextType: string, contextId: string): Promise<void> {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error('Not connected to collaboration hub');
  }
  await connection.invoke('JoinContext', contextType, contextId);
}

export async function leaveContext(contextType: string, contextId: string): Promise<void> {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    return; // Silently ignore if not connected (e.g., during cleanup)
  }
  await connection.invoke('LeaveContext', contextType, contextId);
}

// Connection state event handlers
export function onReconnecting(callback: () => void): void {
  connection?.onreconnecting(callback);
}

export function onReconnected(callback: (connectionId: string | undefined) => void): void {
  connection?.onreconnected(callback);
}

export function onClose(callback: (error?: Error) => void): void {
  connection?.onclose(callback);
}
