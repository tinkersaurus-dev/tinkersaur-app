/**
 * UI Component Library Exports
 */

// Re-export migrated components from @tinkersaur/ui
// Batch 1: Foundation Components
export { Card, Tag, Spinner, Empty, Avatar, PRESENTED_IMAGE_SIMPLE } from '@tinkersaur/ui';
export type { CardProps, TagProps, TagColor, SpinnerProps, EmptyProps, AvatarProps } from '@tinkersaur/ui';

// Batch 2: Form Primitives
export { Button, Input, PasswordInput, InputNumber, Checkbox, SearchInput } from '@tinkersaur/ui';
export type { ButtonProps, InputProps, TextAreaProps, PasswordInputProps, InputNumberProps, CheckboxProps, SearchInputProps } from '@tinkersaur/ui';

// Batch 3: Layout Components
export { Stack, HStack, VStack, Layout } from '@tinkersaur/ui';
export type { StackProps, HStackProps, VStackProps, LayoutProps, LayoutHeaderProps, LayoutSiderProps, LayoutContentProps } from '@tinkersaur/ui';

// Batch 4: Overlay Components
export { Tooltip, Dropdown, Modal, Drawer } from '@tinkersaur/ui';
export type { DropdownProps, DropdownMenuProps, DropdownMenuItem, ModalProps, DrawerProps } from '@tinkersaur/ui';

// Batch 5: Selection Components
export { Select, MultiSelect, DatePicker, Menu } from '@tinkersaur/ui';
export type { SelectProps, SelectOption, SelectOptionGroup, MultiSelectProps, MultiSelectOption, DatePickerProps, MenuProps, MenuItemType } from '@tinkersaur/ui';

// Batch 6: Data Display Components
export { Tabs, Tree, TreeNode, Table, DEFAULT_PAGINATION_CONFIG } from '@tinkersaur/ui';
export type {
  TabsProps,
  TabItem,
  DropPosition,
  TreeNodeData,
  TableProps,
  TableColumn,
  TablePaginationConfig,
  TableRowConfig,
  TableHeaderConfig,
  SortDirection,
  SortOrder,
  ServerSortState,
} from '@tinkersaur/ui';

// Batch 7: Form System
export { Form, useForm, useFormContext } from '@tinkersaur/ui';
export type { FormProps, FormItemProps } from '@tinkersaur/ui';

// Batch 8: Content & Feedback
export { MarkdownContent, InlineError, ErrorBoundary } from '@tinkersaur/ui';
export type { MarkdownContentProps, InlineErrorProps } from '@tinkersaur/ui';

// Batch 9: Composite Components
export { PageHeader, PageContent, CardStack, EditableSection, EditableField, ListControlPanel, EntityList } from '@tinkersaur/ui';
export type { PageHeaderProps, PageContentProps, CardStackProps, EditableSectionProps, EditableFieldProps, ListControlPanelProps, FilterConfig, EntityListProps, SelectionState, ListUrlState } from '@tinkersaur/ui';

// Hooks (from @tinkersaur/ui)
export { useListSelection } from '@tinkersaur/ui';
export type { UseListSelectionOptions, UseListSelectionReturn } from '@tinkersaur/ui';

// Theme (from @tinkersaur/ui)
export { ThemeProvider, useTheme } from '@tinkersaur/ui';
export type { Theme } from '@tinkersaur/ui';

// App-specific components (not migrated to library)
export { HighlightableDocument } from './HighlightableDocument';
export type { HighlightableDocumentProps, HighlightableDocumentRef, Highlight } from './HighlightableDocument';

export { DashboardListSection } from './DashboardListSection';
export {
  PersonaRow,
  UseCaseRow,
  FeedbackRow,
  OutcomeRow,
  PersonaIcon,
  UseCaseIcon,
  FeedbackIcon,
  OutcomeIcon,
} from './RecentEntityRow';
