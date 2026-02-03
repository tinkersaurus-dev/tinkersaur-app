/**
 * Specification Viewer Panel component
 * Displays the compiled specification markdown for a selected version
 * Used in the Specification page split-panel layout
 */

import { useEffect } from 'react';
import { FiFileText } from 'react-icons/fi';
import { Card, Tag, MarkdownContent, Spinner } from '@/shared/ui';
import { useUseCaseVersionStore, formatVersionDisplay, getStatusColor } from '@/entities/use-case-version';
import type { DeliveredSpecification } from '../api/useDeliveredSpecifications';

export interface SpecificationViewerPanelProps {
  specification: DeliveredSpecification | null;
}

export function SpecificationViewerPanel({ specification }: SpecificationViewerPanelProps) {
  const { fetchVersionDetail, versionDetails, loading } = useUseCaseVersionStore();

  // Get version detail from store
  const versionDetail = specification
    ? versionDetails[specification.latestDeliveredVersion.id] ?? null
    : null;

  // Fetch version detail when selection changes and not cached
  useEffect(() => {
    if (specification && !versionDetails[specification.latestDeliveredVersion.id]) {
      fetchVersionDetail(
        specification.useCase.id,
        specification.latestDeliveredVersion.id
      ).catch((error) => {
        console.error('Failed to fetch version detail:', error);
      });
    }
  }, [specification, fetchVersionDetail, versionDetails]);

  // Determine loading state
  const isLoading = loading && !versionDetail;

  // Empty state - no specification selected
  if (!specification) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-[var(--text-muted)]">
          <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a use case to view its specification</p>
          <p className="text-sm mt-2">Click on a row in the table to select</p>
        </div>
      </Card>
    );
  }

  const { useCase, latestDeliveredVersion } = specification;

  return (
    <Card className="h-full overflow-hidden" contentClassName="h-full flex flex-col p-0">
      {/* Header with use case and version info */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[var(--text)]">{useCase.name}</span>
          <Tag color={getStatusColor(latestDeliveredVersion.status)}>
            {latestDeliveredVersion.status}
          </Tag>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {formatVersionDisplay(latestDeliveredVersion)}
        </p>
        {latestDeliveredVersion.description && (
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {latestDeliveredVersion.description}
          </p>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <Spinner className="mr-2" />
            Loading specification...
          </div>
        ) : versionDetail ? (
          <div className="markdown-content markdown-content--specification">
            <MarkdownContent content={versionDetail.compiledSpecification} />
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No specification available</p>
        )}
      </div>
    </Card>
  );
}
