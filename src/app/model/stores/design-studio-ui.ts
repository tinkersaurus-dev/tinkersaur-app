/**
 * Design Studio UI Store
 * Manages UI-only state for design studio: tabs, folder expansion, selections
 * Entity data is now managed in core/entities/design-studio
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { canvasInstanceRegistry } from './canvas/canvasInstanceRegistry';
import { commandManager } from '@/features/canvas-commands/model/CommandManager';

/**
 * Folder UI state model
 * Represents the UI state for folders in the tree view.
 * Note: Folders are now just a UI representation of DesignWork entities.
 * The actual data is stored in DesignWork with nesting via parentDesignWorkId.
 */
export interface FolderUIState {
  designWorkId: string;
  isExpanded: boolean;
  isSelected: boolean;
}

// Union type for design content types
export type DesignContentType = 'diagram' | 'interface' | 'document';

export interface DesignTab {
  id: string;
  type: 'overview' | DesignContentType | 'folder-view';
  contentId?: string; // undefined for overview tab
  title: string;
  closable: boolean;
}

interface DesignStudioUIStore {
  // UI State
  folderUIStates: Map<string, FolderUIState>; // UI state for folders (expanded, selected)

  // Tab management
  activeTabs: DesignTab[];
  activeTabId: string;

  // Folder UI state actions
  setFolderExpanded: (designWorkId: string, expanded: boolean) => void;
  setFolderSelected: (designWorkId: string, selected: boolean) => void;
  getFolderUIState: (designWorkId: string) => FolderUIState;

  // Tab actions
  openTab: (tab: Omit<DesignTab, 'id'>) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  initializeTabs: (solutionId: string) => void;
}

export const useDesignStudioUIStore = create<DesignStudioUIStore>((set, get) => ({
  // Initial state
  folderUIStates: new Map(),

  activeTabs: [],
  activeTabId: '',

  // Folder UI state actions
  setFolderExpanded: (designWorkId, expanded) => {
    set((state) => {
      const newStates = new Map(state.folderUIStates);
      const currentState = newStates.get(designWorkId) || {
        designWorkId,
        isExpanded: false,
        isSelected: false,
      };
      newStates.set(designWorkId, { ...currentState, isExpanded: expanded });
      return { folderUIStates: newStates };
    });
  },

  setFolderSelected: (designWorkId, selected) => {
    set((state) => {
      const newStates = new Map(state.folderUIStates);
      const currentState = newStates.get(designWorkId) || {
        designWorkId,
        isExpanded: false,
        isSelected: false,
      };
      newStates.set(designWorkId, { ...currentState, isSelected: selected });
      return { folderUIStates: newStates };
    });
  },

  getFolderUIState: (designWorkId) => {
    const state = get().folderUIStates.get(designWorkId);
    return (
      state || {
        designWorkId,
        isExpanded: false,
        isSelected: false,
      }
    );
  },

  // Tab actions
  openTab: (tabData) => {
    const { activeTabs } = get();

    // Check if tab already exists
    const existingTab = activeTabs.find((tab) => tab.type === tabData.type && tab.contentId === tabData.contentId);

    if (existingTab) {
      // Tab already open, just activate it
      set({ activeTabId: existingTab.id });
    } else {
      // Create new tab
      const newTab: DesignTab = {
        id: uuidv4(),
        ...tabData,
      };
      set({
        activeTabs: [...activeTabs, newTab],
        activeTabId: newTab.id,
      });
    }
  },

  closeTab: (tabId) => {
    const { activeTabs, activeTabId } = get();
    const tabIndex = activeTabs.findIndex((tab) => tab.id === tabId);

    if (tabIndex === -1) return;

    const closedTab = activeTabs[tabIndex];

    // Clean up canvas instance store when closing a diagram tab
    if (closedTab.type === 'diagram' && closedTab.contentId) {
      canvasInstanceRegistry.releaseStore(closedTab.contentId);
      commandManager.clearScope(closedTab.contentId);
    }

    const newTabs = activeTabs.filter((tab) => tab.id !== tabId);

    // If closing active tab, switch to another tab
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      // Switch to previous tab, or next tab, or overview tab
      if (tabIndex > 0) {
        newActiveTabId = newTabs[tabIndex - 1].id;
      } else if (newTabs.length > 0) {
        newActiveTabId = newTabs[0].id;
      }
    }

    set({
      activeTabs: newTabs,
      activeTabId: newActiveTabId,
    });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  initializeTabs: (_solutionId) => {
    // Create overview tab
    const overviewTab: DesignTab = {
      id: 'overview',
      type: 'overview',
      title: 'Overview',
      closable: false,
    };

    set({
      activeTabs: [overviewTab],
      activeTabId: 'overview',
    });
  },
}));
