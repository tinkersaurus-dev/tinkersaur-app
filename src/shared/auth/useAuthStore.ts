import { create } from 'zustand';
import { authApi } from './authApi';
import {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
  setTokenExpiry,
} from '@/shared/api';
import type { TeamAccess, SelectedTeam } from './types';
import { runLogoutHandlers, runTeamChangeHandlers } from './authLifecycle';

const TEAM_ACCESS_KEY = 'tinkersaur_team_access';
const SELECTED_TEAM_KEY = 'tinkersaur_selected_team';
const USER_INFO_KEY = 'tinkersaur_user_info';

interface UserInfo {
  userId: string;
  email: string;
  name: string;
  primaryTeamId: string;
}

interface AuthState {
  userInfo: UserInfo | null;
  teamAccess: TeamAccess[];
  selectedTeam: SelectedTeam | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  selectTeam: (teamId: string) => void;
  clearMustChangePassword: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userInfo: null,
  teamAccess: [],
  selectedTeam: null,
  isAuthenticated: false,
  mustChangePassword: false,
  initialized: false,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const loginResponse = await authApi.login(email, password);

      // Store the JWT tokens for subsequent API calls
      setAuthToken(loginResponse.accessToken);
      setRefreshToken(loginResponse.refreshToken);
      setTokenExpiry(loginResponse.accessTokenExpiry);

      const userInfo: UserInfo = {
        userId: loginResponse.userId,
        email: loginResponse.email,
        name: loginResponse.name,
        primaryTeamId: loginResponse.primaryTeamId,
      };

      // Find primary team for default selection
      const primaryTeam = loginResponse.teamAccess.find(t => t.isPrimary);
      const selectedTeam: SelectedTeam | null = primaryTeam
        ? {
            teamId: primaryTeam.teamId,
            teamName: primaryTeam.teamName,
            canEdit: primaryTeam.role === 'Edit',
          }
        : null;

      // Persist to localStorage
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      localStorage.setItem(TEAM_ACCESS_KEY, JSON.stringify(loginResponse.teamAccess));
      if (selectedTeam) {
        localStorage.setItem(SELECTED_TEAM_KEY, JSON.stringify(selectedTeam));
      }

      set({
        userInfo,
        teamAccess: loginResponse.teamAccess,
        selectedTeam,
        isAuthenticated: true,
        mustChangePassword: loginResponse.mustChangePassword,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    // Run registered logout handlers (e.g., disconnect SignalR, clear solution)
    await runLogoutHandlers();
    await authApi.logout();
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(TEAM_ACCESS_KEY);
    localStorage.removeItem(SELECTED_TEAM_KEY);
    set({
      userInfo: null,
      teamAccess: [],
      selectedTeam: null,
      isAuthenticated: false,
      error: null,
    });
  },

  initialize: async () => {
    // Try to restore from localStorage
    const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
    const storedTeamAccess = localStorage.getItem(TEAM_ACCESS_KEY);
    const storedSelectedTeam = localStorage.getItem(SELECTED_TEAM_KEY);
    const hasToken = getAuthToken() !== null;
    const hasRefreshToken = getRefreshToken() !== null;

    if (storedUserInfo && storedTeamAccess && (hasToken || hasRefreshToken)) {
      try {
        const userInfo = JSON.parse(storedUserInfo) as UserInfo;
        const teamAccess = JSON.parse(storedTeamAccess) as TeamAccess[];
        const selectedTeam = storedSelectedTeam
          ? (JSON.parse(storedSelectedTeam) as SelectedTeam)
          : null;

        set({
          userInfo,
          teamAccess,
          selectedTeam,
          isAuthenticated: true,
          initialized: true,
        });
        return;
      } catch {
        // Clear invalid data
        clearAuthToken();
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem(TEAM_ACCESS_KEY);
        localStorage.removeItem(SELECTED_TEAM_KEY);
      }
    } else if (!hasToken && !hasRefreshToken) {
      // No tokens means not authenticated - clear any stale data
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(TEAM_ACCESS_KEY);
      localStorage.removeItem(SELECTED_TEAM_KEY);
    }

    set({ initialized: true });
  },

  selectTeam: (teamId: string) => {
    const { teamAccess } = get();
    const team = teamAccess.find(t => t.teamId === teamId);
    if (!team) return;

    const selectedTeam: SelectedTeam = {
      teamId: team.teamId,
      teamName: team.teamName,
      canEdit: team.role === 'Edit',
    };

    // Run registered team change handlers (e.g., clear solution selection)
    runTeamChangeHandlers();

    localStorage.setItem(SELECTED_TEAM_KEY, JSON.stringify(selectedTeam));
    set({ selectedTeam });
  },

  clearMustChangePassword: () => {
    set({ mustChangePassword: false });
  },
}));
