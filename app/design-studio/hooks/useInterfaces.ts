import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInterfaceStore } from '~/core/entities/design-studio';
import { useInterfaceQuery } from '~/design-studio/queries';
import { queryKeys } from '~/core/query/queryKeys';

/**
 * Hook to lazy load and access a single interface by ID
 * Uses TanStack Query for data fetching with automatic caching and background refresh.
 */
export function useInterface(id: string | undefined) {
  const queryClient = useQueryClient();
  const setInterface = useInterfaceStore((state) => state.setInterface);
  const clearInterface = useInterfaceStore((state) => state.clearInterface);
  const storedInterface = useInterfaceStore((state) => (id ? state.interfaces[id] : undefined));
  const error = useInterfaceStore((state) => (id ? state.errors[id] : null));

  // Use TanStack Query for fetching
  const { data: interfaceItem, isLoading } = useInterfaceQuery(id);

  // Sync fetched interface to Zustand store
  useEffect(() => {
    if (interfaceItem) {
      setInterface(interfaceItem);
    }
  }, [interfaceItem, setInterface]);

  // Clear interface from store and invalidate query cache on unmount to ensure fresh data on reopen
  useEffect(() => {
    return () => {
      if (id) {
        clearInterface(id);
        queryClient.invalidateQueries({ queryKey: queryKeys.interfaces.detail(id) });
      }
    };
  }, [id, clearInterface, queryClient]);

  return {
    // Return store interface for immediate updates, or query data
    interfaceItem: storedInterface ?? interfaceItem ?? undefined,
    loading: isLoading,
    error,
  };
}
