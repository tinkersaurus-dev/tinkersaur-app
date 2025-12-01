import { create } from 'zustand';
import { personaUseCaseApi } from '../../api';
import type { PersonaUseCase } from '../../types';
import { toast } from 'sonner';

/**
 * State shape for PersonaUseCase store
 */
interface PersonaUseCaseStoreState {
  personaUseCases: PersonaUseCase[];
  loading: boolean;
  error: Error | null;
}

/**
 * Actions for PersonaUseCase store
 */
interface PersonaUseCaseStoreActions {
  fetchByPersona: (personaId: string) => Promise<void>;
  fetchByUseCase: (useCaseId: string) => Promise<void>;
  linkPersonaToUseCase: (personaId: string, useCaseId: string) => Promise<PersonaUseCase | null>;
  unlinkPersonaFromUseCase: (personaId: string, useCaseId: string) => Promise<boolean>;
  deleteByPersonaId: (personaId: string) => Promise<void>;
  deleteByUseCaseId: (useCaseId: string) => Promise<void>;
  getUseCaseIdsForPersona: (personaId: string) => string[];
  getPersonaIdsForUseCase: (useCaseId: string) => string[];
  reset: () => void;
}

type PersonaUseCaseStore = PersonaUseCaseStoreState & PersonaUseCaseStoreActions;

const initialState: PersonaUseCaseStoreState = {
  personaUseCases: [],
  loading: false,
  error: null,
};

/**
 * Zustand store for managing PersonaUseCase junction entities
 *
 * Handles the many-to-many relationship between Personas and UseCases.
 */
export const usePersonaUseCaseStore = create<PersonaUseCaseStore>((set, get) => ({
  ...initialState,

  /**
   * Fetch all links for a specific persona
   */
  fetchByPersona: async (personaId: string) => {
    set({ loading: true, error: null });
    try {
      const links = await personaUseCaseApi.listByPersona(personaId);
      // Merge with existing links, avoiding duplicates
      const existingLinks = get().personaUseCases;
      const existingIds = new Set(existingLinks.map(l => l.id));
      const newLinks = links.filter(l => !existingIds.has(l.id));
      set({
        personaUseCases: [...existingLinks, ...newLinks],
        loading: false,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch persona-usecase links');
      set({ error: err, loading: false });
    }
  },

  /**
   * Fetch all links for a specific use case
   */
  fetchByUseCase: async (useCaseId: string) => {
    set({ loading: true, error: null });
    try {
      const links = await personaUseCaseApi.listByUseCase(useCaseId);
      // Merge with existing links, avoiding duplicates
      const existingLinks = get().personaUseCases;
      const existingIds = new Set(existingLinks.map(l => l.id));
      const newLinks = links.filter(l => !existingIds.has(l.id));
      set({
        personaUseCases: [...existingLinks, ...newLinks],
        loading: false,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch persona-usecase links');
      set({ error: err, loading: false });
    }
  },

  /**
   * Create a link between a persona and use case
   */
  linkPersonaToUseCase: async (personaId: string, useCaseId: string) => {
    set({ loading: true, error: null });
    try {
      const link = await personaUseCaseApi.create({ personaId, useCaseId });
      set({
        personaUseCases: [...get().personaUseCases, link],
        loading: false,
      });
      toast.success('Persona linked to use case');
      return link;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to link persona to use case');
      set({ error: err, loading: false });
      toast.error(err.message);
      return null;
    }
  },

  /**
   * Remove a link between a persona and use case
   */
  unlinkPersonaFromUseCase: async (personaId: string, useCaseId: string) => {
    const links = get().personaUseCases;
    const linkToRemove = links.find(
      l => l.personaId === personaId && l.useCaseId === useCaseId
    );

    if (!linkToRemove) {
      toast.error('Link not found');
      return false;
    }

    set({ loading: true, error: null });
    try {
      const success = await personaUseCaseApi.delete(linkToRemove.id);
      if (success) {
        set({
          personaUseCases: links.filter(l => l.id !== linkToRemove.id),
          loading: false,
        });
        toast.success('Persona unlinked from use case');
      } else {
        set({ loading: false });
        toast.error('Failed to unlink persona from use case');
      }
      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to unlink persona from use case');
      set({ error: err, loading: false });
      toast.error('Failed to unlink persona from use case');
      return false;
    }
  },

  /**
   * Delete all links for a persona (used in cascade delete)
   */
  deleteByPersonaId: async (personaId: string) => {
    try {
      await personaUseCaseApi.deleteByPersonaId(personaId);
      set({
        personaUseCases: get().personaUseCases.filter(l => l.personaId !== personaId),
      });
    } catch (error) {
      console.error('Failed to delete persona-usecase links by persona ID:', error);
    }
  },

  /**
   * Delete all links for a use case (used in cascade delete)
   */
  deleteByUseCaseId: async (useCaseId: string) => {
    try {
      await personaUseCaseApi.deleteByUseCaseId(useCaseId);
      set({
        personaUseCases: get().personaUseCases.filter(l => l.useCaseId !== useCaseId),
      });
    } catch (error) {
      console.error('Failed to delete persona-usecase links by use case ID:', error);
    }
  },

  /**
   * Get all use case IDs linked to a persona (from local state)
   */
  getUseCaseIdsForPersona: (personaId: string) => {
    return get().personaUseCases
      .filter(l => l.personaId === personaId)
      .map(l => l.useCaseId);
  },

  /**
   * Get all persona IDs linked to a use case (from local state)
   */
  getPersonaIdsForUseCase: (useCaseId: string) => {
    return get().personaUseCases
      .filter(l => l.useCaseId === useCaseId)
      .map(l => l.personaId);
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));
