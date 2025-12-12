/**
 * Persona Detail Page
 * Displays full persona information with linked use cases
 */

import { useState } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { FiArrowLeft, FiTrash2, FiLink, FiTarget, FiAlertCircle } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { SolutionManagementLayout } from '../components';
import { Button, Card, Modal } from '~/core/components/ui';
import { usePersonaCRUD, usePersonaUseCases } from '../hooks';
import { usePersonaUseCaseStore } from '~/core/entities/product-management';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';
import { loadPersonaDetail } from '../loaders';
import type { PersonaDetailLoaderData } from '../loaders';
import { useHydratePersona } from '../utils/hydrateStores';
import type { Route } from './+types/persona-detail';

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { personaId } = params;
  if (!personaId) {
    throw new Response('Persona ID required', { status: 400 });
  }
  return loadPersonaDetail(personaId);
}

export default function PersonaDetailPage() {
  // Get data from loader - guaranteed to exist (loader throws 404 otherwise)
  const { persona } = useLoaderData<PersonaDetailLoaderData>();

  // Hydrate store for client-side navigation continuity
  useHydratePersona(persona);

  const { personaId } = useParams<{ personaId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const { handleDelete } = usePersonaCRUD();
  const { useCaseIds } = usePersonaUseCases(personaId || '');

  // Get all use cases from store directly (not filtered by solution)
  const allUseCases = useUseCaseStore((state) => state.entities);

  // Store actions for linking/unlinking
  const linkPersonaToUseCase = usePersonaUseCaseStore((state) => state.linkPersonaToUseCase);
  const unlinkPersonaFromUseCase = usePersonaUseCaseStore((state) => state.unlinkPersonaFromUseCase);

  // Filter to get linked use cases
  const linkedUseCases = allUseCases.filter((uc) => useCaseIds.includes(uc.id));

  // Filter to get available (unlinked) use cases for linking
  const availableUseCases = allUseCases.filter((uc) => !useCaseIds.includes(uc.id));

  const handleBack = () => {
    navigate('/personas');
  };

  const handleDeleteConfirm = async () => {
    if (personaId) {
      await handleDelete(personaId);
      navigate('/personas');
    }
    setIsDeleteModalOpen(false);
  };

  const handleLinkUseCase = async (useCaseId: string) => {
    if (personaId) {
      await linkPersonaToUseCase(personaId, useCaseId);
    }
  };

  const handleUnlinkUseCase = async (useCaseId: string) => {
    if (personaId) {
      await unlinkPersonaFromUseCase(personaId, useCaseId);
    }
  };

  return (
    <SolutionManagementLayout>
      <PageHeader
        title={persona.name}
        extra={
          <div className="flex gap-2">
            <Button variant="default" icon={<FiArrowLeft />} onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="danger"
              icon={<FiTrash2 />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Basic Information</h3>

              {persona.role && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Role</label>
                  <p className="text-[var(--text)]">{persona.role}</p>
                </div>
              )}

              {persona.description && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Description</label>
                  <p className="text-[var(--text)] whitespace-pre-wrap">{persona.description}</p>
                </div>
              )}

              {/* Demographics */}
              {(persona.demographics.education || persona.demographics.experience || persona.demographics.industry) && (
                <div className="border-t border-[var(--border)] pt-4 mt-4">
                  <label className="text-sm font-medium text-[var(--text-muted)] block mb-2">Demographics</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {persona.demographics.education && (
                      <div>
                        <span className="text-xs text-[var(--text-disabled)]">Education</span>
                        <p className="text-sm text-[var(--text)]">{persona.demographics.education}</p>
                      </div>
                    )}
                    {persona.demographics.experience && (
                      <div>
                        <span className="text-xs text-[var(--text-disabled)]">Experience</span>
                        <p className="text-sm text-[var(--text)]">{persona.demographics.experience}</p>
                      </div>
                    )}
                    {persona.demographics.industry && (
                      <div>
                        <span className="text-xs text-[var(--text-disabled)]">Industry</span>
                        <p className="text-sm text-[var(--text)]">{persona.demographics.industry}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Goals */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FiTarget className="text-green-500" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Goals</h3>
              </div>
              {persona.goals.length === 0 ? (
                <p className="text-[var(--text-muted)]">No goals defined.</p>
              ) : (
                <ul className="space-y-2">
                  {persona.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-[var(--text)]">{goal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Pain Points */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FiAlertCircle className="text-orange-500" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Pain Points</h3>
              </div>
              {persona.painPoints.length === 0 ? (
                <p className="text-[var(--text-muted)]">No pain points defined.</p>
              ) : (
                <ul className="space-y-2">
                  {persona.painPoints.map((painPoint, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-[var(--text)]">{painPoint}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Sidebar - Linked Use Cases */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiLink className="text-[var(--primary)]" />
                  <h3 className="text-lg font-semibold text-[var(--text)]">Linked Use Cases</h3>
                </div>
                <Button
                  variant="default"
                  size="small"
                  onClick={() => setIsLinkModalOpen(true)}
                >
                  Link
                </Button>
              </div>

              {linkedUseCases.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No use cases linked to this persona.
                </p>
              ) : (
                <ul className="space-y-2">
                  {linkedUseCases.map((useCase) => (
                    <li
                      key={useCase.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                      <span className="text-sm text-[var(--text)] truncate">{useCase.name}</span>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleUnlinkUseCase(useCase.id)}
                      >
                        Unlink
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </PageContent>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Persona"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
      >
        <p className="text-[var(--text)]">
          Are you sure you want to delete <strong>{persona.name}</strong>?
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          This will also remove all links to use cases. This action cannot be undone.
        </p>
      </Modal>

      {/* Link Use Case Modal */}
      <Modal
        title="Link Use Case"
        open={isLinkModalOpen}
        onCancel={() => setIsLinkModalOpen(false)}
        footer={null}
      >
        {availableUseCases.length === 0 ? (
          <p className="text-[var(--text-muted)]">
            No available use cases to link. All use cases are already linked.
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {availableUseCases.map((useCase) => (
              <li
                key={useCase.id}
                className="flex items-center justify-between p-3 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{useCase.name}</p>
                  {useCase.description && (
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">
                      {useCase.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    handleLinkUseCase(useCase.id);
                  }}
                >
                  Link
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </SolutionManagementLayout>
  );
}
