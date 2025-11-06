import { useEffect, useMemo } from 'react';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';

/**
 * Hook to fetch and access all interfaces for a solution
 */
export function useInterfaces(solutionId: string) {
  const interfaces = useDesignStudioEntityStore((state) => state.interfaces);
  const loading = useDesignStudioEntityStore((state) => state.loading.interfaces);
  const error = useDesignStudioEntityStore((state) => state.errors.interfaces);
  const fetchInterfaces = useDesignStudioEntityStore((state) => state.fetchInterfaces);

  useEffect(() => {
    fetchInterfaces(solutionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionId]); // Only re-fetch when solutionId changes

  return { interfaces, loading, error };
}

/**
 * Hook to get interfaces for a specific design work
 */
export function useInterfacesByDesignWork(designWorkId: string | undefined) {
  const interfaces = useDesignStudioEntityStore((state) => state.interfaces);

  const filteredInterfaces = useMemo(
    () => (designWorkId ? interfaces.filter((i) => i.designWorkId === designWorkId) : []),
    [interfaces, designWorkId]
  );

  return filteredInterfaces;
}

/**
 * Hook to get a single interface by ID
 */
export function useInterface(id: string | undefined) {
  const interfaces = useDesignStudioEntityStore((state) => state.interfaces);

  const interfaceItem = useMemo(() => (id ? interfaces.find((i) => i.id === id) : undefined), [interfaces, id]);

  return interfaceItem;
}
