import { useEffect } from 'react';
import { useInterfaceStore } from '~/core/entities/design-studio';

/**
 * Hook to lazy load and access a single interface by ID
 */
export function useInterface(id: string | undefined) {
  const interfaceItem = useInterfaceStore((state) => (id ? state.interfaces[id] : undefined));
  const loading = useInterfaceStore((state) => (id ? state.loading[id] : false));
  const error = useInterfaceStore((state) => (id ? state.errors[id] : null));
  const fetchInterface = useInterfaceStore((state) => state.fetchInterface);

  useEffect(() => {
    if (id && !interfaceItem && !loading) {
      fetchInterface(id);
    }
  }, [id, interfaceItem, loading, fetchInterface]);

  return { interfaceItem, loading, error };
}
