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
