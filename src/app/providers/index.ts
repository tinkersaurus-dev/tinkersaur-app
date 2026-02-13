// Re-export from @tinkersaur/ui for backwards compatibility
export { ThemeProvider, useTheme } from '@tinkersaur/ui';
export type { Theme } from '@tinkersaur/ui';
export { QueryProvider } from './QueryProvider';
export { getQueryClient, createQueryClient, STALE_TIMES, REFETCH_INTERVALS } from './queryClient';
