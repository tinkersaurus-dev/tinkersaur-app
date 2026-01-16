/**
 * Versions sidebar component for use case details
 * Displays use case versions with create, view, and status transition functionality
 */

import { useState, useEffect } from 'react';
import { FiTag, FiPlus, FiEye, FiTrash2, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { Button, Card, Modal, Tag, Input, Form, useForm } from '~/core/components/ui';
import { useUseCaseVersionStore } from '~/core/entities/product-management/store/useUseCaseVersionStore';
import { useRevertToUseCaseVersion } from '../../mutations';
import type { UseCaseVersion, CreateUseCaseVersionDto } from '~/core/entities/product-management/types/UseCaseVersion';
import {
  getStatusColor,
  getValidTransitions,
  formatVersionNumber,
  UseCaseVersionStatus,
} from '~/core/entities/product-management/types/UseCaseVersion';

export interface UseCaseVersionsSidebarProps {
  useCaseId: string;
  onViewVersion?: (version: UseCaseVersion) => void;
  onVersionReverted?: () => void;
}

export function UseCaseVersionsSidebar({
  useCaseId,
  onViewVersion,
  onVersionReverted,
}: UseCaseVersionsSidebarProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<UseCaseVersion | null>(null);

  // Version store
  const {
    versions,
    loading,
    fetchVersions,
    createVersion,
    deleteVersion,
    transitionStatus,
  } = useUseCaseVersionStore();

  // Mutation for revert (invalidates TanStack Query cache)
  const revertMutation = useRevertToUseCaseVersion();

  // Get versions for this use case
  const useCaseVersions = versions[useCaseId] || [];

  // Fetch versions on mount
  useEffect(() => {
    if (useCaseId) {
      fetchVersions(useCaseId);
    }
  }, [useCaseId, fetchVersions]);

  // Form for creating new version
  const form = useForm<CreateUseCaseVersionDto>({
    versionName: '',
    description: '',
  });

  const handleCreateVersion = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    try {
      await createVersion(useCaseId, {
        versionName: values.versionName,
        description: values.description || undefined,
      });
      setIsCreateModalOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  const handleDeleteVersion = async (version: UseCaseVersion) => {
    if (!confirm(`Are you sure you want to delete version "${version.versionName}"?`)) {
      return;
    }
    try {
      await deleteVersion(useCaseId, version.id);
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  };

  const handleTransitionStatus = async (targetStatus: string) => {
    if (!selectedVersion) return;
    try {
      await transitionStatus(useCaseId, selectedVersion.id, targetStatus);
      setIsTransitionModalOpen(false);
      setSelectedVersion(null);
    } catch (error) {
      console.error('Failed to transition status:', error);
    }
  };

  const handleRevertToVersion = async (version: UseCaseVersion) => {
    if (
      !confirm(
        `Are you sure you want to revert to version "${version.versionName}"? This will overwrite the current use case state.`
      )
    ) {
      return;
    }
    try {
      await revertMutation.mutateAsync({ useCaseId, versionId: version.id });
      onVersionReverted?.();
    } catch (error) {
      console.error('Failed to revert to version:', error);
    }
  };

  const openTransitionModal = (version: UseCaseVersion) => {
    setSelectedVersion(version);
    setIsTransitionModalOpen(true);
  };

  const validTransitions = selectedVersion ? getValidTransitions(selectedVersion.status) : [];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiTag className="text-[var(--primary)]" />
            <h3 className="text-md font-semibold text-[var(--text)]">Versions</h3>
          </div>
          <Button
            variant="primary"
            size="small"
            icon={<FiPlus />}
            onClick={() => setIsCreateModalOpen(true)}
            disabled={loading}
          >
            Create
          </Button>
        </div>

        {loading && useCaseVersions.length === 0 ? (
          <div className="text-center py-4 text-[var(--text-muted)]">
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </div>
        ) : useCaseVersions.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">
            No versions created yet. Create a version to snapshot the current state.
          </p>
        ) : (
          <ul className="space-y-2">
            {useCaseVersions.map((version) => (
              <li
                key={version.id}
                className="p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        {formatVersionNumber(version.versionNumber)}
                      </span>
                      <Tag color={getStatusColor(version.status)}>
                        {version.status}
                      </Tag>
                    </div>
                    <p className="text-sm text-[var(--text)] truncate mt-1">{version.versionName}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {/* View button */}
                    <Button
                      variant="text"
                      size="small"
                      icon={<FiEye />}
                      onClick={() => onViewVersion?.(version)}
                      title="View version"
                    />
                    {/* Status transition button (if transitions available) */}
                    {getValidTransitions(version.status).length > 0 && (
                      <Button
                        variant="text"
                        size="small"
                        icon={<FiChevronRight />}
                        onClick={() => openTransitionModal(version)}
                        title="Change status"
                      />
                    )}
                    {/* Revert button */}
                    <Button
                      variant="text"
                      size="small"
                      icon={<FiRefreshCw />}
                      onClick={() => handleRevertToVersion(version)}
                      title="Revert to this version"
                    />
                    {/* Delete button (only for Drafted) */}
                    {version.status === UseCaseVersionStatus.Drafted && (
                      <Button
                        variant="text"
                        size="small"
                        icon={<FiTrash2 />}
                        onClick={() => handleDeleteVersion(version)}
                        title="Delete version"
                      />
                    )}
                  </div>
                </div>
                {version.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                    {version.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Create Version Modal */}
      <Modal
        title="Create Version"
        open={isCreateModalOpen}
        onOk={handleCreateVersion}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.reset();
        }}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-4">
            <Form.Item
              name="versionName"
              label="Version Name"
              required
              rules={{
                required: 'Please enter a version name',
                maxLength: { value: 100, message: 'Name must be 100 characters or less' },
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="e.g., MVP Release, Phase 1"
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={{
                maxLength: { value: 2000, message: 'Description must be 2000 characters or less' },
              }}
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Optional release notes or description..."
                  rows={3}
                  error={!!error}
                />
              )}
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Status Transition Modal */}
      <Modal
        title="Change Version Status"
        open={isTransitionModalOpen}
        onCancel={() => {
          setIsTransitionModalOpen(false);
          setSelectedVersion(null);
        }}
        footer={null}
      >
        {selectedVersion && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[var(--text)]">
              Current status:{' '}
              <Tag color={getStatusColor(selectedVersion.status)}>{selectedVersion.status}</Tag>
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Select a new status for "{selectedVersion.versionName}":
            </p>
            <div className="flex flex-col gap-2">
              {validTransitions.map((status) => (
                <Button
                  key={status}
                  variant={status === UseCaseVersionStatus.Rejected ? 'danger' : 'primary'}
                  onClick={() => handleTransitionStatus(status)}
                  className="justify-start"
                >
                  Transition to {status}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
