/**
 * Personas sidebar component for use case details
 * Displays linked personas with link/unlink functionality
 */

import { useState, useMemo } from 'react';
import { FiUser } from 'react-icons/fi';
import { Button, Card, Modal } from '@/shared/ui';
import type { UseCase } from '@/entities/use-case';
import type { Persona } from '@/entities/persona';
import { usePersonasQuery } from '@/entities/persona';
import { useUpdateUseCase } from '@/entities/use-case';

export interface UseCasePersonasSidebarProps {
  useCase: UseCase;
  teamId: string | undefined;
}

export function UseCasePersonasSidebar({ useCase, teamId }: UseCasePersonasSidebarProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Fetch all personas for the team
  const { data: allPersonas = [] } = usePersonasQuery(teamId);

  // Mutation for updating use case
  const updateUseCase = useUpdateUseCase();

  // Get linked persona IDs from the use case
  const linkedPersonaIds = useMemo(() => new Set(useCase.personaIds), [useCase.personaIds]);

  // Create a map of linked personas for displaying names
  const linkedPersonas = useMemo(() => {
    return allPersonas.filter((p: Persona) => linkedPersonaIds.has(p.id));
  }, [allPersonas, linkedPersonaIds]);

  // Available personas for linking (filter out already linked ones)
  const availablePersonas = useMemo(() => {
    return allPersonas.filter((p: Persona) => !linkedPersonaIds.has(p.id));
  }, [allPersonas, linkedPersonaIds]);

  const handleLinkPersona = async (personaId: string) => {
    const newPersonaIds = [...useCase.personaIds, personaId];
    await updateUseCase.mutateAsync({
      id: useCase.id,
      updates: { personaIds: newPersonaIds },
    });
  };

  const handleUnlinkPersona = async (personaId: string) => {
    const newPersonaIds = useCase.personaIds.filter((id) => id !== personaId);
    await updateUseCase.mutateAsync({
      id: useCase.id,
      updates: { personaIds: newPersonaIds },
    });
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiUser className="text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">Personas</h3>
          </div>
          <Button
            variant="default"
            size="small"
            onClick={() => setIsLinkModalOpen(true)}
          >
            Link
          </Button>
        </div>

        {linkedPersonas.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">
            No personas linked to this use case.
          </p>
        ) : (
          <ul className="space-y-2">
            {linkedPersonas.map((persona: Persona) => (
              <li
                key={persona.id}
                className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                <span className="text-sm text-[var(--text)] truncate">
                  {persona.name}
                </span>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleUnlinkPersona(persona.id)}
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
            {availablePersonas.map((persona: Persona) => (
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
