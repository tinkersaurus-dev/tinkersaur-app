/**
 * Discovery Use Case Detail Page
 * Displays use case details with linked personas and feedback
 */

import { useState } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { FiArrowLeft, FiTrash2, FiMessageCircle, FiArchive, FiAlertTriangle } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '@/app/layouts/MainLayout';
import { Button, Card, Modal, Tabs } from '@/shared/ui';
import { useUseCaseQuery } from '~/product-management/queries';
import { useDeleteUseCase, useUpdateUseCase } from '~/product-management/mutations';
import { loadDiscoveryUseCaseDetail } from './loader';
import type { DiscoveryUseCaseDetailLoaderData } from './loader';
import type { Route } from './+types/page';
import {
  UseCaseBasicInfo,
  UseCaseSupportingQuotes,
  UseCaseFeedbackTab,
  UseCasePersonasSidebar,
  useUseCaseFeedback,
} from '~/product-management/components/use-case-detail';

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { useCaseId } = params;
  if (!useCaseId) {
    throw new Response('Use Case ID required', { status: 400 });
  }
  return loadDiscoveryUseCaseDetail(useCaseId);
}

function DiscoveryUseCaseDetailContent() {
  const { useCaseId } = useParams<{ useCaseId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('quotes');

  // TanStack Query hooks
  const { data: useCase } = useUseCaseQuery(useCaseId);
  const deleteUseCase = useDeleteUseCase();
  const updateUseCase = useUpdateUseCase();

  // Feedback data for tabs
  const { suggestions, problems, suggestionsCount, problemsCount } = useUseCaseFeedback(
    useCase?.teamId,
    useCaseId
  );

  const handleBack = () => {
    navigate('/discovery/organize/use-cases');
  };

  const handleDeleteConfirm = async () => {
    if (useCaseId) {
      await deleteUseCase.mutateAsync(useCaseId);
      navigate('/discovery/organize/use-cases');
    }
    setIsDeleteModalOpen(false);
  };

  const handleSaveBasicInfo = async (updates: { name: string; description?: string }) => {
    if (!useCaseId) return;
    await updateUseCase.mutateAsync({
      id: useCaseId,
      updates,
    });
  };

  // Handle case where use case is not yet loaded
  if (!useCase) {
    return (
      <MainLayout>
        <PageContent>
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        </PageContent>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={`Use Case - ${useCase.name}`}
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
            <UseCaseBasicInfo
              useCase={useCase}
              onSave={handleSaveBasicInfo}
              isSaving={updateUseCase.isPending}
            />

            {/* Tabbed Section: Quotes, Suggestions, Problems */}
            <Card>
              <Tabs
                type="line"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'quotes',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiMessageCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Supporting Quotes ({useCase.quotes?.length || 0})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        <UseCaseSupportingQuotes
                          quotes={useCase.quotes || []}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'suggestions',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiArchive className="w-3.5 h-3.5 text-blue-500" />
                        Suggestions ({suggestionsCount})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        <UseCaseFeedbackTab
                          feedbackRows={suggestions}
                          emptyDescription="No suggestions for this use case"
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'problems',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <FiAlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        Problems ({problemsCount})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        <UseCaseFeedbackTab
                          feedbackRows={problems}
                          emptyDescription="No problems for this use case"
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>

          {/* Sidebar - Personas */}
          <div className="space-y-6">
            <UseCasePersonasSidebar
              useCase={useCase}
              teamId={useCase.teamId}
            />
          </div>
        </div>
      </PageContent>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Use Case"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
      >
        <p className="text-[var(--text)]">
          Are you sure you want to delete <strong>{useCase.name}</strong>?
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          This will also remove all links to personas and requirements. This action cannot be undone.
        </p>
      </Modal>
    </MainLayout>
  );
}

export default function DiscoveryUseCaseDetailPage() {
  const { dehydratedState } = useLoaderData<DiscoveryUseCaseDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <DiscoveryUseCaseDetailContent />
    </HydrationBoundary>
  );
}
