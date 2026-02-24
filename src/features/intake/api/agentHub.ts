/**
 * SignalR connection management for agent features
 */
import * as signalR from '@microsoft/signalr';
import { getAuthToken } from '@/shared/api/httpClient';
import { authApi } from '@/features/auth/api/authApi';
import type {
  AgentToolCall,
  AgentSessionStarted,
  AgentSessionComplete,
  AgentError,
  AnalyzeDocumentRequest,
  DocumentTypeDetection,
} from '../model/types';

// Get API base URL
const getHubUrl = (): string => {
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:5062';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5062';
};

// Singleton connection instance
let connection: signalR.HubConnection | null = null;

// SignalR token cache
let cachedSignalRToken: string | null = null;
let cachedTokenExpiry: Date | null = null;

async function getSignalRToken(): Promise<string> {
  if (cachedSignalRToken && cachedTokenExpiry) {
    const bufferMs = 30 * 1000;
    if (cachedTokenExpiry.getTime() - Date.now() > bufferMs) {
      return cachedSignalRToken;
    }
  }

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
    console.warn('Failed to get SignalR token, falling back to auth token:', error);
    return authToken;
  }
}

export function getConnection(): signalR.HubConnection | null {
  return connection;
}

export function getConnectionState(): signalR.HubConnectionState | null {
  return connection?.state ?? null;
}

let connectionPromise: Promise<signalR.HubConnection> | null = null;

export async function connect(): Promise<signalR.HubConnection> {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('No auth token available');
  }

  // If we have an old disconnected connection, clear it
  if (connection && connection.state !== signalR.HubConnectionState.Connected) {
    connection = null;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${getHubUrl()}/hubs/agent`, {
      accessTokenFactory: getSignalRToken,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        const attemptNumber = retryContext.previousRetryCount + 1;
        if (attemptNumber > 10) {
          return null;
        }
        if (retryContext.previousRetryCount < 5) {
          return Math.pow(2, retryContext.previousRetryCount) * 1000;
        }
        return 30000;
      },
    })
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // Register handlers on reconnect
  connection.onreconnected(() => {
    console.warn('Agent hub reconnected, re-registering handlers');
    if (connection) {
      registerAllHandlers(connection);
    }
  });

  connectionPromise = connection
    .start()
    .then(() => {
      connectionPromise = null;
      // Register all stored handlers on the new connection
      if (connection) {
        registerAllHandlers(connection);
      }
      return connection!;
    })
    .catch((error) => {
      connectionPromise = null;
      connection = null;
      throw error;
    });

  return connectionPromise;
}

export async function disconnect(): Promise<void> {
  cachedSignalRToken = null;
  cachedTokenExpiry = null;

  // Snapshot references to avoid racing with concurrent connect().
  // disconnect() is async but called without await from React cleanup,
  // so a new connect() can run while we're awaiting stop().
  const connToStop = connection;
  const promiseToAwait = connectionPromise;

  // Clear module refs synchronously so any new connect() starts fresh
  connection = null;
  connectionPromise = null;

  if (promiseToAwait) {
    try {
      await promiseToAwait;
    } catch {
      // Ignore connection errors during disconnect
    }
  }

  if (connToStop) {
    await connToStop.stop();
  }

  // Only clear handler Sets if no new connection was created during our async work.
  // If connect() ran while we were awaiting, handlers have been re-added and must not be cleared.
  if (connection === null) {
    Object.values(handlers).forEach((set) => set.clear());
  }
}

// Hub method invocations
export async function startAnalysis(request: AnalyzeDocumentRequest): Promise<void> {
  const conn = await connect();
  await conn.invoke('StartAnalysis', request);
}

export async function detectDocumentType(
  content: string
): Promise<DocumentTypeDetection | null> {
  const conn = await connect();
  return await conn.invoke('DetectDocumentType', content);
}

// Event handlers storage for re-registration after reconnect
type EventHandlers = {
  sessionStarted: Set<(session: AgentSessionStarted) => void>;
  toolCall: Set<(toolCall: AgentToolCall) => void>;
  delta: Set<(content: string) => void>;
  complete: Set<(session: AgentSessionComplete) => void>;
  error: Set<(error: AgentError) => void>;
  cancelled: Set<(sessionId: string) => void>;
};

const handlers: EventHandlers = {
  sessionStarted: new Set(),
  toolCall: new Set(),
  delta: new Set(),
  complete: new Set(),
  error: new Set(),
  cancelled: new Set(),
};

// Register all stored handlers on a connection
function registerAllHandlers(conn: signalR.HubConnection): void {
  handlers.sessionStarted.forEach((cb) => conn.on('OnSessionStarted', cb));
  handlers.toolCall.forEach((cb) => conn.on('OnToolCall', cb));
  handlers.delta.forEach((cb) => conn.on('OnDelta', cb));
  handlers.complete.forEach((cb) => conn.on('OnComplete', cb));
  handlers.error.forEach((cb) => conn.on('OnError', cb));
  handlers.cancelled.forEach((cb) => conn.on('OnCancelled', cb));
}

// Event subscription helpers - store handlers and register on current connection
export function onSessionStarted(
  callback: (session: AgentSessionStarted) => void
): void {
  handlers.sessionStarted.add(callback);
  connection?.on('OnSessionStarted', callback);
}

export function offSessionStarted(
  callback: (session: AgentSessionStarted) => void
): void {
  handlers.sessionStarted.delete(callback);
  connection?.off('OnSessionStarted', callback);
}

export function onToolCall(callback: (toolCall: AgentToolCall) => void): void {
  handlers.toolCall.add(callback);
  connection?.on('OnToolCall', callback);
}

export function offToolCall(callback: (toolCall: AgentToolCall) => void): void {
  handlers.toolCall.delete(callback);
  connection?.off('OnToolCall', callback);
}

export function onDelta(callback: (content: string) => void): void {
  handlers.delta.add(callback);
  connection?.on('OnDelta', callback);
}

export function offDelta(callback: (content: string) => void): void {
  handlers.delta.delete(callback);
  connection?.off('OnDelta', callback);
}

export function onComplete(callback: (session: AgentSessionComplete) => void): void {
  handlers.complete.add(callback);
  connection?.on('OnComplete', callback);
}

export function offComplete(callback: (session: AgentSessionComplete) => void): void {
  handlers.complete.delete(callback);
  connection?.off('OnComplete', callback);
}

export function onError(callback: (error: AgentError) => void): void {
  handlers.error.add(callback);
  connection?.on('OnError', callback);
}

export function offError(callback: (error: AgentError) => void): void {
  handlers.error.delete(callback);
  connection?.off('OnError', callback);
}

export function onCancelled(callback: (sessionId: string) => void): void {
  handlers.cancelled.add(callback);
  connection?.on('OnCancelled', callback);
}

export function offCancelled(callback: (sessionId: string) => void): void {
  handlers.cancelled.delete(callback);
  connection?.off('OnCancelled', callback);
}

// Connection state event handlers
export function onReconnecting(callback: () => void): void {
  connection?.onreconnecting(callback);
}

export function onReconnected(
  callback: (connectionId: string | undefined) => void
): void {
  connection?.onreconnected(callback);
}

export function onClose(callback: (error?: Error) => void): void {
  connection?.onclose(callback);
}
