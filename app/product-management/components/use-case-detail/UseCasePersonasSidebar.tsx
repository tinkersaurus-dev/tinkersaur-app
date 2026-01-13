/**
 * Personas sidebar component for use case details
 * Displays linked personas with link/unlink functionality
 */

import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { FiUser } from 'react-icons/fi';
import { Button, Card, Modal } from '~/core/components/ui';
import type { PersonaUseCase } from '~/core/entities/product-management/types';
import { useUseCasePersonasQuery, usePersonasQuery } from '../../queries';
import { useCreatePersonaUseCase, useDeletePersonaUseCase } from '../../mutations';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { personaApi } from '~/core/entities/product-management/api';

export interface UseCasePersonasSidebarProps {
  useCaseId: string;
  teamId: string | undefined;
}

export function UseCasePersonasSidebar({ useCaseId, teamId }: UseCasePersonasSidebarProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Fetch persona-use case associations
  const { data: useCasePersonas = [] } = useUseCasePersonasQuery(useCaseId);
  const { data: allPersonas = [] } = usePersonasQuery(teamId);

  // Mutations
  const createPersonaUseCase = useCreatePersonaUseCase();
  const deletePersonaUseCase = useDeletePersonaUseCase();

  // Get persona IDs for batch fetching names
  const personaIds = useMemo(() =>
    useCasePersonas.map((puc: PersonaUseCase) => puc.personaId),
    [useCasePersonas]
  );

  // Batch fetch persona details for displaying names
  const personaQueries = useQueries({
    queries: personaIds.map((id: string) => ({
      queryKey: queryKeys.personas.detail(id),
      queryFn: () => personaApi.get(id),
      staleTime: STALE_TIMES.personas,
      enabled: !!id,
    })),
  });

  // Create a map of personaId -> personaName
  const personaNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    personaQueries.forEach((query, index) => {
      if (query.data) {
        map[personaIds[index]] = query.data.name;
      }
    });
    return map;
  }, [personaQueries, personaIds]);

  // Available personas for linking (filter out already linked ones)
  const availablePersonas = useMemo(() => {
    const linkedPersonaIds = new Set(personaIds);
    return allPersonas.filter(p => !linkedPersonaIds.has(p.id));
  }, [allPersonas, personaIds]);

  const handleLinkPersona = async (personaId: string) => {
    await createPersonaUseCase.mutateAsync({
      personaId,
      useCaseId,
    });
  };

  const handleUnlinkPersona = async (personaId: string) => {
    // Find the persona-use case association to delete
    const association = useCasePersonas.find(
      (puc: PersonaUseCase) => puc.useCaseId === useCaseId && puc.personaId === personaId
    );
    if (association) {
      await deletePersonaUseCase.mutateAsync(association.id);
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiUser className="text-[var(--primary)]" />
            <h3 className="text-md font-semibold text-[var(--text)]">Personas</h3>
          </div>
          <Button
            variant="default"
            size="small"
            onClick={() => setIsLinkModalOpen(true)}
          >
            Link
          </Button>
        </div>

        {useCasePersonas.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">
            No personas linked to this use case.
          </p>
        ) : (
          <ul className="space-y-2">
            {useCasePersonas.map((puc: PersonaUseCase) => (
              <li
                key={puc.id}
                className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                <span className="text-sm text-[var(--text)] truncate">
                  {personaNameMap[puc.personaId] || 'Loading...'}
                </span>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleUnlinkPersona(puc.personaId)}
                >
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Link Persona Modal */}
      <Modal
        title="Link Persona"
        open={isLinkModalOpen}
        onCancel={() => setIsLinkModalOpen(false)}
        footer={null}
      >
        {availablePersonas.length === 0 ? (
          <p className="text-[var(--text-muted)]">
            No available personas to link. All personas are already linked.
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {availablePersonas.map((persona) => (
              <li
                key={persona.id}
                className="flex items-center justify-between p-3 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{persona.name}</p>
                  {persona.role && (
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">
                      {persona.role}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    handleLinkPersona(persona.id);
                  }}
                >
                  Link
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
