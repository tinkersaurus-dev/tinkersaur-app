import { create } from 'zustand';
import type { User } from '~/core/entities/product-management';
import { authApi } from './authApi';

const AUTH_STORAGE_KEY = 'tinkersaur_currentUser';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,

  login: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const user = await authApi.login(email);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      set({ currentUser: user, isAuthenticated: true, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    set({ currentUser: null, isAuthenticated: false, error: null });
  },

  initialize: () => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        // Restore Date objects
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
        set({ currentUser: user, isAuthenticated: true, initialized: true });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        set({ initialized: true });
      }
    } else {
      set({ initialized: true });
    }
  },
}));
