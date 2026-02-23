/**
 * Discovery User Goal Detail Page
 * Displays user goal details with linked personas and feedback
 */

import { useState } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import { FiArrowLeft, FiTrash2, FiMessageCircle, FiArchive, FiAlertTriangle } from 'react-icons/fi';
import { PageHeader, PageContent } from '@/shared/ui';
import { Button, Card, Modal, Tabs, Table, Empty } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import type { LoaderFunctionArgs } from 'react-router';
import { useUserGoalQuery, useDeleteUserGoal, useUpdateUserGoal } from '@/entities/user-goal';
import { UserGoalBasicInfo } from '@/entities/user-goal/ui/UserGoalBasicInfo';
import { UserGoalPersonasSidebar } from '@/entities/user-goal/ui/UserGoalPersonasSidebar';
import { useUserGoalFeedback } from '@/entities/user-goal/ui/useUserGoalFeedback';
import type { FeedbackRow } from '@/entities/user-goal/ui/useUserGoalFeedback';
import type { QuoteWithSource } from '@/entities/quote';
import { loadDiscoveryUserGoalDetail } from './loader';
import type { DiscoveryUserGoalDetailLoaderData } from './loader';

// Loader function for SSR data fetching
export async function loader({ params }: LoaderFunctionArgs) {
  const userGoalId = params.userGoalId;
  if (!userGoalId) {
    throw new Response('User Goal ID required', { status: 400 });
  }
  return loadDiscoveryUserGoalDetail(userGoalId);
}

// ── Quote table columns ──

interface QuoteRow {
  id: string;
  quote: string;
  source: string;
}

const quoteColumns: TableColumn<QuoteRow>[] = [
  {
    key: 'quote',
    title: 'Quote',
    dataIndex: 'quote',
    render: (value) => (
      <span className="text-xs italic text-[var(--text)]">"{value as string}"</span>
    ),
  },
  {
    key: 'source',
    title: 'Source',
    dataIndex: 'source',
    width: 180,
    render: (value) => (
      <span className="text-xs text-[var(--text-muted)]">{value as string}</span>
    ),
  },
];

// ── Feedback table columns ──

const feedbackColumns: TableColumn<FeedbackRow>[] = [
  {
    key: 'content',
    title: 'Content',
    dataIndex: 'content',
    render: (value) => (
      <span className="text-xs text-[var(--text)]">{value as string}</span>
    ),
  },
  {
    key: 'weight',
    title: 'Weight',
    dataIndex: 'weight',
    width: 80,
    render: (value) => {
      const weight = value as number;
      if (weight === 0) {
        return <span className="text-xs text-[var(--text-muted)]">&mdash;</span>;
      }
      return (
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
          +{weight}
        </span>
      );
    },
  },
  {
    key: 'quotes',
    title: 'Quotes',
    dataIndex: 'quotes',
    render: (value) => {
      const quotes = value as QuoteWithSource[];
      if (quotes.length === 0) {
        return <span className="text-sm text-[var(--text-muted)]">&mdash;</span>;
      }
      return (
        <div className="space-y-1">
          {quotes.map((quote) => (
            <span
              key={quote.id}
              className="text-xs text-[var(--text-muted)] italic"
            >
              "{quote.content}"
            </span>
          ))}
        </div>
      );
    },
  },
  {
    key: 'sourceName',
    title: 'Source',
    dataIndex: 'sourceName',
    width: 180,
    render: (value) => (
      <span className="text-xs text-[var(--text-muted)]">{value as string}</span>
    ),
  },
];

function DiscoveryUserGoalDetailContent() {
  const { userGoalId } = useParams<{ userGoalId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('quotes');

  // TanStack Query hooks
  const { data: userGoal } = useUserGoalQuery(userGoalId);
  const deleteUserGoal = useDeleteUserGoal();
  const updateUserGoal = useUpdateUserGoal();

  // Feedback data for tabs
  const { suggestions, problems, suggestionsCount, problemsCount } = useUserGoalFeedback(
    userGoal?.teamId,
    userGoalId,
  );

  const handleBack = () => {
    navigate('/discovery/organize/user-goals');
  };

  const handleDeleteConfirm = async () => {
    if (userGoalId) {
      await deleteUserGoal.mutateAsync(userGoalId);
      navigate('/discovery/organize/user-goals');
    }
    setIsDeleteModalOpen(false);
  };

  const handleSaveBasicInfo = async (updates: { name: string; description?: string }) => {
    if (!userGoalId) return;
    await updateUserGoal.mutateAsync({
      id: userGoalId,
      updates,
    });
  };

  // Handle case where user goal is not yet loaded
  if (!userGoal) {
    return (
      <PageContent>
        <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
      </PageContent>
    );
  }

  // Prepare quote rows
  const quoteRows: QuoteRow[] = (userGoal.quotes || []).map((quote) => ({
    id: quote.id,
    quote: quote.content,
    source: quote.sourceName ?? 'Unknown source',
  }));

  return (
    <>
      <PageHeader
        title={`User Goal - ${userGoal.name}`}
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
            <UserGoalBasicInfo
              userGoal={userGoal}
              onSave={handleSaveBasicInfo}
              isSaving={updateUserGoal.isPending}
            />

            {/* Tabbed Section: Quotes, Suggestions, Problems */}
            <Card shadow={false}>
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
                        Supporting Quotes ({userGoal.quotes?.length || 0})
                      </span>
                    ),
                    children: (
                      <div className="pt-4">
                        {quoteRows.length === 0 ? (
                          <Empty image="simple" description="No supporting quotes" />
                        ) : (
                          <Table
                            columns={quoteColumns}
                            dataSource={quoteRows}
                            rowKey="id"
                            pagination={false}
                          />
                        )}
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
                        {suggestions.length === 0 ? (
                          <Empty image="simple" description="No suggestions for this user goal" />
                        ) : (
                          <Table
                            columns={feedbackColumns}
                            dataSource={suggestions}
                            rowKey="id"
                            pagination={false}
                          />
                        )}
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
                        {problems.length === 0 ? (
                          <Empty image="simple" description="No problems for this user goal" />
                        ) : (
                          <Table
                            columns={feedbackColumns}
                            dataSource={problems}
                            rowKey="id"
                            pagination={false}
                          />
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>

          {/* Sidebar - Personas */}
          <div className="space-y-6">
            <UserGoalPersonasSidebar
              userGoal={userGoal}
              teamId={userGoal.teamId}
            />
          </div>
        </div>
      </PageContent>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete User Goal"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
      >
        <p className="text-[var(--text)]">
          Are you sure you want to delete <strong>{userGoal.name}</strong>?
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          This will also remove all links to personas and feedback. This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}

export default function DiscoveryUserGoalDetailPage() {
  const { dehydratedState } = useLoaderData<DiscoveryUserGoalDetailLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <DiscoveryUserGoalDetailContent />
    </HydrationBoundary>
  );
}
