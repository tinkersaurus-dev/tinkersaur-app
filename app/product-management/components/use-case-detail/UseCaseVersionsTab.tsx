/**
 * Versions Tab component for the Use Case detail page
 * Split-panel layout with versions table on the left and detail panel on the right
 */

import { useState, useEffect } from 'react';
import { Button, Modal, Tag, Input, Form, useForm } from '@/shared/ui';
import { useUseCaseVersionStore } from '@/entities/use-case-version';
import { useRevertToUseCaseVersion } from '../../mutations';
import type { UseCaseVersion, CreateUseCaseVersionDto } from '@/entities/use-case-version';
import {
  getStatusColor,
  getValidTransitions,
  UseCaseVersionStatus,
} from '@/entities/use-case-version';
import { UseCaseVersionsTable } from './UseCaseVersionsTable';
import { UseCaseVersionDetailPanel } from './UseCaseVersionDetailPanel';

export interface UseCaseVersionsTabProps {
  useCaseId: string;
}

export function UseCaseVersionsTab({ useCaseId }: UseCaseVersionsTabProps) {
  const [selectedVersion, setSelectedVersion] = useState<UseCaseVersion | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [transitionVersion, setTransitionVersion] = useState<UseCaseVersion | null>(null);

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
      // Clear selection if the deleted version was selected
      if (selectedVersion?.id === version.id) {
        setSelectedVersion(null);
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  };

  const handleTransitionStatus = async (targetStatus: string) => {
    if (!transitionVersion) return;
    try {
      await transitionStatus(useCaseId, transitionVersion.id, targetStatus);
      setIsTransitionModalOpen(false);
      setTransitionVersion(null);
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
    } catch (error) {
      console.error('Failed to revert to version:', error);
    }
  };

  const openTransitionModal = (version: UseCaseVersion) => {
    setTransitionVersion(version);
    setIsTransitionModalOpen(true);
  };

  const validTransitions = transitionVersion ? getValidTransitions(transitionVersion.status) : [];

  return (
    <>
      <div className="pt-4 h-[calc(90vh-160px)]">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Left: Versions Table */}
          <div className="h-full overflow-auto">
            <UseCaseVersionsTable
              versions={useCaseVersions}
              loading={loading}
              selectedVersion={selectedVersion}
              onSelectVersion={setSelectedVersion}
              onCreateVersion={() => setIsCreateModalOpen(true)}
              onTransitionStatus={openTransitionModal}
              onRevertVersion={handleRevertToVersion}
              onDeleteVersion={handleDeleteVersion}
            />
          </div>

          {/* Right: Version Detail Panel */}
          <div className="h-full overflow-hidden">
            <UseCaseVersionDetailPanel
              useCaseId={useCaseId}
              version={selectedVersion}
            />
          </div>
        </div>
      </div>

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
          setTransitionVersion(null);
        }}
        footer={null}
      >
        {transitionVersion && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[var(--text)]">
              Current status:{' '}
              <Tag color={getStatusColor(transitionVersion.status)}>{transitionVersion.status}</Tag>
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Select a new status for "{transitionVersion.versionName}":
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
