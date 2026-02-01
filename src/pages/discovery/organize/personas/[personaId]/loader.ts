/**
 * Persona Detail Page Loader
 * Prefetches persona data for SSR
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/lib/query';
import { queryKeys } from '@/shared/lib/query';
import { personaApi } from '@/entities/persona';
import { STALE_TIMES } from '@/shared/lib/query';

export interface PersonaDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  personaId: string;
}

/**
 * Load persona for persona-detail page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadPersonaDetail(personaId: string): Promise<PersonaDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.personas.detail(personaId),
      queryFn: () => personaApi.get(personaId),
      staleTime: STALE_TIMES.personas,
    });
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    personaId,
  };
}
