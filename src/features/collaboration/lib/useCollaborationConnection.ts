/**
 * Hook to manage SignalR collaboration connection lifecycle
 * Handles React StrictMode double-mounting gracefully
 */
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth';
import { toast } from '@/shared/lib/utils/toast';
import { usePresenceStore } from '../model/usePresenceStore';
import * as collaborationHub from '../api/collaborationHub';
import { isReconnectionExhausted } from '../api/collaborationHub';

export function useCollaborationConnection() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setConnectionState = usePresenceStore((state) => state.setConnectionState);
  const setConnectionError = usePresenceStore((state) => state.setConnectionError);
  const setPermanentlyDisconnected = usePresenceStore((state) => state.setPermanentlyDisconnected);
  const clear = usePresenceStore((state) => state.clear);

  // Use refs to track connection state across StrictMode remounts
  const connectingRef = useRef(false);
  const connectedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated) {
      // Clear state when not authenticated
      clear();
      return;
    }

    // Already connecting or connected, don't start again
    if (connectingRef.current || connectedRef.current) {
      return;
    }

    const setupConnection = async () => {
      connectingRef.current = true;
      setConnectionState('connecting');
      setPermanentlyDisconnected(false);

      try {
        const connection = await collaborationHub.connect();

        // Check if still mounted after async operation
        if (!mountedRef.current) {
          // Don't disconnect here - let the next mount use the connection
          connectingRef.current = false;
          return;
        }

        connectedRef.current = true;
        connectingRef.current = false;
        setConnectionState('connected', connection.connectionId ?? null);

        // Set up reconnection handlers
        collaborationHub.onReconnecting(() => {
          if (mountedRef.current) {
            setConnectionState('reconnecting');
          }
        });

        collaborationHub.onReconnected((connectionId) => {
          if (mountedRef.current) {
            setConnectionState('connected', connectionId ?? null);
          }
        });

        collaborationHub.onClose((error) => {
          connectedRef.current = false;
          if (mountedRef.current) {
            setConnectionState('disconnected');

            // Check if this was due to exhausted reconnection attempts
            if (isReconnectionExhausted()) {
              setPermanentlyDisconnected(true);
              toast.error('Connection lost. Please refresh the page to reconnect.');
            } else if (error) {
              setConnectionError(error.message);
            }
          }
        });
      } catch (error) {
        connectingRef.current = false;
        if (mountedRef.current) {
          setConnectionState('disconnected');
          setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        }
      }
    };

    setupConnection();

    return () => {
      mountedRef.current = false;
      // Don't disconnect on unmount - the connection is shared
      // It will be cleaned up when the user logs out or the page unloads
    };
  }, [isAuthenticated, setConnectionState, setConnectionError, setPermanentlyDisconnected, clear]);

  // Clean up connection when user logs out
  useEffect(() => {
    if (!isAuthenticated && connectedRef.current) {
      connectedRef.current = false;
      connectingRef.current = false;
      collaborationHub.disconnect();
    }
  }, [isAuthenticated]);
}
