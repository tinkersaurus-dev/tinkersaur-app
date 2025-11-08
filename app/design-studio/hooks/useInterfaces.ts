import { useEffect } from 'react';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';

/**
 * Hook to lazy load and access a single interface by ID
 */
export function useInterface(id: string | undefined) {
  const interfaceItem = useDesignStudioEntityStore((state) => (id ? state.interfaces[id] : undefined));
  const loading = useDesignStudioEntityStore((state) => (id ? state.loading.interfaces[id] : false));
  const error = useDesignStudioEntityStore((state) => (id ? state.errors.interfaces[id] : null));
  const fetchInterface = useDesignStudioEntityStore((state) => state.fetchInterface);

  useEffect(() => {
    if (id && !interfaceItem && !loading) {
      fetchInterface(id);
    }
  }, [id, interfaceItem, loading, fetchInterface]);

  return { interfaceItem, loading, error };
}
