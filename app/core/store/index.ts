/**
 * Core Zustand stores for application-wide state management
 */

import { create } from 'zustand';
import type { User, Organization } from '../types';

/**
 * App Store
 * Manages global application state (user, organization, etc.)
 */
interface AppStore {
  user: User | null;
  organization: Organization | null;

  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  organization: null,

  setUser: (user) => set({ user }),
  setOrganization: (organization) => set({ organization }),
}));
