/**
 * Zustand store for presence and connection state
 */
import { create } from 'zustand';
import type { UserPresence, PresenceContext, ConnectionState } from './types';

interface PresenceState {
  // Connection state
  connectionState: ConnectionState;
  connectionId: string | null;
  connectionError: string | null;
  permanentlyDisconnected: boolean;

  // Presence data by context key ("contextType:contextId")
  presenceByContext: Record<string, PresenceContext>;

  // Current user's active contexts
  activeContexts: Set<string>;

  // Actions
  setConnectionState: (state: ConnectionState, connectionId?: string | null) => void;
  setConnectionError: (error: string | null) => void;
  setPermanentlyDisconnected: (value: boolean) => void;
  updatePresenceContext: (context: PresenceContext) => void;
  addUserToContext: (contextKey: string, user: UserPresence) => void;
  removeUserFromContext: (contextKey: string, userId: string) => void;
  addActiveContext: (contextType: string, contextId: string) => void;
  removeActiveContext: (contextType: string, contextId: string) => void;
  getUsersInContext: (contextType: string, contextId: string) => UserPresence[];
  clear: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  connectionState: 'disconnected',
  connectionId: null,
  connectionError: null,
  permanentlyDisconnected: false,
  presenceByContext: {},
  activeContexts: new Set(),

  setConnectionState: (state, connectionId = null) =>
    set({ connectionState: state, connectionId, connectionError: null }),

  setConnectionError: (error) => set({ connectionError: error }),

  setPermanentlyDisconnected: (value) => set({ permanentlyDisconnected: value }),

  updatePresenceContext: (context) =>
    set((state) => ({
      presenceByContext: {
        ...state.presenceByContext,
        [`${context.contextType}:${context.contextId}`]: context,
      },
    })),

  addUserToContext: (contextKey, user) =>
    set((state) => {
      const existing = state.presenceByContext[contextKey];
      if (!existing) {
        // Create new context with just this user
        const [contextType, contextId] = contextKey.split(':');
        return {
          presenceByContext: {
            ...state.presenceByContext,
            [contextKey]: {
              contextType,
              contextId,
              users: [user],
            },
          },
        };
      }
      // Add user to existing context (replace if already exists)
      return {
        presenceByContext: {
          ...state.presenceByContext,
          [contextKey]: {
            ...existing,
            users: [...existing.users.filter((u) => u.userId !== user.userId), user],
          },
        },
      };
    }),

  removeUserFromContext: (contextKey, userId) =>
    set((state) => {
      const existing = state.presenceByContext[contextKey];
      if (!existing) return state;
      return {
        presenceByContext: {
          ...state.presenceByContext,
          [contextKey]: {
            ...existing,
            users: existing.users.filter((u) => u.userId !== userId),
          },
        },
      };
    }),

  addActiveContext: (contextType, contextId) =>
    set((state) => {
      const newSet = new Set(state.activeContexts);
      newSet.add(`${contextType}:${contextId}`);
      return { activeContexts: newSet };
    }),

  removeActiveContext: (contextType, contextId) =>
    set((state) => {
      const newSet = new Set(state.activeContexts);
      newSet.delete(`${contextType}:${contextId}`);
      return { activeContexts: newSet };
    }),

  getUsersInContext: (contextType, contextId) => {
    const contextKey = `${contextType}:${contextId}`;
    return get().presenceByContext[contextKey]?.users ?? [];
  },

  clear: () =>
    set({
      presenceByContext: {},
      activeContexts: new Set(),
      connectionError: null,
      permanentlyDisconnected: false,
    }),
}));
