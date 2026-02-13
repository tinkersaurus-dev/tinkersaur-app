import { create } from 'zustand';
import type {
  UseCaseVersion,
  UseCaseVersionDetail,
  CreateUseCaseVersionDto,
  UpdateUseCaseVersionDto,
  VersionComparison,
} from '../model/types';
import { useCaseVersionApi } from '../api/useCaseVersionApi';

interface UseCaseVersionStore {
  // State
  versions: Record<string, UseCaseVersion[]>; // Indexed by useCaseId
  versionDetails: Record<string, UseCaseVersionDetail>; // Indexed by versionId
  loading: boolean;
  error: Error | null;

  // Actions
  fetchVersions: (useCaseId: string) => Promise<UseCaseVersion[]>;
  fetchVersionDetail: (useCaseId: string, versionId: string) => Promise<UseCaseVersionDetail>;
  createVersion: (useCaseId: string, data: CreateUseCaseVersionDto) => Promise<UseCaseVersion>;
  updateVersion: (useCaseId: string, versionId: string, data: UpdateUseCaseVersionDto) => Promise<UseCaseVersion>;
  deleteVersion: (useCaseId: string, versionId: string) => Promise<void>;
  transitionStatus: (useCaseId: string, versionId: string, targetStatus: string) => Promise<UseCaseVersion>;
  revertToVersion: (useCaseId: string, versionId: string) => Promise<void>;
  compareVersions: (useCaseId: string, v1: string, v2: string) => Promise<VersionComparison>;
  clearVersions: (useCaseId: string) => void;
  clearError: () => void;
}

export const useUseCaseVersionStore = create<UseCaseVersionStore>((set) => ({
  // Initial state
  versions: {},
  versionDetails: {},
  loading: false,
  error: null,

  fetchVersions: async (useCaseId: string) => {
    set({ loading: true, error: null });
    try {
      const versions = await useCaseVersionApi.list(useCaseId);
      set((state) => ({
        versions: { ...state.versions, [useCaseId]: versions },
        loading: false,
      }));
      return versions;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch versions');
      set({ error: err, loading: false });
      throw error;
    }
  },

  fetchVersionDetail: async (useCaseId: string, versionId: string) => {
    set({ loading: true, error: null });
    try {
      const detail = await useCaseVersionApi.getWithSnapshot(useCaseId, versionId);
      set((state) => ({
        versionDetails: { ...state.versionDetails, [versionId]: detail },
        loading: false,
      }));
      return detail;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch version detail');
      set({ error: err, loading: false });
      throw error;
    }
  },

  createVersion: async (useCaseId: string, data: CreateUseCaseVersionDto) => {
    set({ loading: true, error: null });
    try {
      const version = await useCaseVersionApi.create(useCaseId, data);
      set((state) => {
        const currentVersions = state.versions[useCaseId] || [];
        return {
          versions: { ...state.versions, [useCaseId]: [version, ...currentVersions] },
          loading: false,
        };
      });
      return version;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create version');
      set({ error: err, loading: false });
      throw error;
    }
  },

  updateVersion: async (useCaseId: string, versionId: string, data: UpdateUseCaseVersionDto) => {
    set({ loading: true, error: null });
    try {
      const updated = await useCaseVersionApi.update(useCaseId, versionId, data);
      set((state) => {
        const currentVersions = state.versions[useCaseId] || [];
        return {
          versions: {
            ...state.versions,
            [useCaseId]: currentVersions.map((v) => (v.id === versionId ? updated : v)),
          },
          loading: false,
        };
      });
      return updated;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update version');
      set({ error: err, loading: false });
      throw error;
    }
  },

  deleteVersion: async (useCaseId: string, versionId: string) => {
    set({ loading: true, error: null });
    try {
      await useCaseVersionApi.delete(useCaseId, versionId);
      set((state) => {
        const currentVersions = state.versions[useCaseId] || [];
        const newVersionDetails = { ...state.versionDetails };
        delete newVersionDetails[versionId];
        return {
          versions: {
            ...state.versions,
            [useCaseId]: currentVersions.filter((v) => v.id !== versionId),
          },
          versionDetails: newVersionDetails,
          loading: false,
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete version');
      set({ error: err, loading: false });
      throw error;
    }
  },

  transitionStatus: async (useCaseId: string, versionId: string, targetStatus: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await useCaseVersionApi.transitionStatus(useCaseId, versionId, targetStatus);
      set((state) => {
        const currentVersions = state.versions[useCaseId] || [];
        return {
          versions: {
            ...state.versions,
            [useCaseId]: currentVersions.map((v) => (v.id === versionId ? updated : v)),
          },
          loading: false,
        };
      });
      return updated;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to transition status');
      set({ error: err, loading: false });
      throw error;
    }
  },

  revertToVersion: async (useCaseId: string, versionId: string) => {
    set({ loading: true, error: null });
    try {
      await useCaseVersionApi.revert(useCaseId, versionId);
      set({ loading: false });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to revert to version');
      set({ error: err, loading: false });
      throw error;
    }
  },

  compareVersions: async (useCaseId: string, v1: string, v2: string) => {
    set({ loading: true, error: null });
    try {
      const comparison = await useCaseVersionApi.compare(useCaseId, v1, v2);
      set({ loading: false });
      return comparison;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to compare versions');
      set({ error: err, loading: false });
      throw error;
    }
  },

  clearVersions: (useCaseId: string) => {
    set((state) => {
      const newVersions = { ...state.versions };
      delete newVersions[useCaseId];
      return { versions: newVersions };
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
