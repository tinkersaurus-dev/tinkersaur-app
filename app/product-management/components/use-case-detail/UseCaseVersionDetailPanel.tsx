/**
 * Version Detail Panel component
 * Displays the full snapshot and compiled specification for a selected version
 * Used in the Versions tab split-panel layout
 */

import { useState, useEffect } from 'react';
import { FiFileText, FiDatabase, FiEye } from 'react-icons/fi';
import { Card, Tag, Tabs, MarkdownContent } from '~/core/components/ui';
import { useUseCaseVersionStore } from '~/core/entities/product-management/store/useUseCaseVersionStore';
import type { UseCaseVersion } from '~/core/entities/product-management/types/UseCaseVersion';
import {
  getStatusColor,
  formatVersionDisplay,
} from '~/core/entities/product-management/types/UseCaseVersion';
import '~/design-studio/styles/markdown-content.css';

export interface UseCaseVersionDetailPanelProps {
  useCaseId: string;
  version: UseCaseVersion | null;
}

export function UseCaseVersionDetailPanel({
  useCaseId,
  version,
}: UseCaseVersionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('specification');

  const { fetchVersionDetail, versionDetails, loading } = useUseCaseVersionStore();

  // Get version detail from store (derived state, no local copy needed)
  const versionDetail = version ? versionDetails[version.id] ?? null : null;

  // Fetch version detail when version changes and not cached
  useEffect(() => {
    if (version && !versionDetails[version.id]) {
      fetchVersionDetail(useCaseId, version.id).catch((error) => {
        console.error('Failed to fetch version detail:', error);
      });
    }
  }, [version, useCaseId, fetchVersionDetail, versionDetails]);

  // Determine loading state from store's loading state when we don't have data yet
  const isLoading = loading && !versionDetail;

  // Empty state - no version selected
  if (!version) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-[var(--text-muted)]">
          <FiEye className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a version to view details</p>
          <p className="text-sm mt-2">Click on a row in the table to select</p>
        </div>
      </Card>
    );
  }

  const renderSnapshotContent = () => {
    if (!versionDetail) return null;

    const { snapshot } = versionDetail;

    return (
      <div className="space-y-6">
        {/* Use Case Info */}
        <section>
          <h4 className="text-sm font-semibold text-[var(--text)] mb-2">Use Case</h4>
          <div className="bg-[var(--bg-secondary)] rounded p-3 space-y-2">
            <p className="text-sm">
              <span className="text-[var(--text-muted)]">Name:</span>{' '}
              <span className="text-[var(--text)]">{snapshot.name}</span>
            </p>
            {snapshot.description && (
              <p className="text-sm">
                <span className="text-[var(--text-muted)]">Description:</span>{' '}
                <span className="text-[var(--text)]">{snapshot.description}</span>
              </p>
            )}
            {snapshot.quotes.length > 0 && (
              <div className="text-sm">
                <span className="text-[var(--text-muted)]">Quotes:</span>
                <ul className="list-disc list-inside mt-1">
                  {snapshot.quotes.map((quote, index) => (
                    <li key={index} className="text-[var(--text)] italic">"{quote}"</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Requirements */}
        <section>
          <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
            Requirements ({snapshot.requirements.length})
          </h4>
          {snapshot.requirements.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No requirements</p>
          ) : (
            <div className="space-y-2">
              {snapshot.requirements.map((req, index) => (
                <div key={req.originalId || index} className="bg-[var(--bg-secondary)] rounded p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-[var(--text)] flex-1">{req.text}</p>
                    <Tag color={req.type === 'Functional' ? 'blue' : req.type === 'NonFunctional' ? 'orange' : 'default'}>
                      {req.type}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Design Works */}
        <section>
          <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
            Design Works ({snapshot.designWorks.length})
          </h4>
          {snapshot.designWorks.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No design works</p>
          ) : (
            <div className="space-y-2">
              {snapshot.designWorks.map((dw, index) => (
                <div key={dw.originalId || index} className="bg-[var(--bg-secondary)] rounded p-3">
                  <p className="text-sm font-medium text-[var(--text)]">{dw.name}</p>
                  <div className="flex gap-4 mt-1 text-xs text-[var(--text-muted)]">
                    {dw.diagrams.length > 0 && <span>{dw.diagrams.length} diagram(s)</span>}
                    {dw.documents.length > 0 && <span>{dw.documents.length} document(s)</span>}
                    {dw.interfaces.length > 0 && <span>{dw.interfaces.length} interface(s)</span>}
                    {dw.references.length > 0 && <span>{dw.references.length} reference(s)</span>}
                    {dw.requirementRefIds.length > 0 && <span>{dw.requirementRefIds.length} requirement ref(s)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Snapshot metadata */}
        <section className="pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">
            Snapshot taken: {new Date(snapshot.snapshotTakenAt).toLocaleString()}
          </p>
        </section>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header with version info */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{formatVersionDisplay(version)}</span>
          <Tag color={getStatusColor(version.status)}>{version.status}</Tag>
        </div>
        {version.description && (
          <p className="text-sm text-[var(--text-muted)] mt-1">{version.description}</p>
        )}
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Created: {new Date(version.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Loading version details...
          </div>
        ) : (
          <Tabs
            type="line"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'specification',
                label: (
                  <span className="flex items-center gap-1.5">
                    <FiFileText className="w-3.5 h-3.5" />
                    Specification
                  </span>
                ),
                children: (
                  <div className="p-4">
                    {versionDetail ? (
                      <div className="markdown-content markdown-content--compact">
                        <MarkdownContent content={versionDetail.compiledSpecification} />
                      </div>
                    ) : (
                      <p className="text-[var(--text-muted)]">No specification available</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'snapshot',
                label: (
                  <span className="flex items-center gap-1.5">
                    <FiDatabase className="w-3.5 h-3.5" />
                    Snapshot Data
                  </span>
                ),
                children: (
                  <div className="p-4">
                    {renderSnapshotContent()}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </Card>
  );
}
