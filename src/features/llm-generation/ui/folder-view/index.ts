// Main folder view component
export { FolderEditor, type FolderEditorProps } from './FolderEditor';

// Panels
export { ListPanel, type ListPanelProps, type ListPanelModalProps } from './panels/ListPanel';
export { UserStoriesPanel, type UserStoriesPanelProps } from './panels/UserStoriesPanel';
export { UserDocsPanel, type UserDocsPanelProps } from './panels/UserDocsPanel';
export { TechSpecPanel, type TechSpecPanelProps } from './panels/TechSpecPanel';

// Cards
export { UserStoryCard, type UserStoryCardProps } from './cards/UserStoryCard';
export { TechSpecCard, type TechSpecCardProps } from './cards/TechSpecCard';
export { UserDocCard, type UserDocCardProps } from './cards/UserDocCard';

// Sidebars
export { UserDocSidebar, type UserDocSidebarProps } from './sidebars/UserDocSidebar';
export { TechSpecSidebar, type TechSpecSidebarProps } from './sidebars/TechSpecSidebar';

// Modals
export {
  OperationModal,
  ArrayFieldEditor,
  ArrayFieldCardEditor,
  type OperationConfig,
  type OperationModalConfig,
  type OperationModalProps,
} from './modals/OperationModal';
export { StoryOperationModal, type StoryOperationModalProps, type OperationType } from './modals/StoryOperationModal';
export { DocOperationModal, type DocOperationModalProps, type DocOperationType } from './modals/DocOperationModal';
export { TechSpecOperationModal, type TechSpecOperationModalProps, type TechSpecOperationType } from './modals/TechSpecOperationModal';

// Hooks
export {
  useListPanel,
  type UseListPanelOptions,
  type UseListPanelReturn,
  type ListPanelOperationType,
} from './hooks/useListPanel';
export {
  useUserStoriesPanel,
  type UseUserStoriesPanelOptions,
  type UseUserStoriesPanelReturn,
} from './hooks/useUserStoriesPanel';
