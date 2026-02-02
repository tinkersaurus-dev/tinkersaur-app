/**
 * SignalR connection management for collaboration features
 */
import * as signalR from '@microsoft/signalr';
import { getAuthToken } from '@/shared/api/httpClient';
import { authApi } from '@/features/auth/api/authApi';
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

// SignalR token cache (short-lived tokens for WebSocket connections)
let cachedSignalRToken: string | null = null;
let cachedTokenExpiry: Date | null = null;

/**
 * Gets a short-lived SignalR token for WebSocket connections.
 * Tokens are cached and refreshed automatically with a 30-second buffer.
 */
async function getSignalRToken(): Promise<string> {
  // Check if we have a valid cached token (with 30-second buffer)
  if (cachedSignalRToken && cachedTokenExpiry) {
    const bufferMs = 30 * 1000;
    if (cachedTokenExpiry.getTime() - Date.now() > bufferMs) {
      return cachedSignalRToken;
    }
  }

  // Need to ensure we have a valid auth token first
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('No auth token available');
  }

  try {
    const response = await authApi.getSignalRToken();
    cachedSignalRToken = response.signalRToken;
    cachedTokenExpiry = new Date(response.expiresAt);
    return response.signalRToken;
  } catch (error) {
    // Fall back to regular auth token if SignalR token endpoint fails
    console.warn('Failed to get SignalR token, falling back to auth token:', error);
    return authToken;
  }
}

/**
 * Clears the cached SignalR token. Should be called on logout.
 */
export function clearSignalRTokenCache(): void {
  cachedSignalRToken = null;
  cachedTokenExpiry = null;
}

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

  // Verify we have a valid auth token before attempting connection
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('No auth token available');
  }

  // Reset reconnection state for new connection
  resetReconnectionState();

  // Create connection with accessTokenFactory for dynamic token refresh
  // This allows SignalR to fetch fresh short-lived tokens on initial connection
  // and during automatic reconnection attempts
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${getHubUrl()}/hubs/collaboration`, {
      accessTokenFactory: getSignalRToken,
    })
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
  // Clear token cache on disconnect
  clearSignalRTokenCache();

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
