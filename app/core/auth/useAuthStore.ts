import { create } from 'zustand';
import { authApi } from './authApi';
import { setAuthToken, clearAuthToken, getAuthToken } from '~/core/api/httpClient';
import type { TeamAccess, SelectedTeam } from './types';
import { useSolutionStore } from '~/core/solution';

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
  initialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  selectTeam: (teamId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userInfo: null,
  teamAccess: [],
  selectedTeam: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,

  login: async (email: string) => {
    set({ loading: true, error: null });
    try {
      // Login via email lookup
      const loginResponse = await authApi.login(email);

      // Store the JWT token for subsequent API calls
      setAuthToken(loginResponse.accessToken);

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
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: () => {
    authApi.logout();
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(TEAM_ACCESS_KEY);
    localStorage.removeItem(SELECTED_TEAM_KEY);
    // Clear solution selection on logout
    useSolutionStore.getState().clearSolution();
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

    if (storedUserInfo && storedTeamAccess && hasToken) {
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
    } else if (!hasToken) {
      // No token means not authenticated - clear any stale data
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

    // Clear solution selection when switching teams (solution may not belong to new team)
    useSolutionStore.getState().clearSolution();

    localStorage.setItem(SELECTED_TEAM_KEY, JSON.stringify(selectedTeam));
    set({ selectedTeam });
  },
}));
