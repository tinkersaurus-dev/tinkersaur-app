/**
 * Specification List component
 * Displays a table of use cases with their latest Delivered versions
 * Used in the Specification page split-panel layout
 */

import { FiFileText } from 'react-icons/fi';
import { Table } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import { formatVersionNumber } from '@/entities/use-case-version';
import type { DeliveredSpecification } from '../api/useDeliveredSpecifications';

export interface SpecificationListProps {
  specifications: DeliveredSpecification[];
  loading: boolean;
  selectedSpec: DeliveredSpecification | null;
  onSelectSpec: (spec: DeliveredSpecification) => void;
  hasUseCases: boolean;
}

export function SpecificationList({
  specifications,
  loading,
  selectedSpec,
  onSelectSpec,
  hasUseCases,
}: SpecificationListProps) {
  const columns: TableColumn<DeliveredSpecification>[] = [
    {
      key: 'useCaseName',
      title: 'Use Case',
      render: (_, record) => (
        <span className="font-medium">{record.useCase.name}</span>
      ),
    },
    {
      key: 'version',
      title: 'Version',
      width: 80,
      render: (_, record) => formatVersionNumber(record.latestDeliveredVersion.versionNumber),
    },
    {
      key: 'versionName',
      title: 'Version Name',
      render: (_, record) => record.latestDeliveredVersion.versionName,
    },
  ];

  // Show appropriate empty state
  if (!loading && specifications.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FiFileText className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
          {hasUseCases ? (
            <>
              <p className="text-[var(--text-muted)]">No delivered specifications found</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                Use cases must have at least one version with &apos;Delivered&apos; status
              </p>
            </>
          ) : (
            <>
              <p className="text-[var(--text-muted)]">No use cases found</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                Add use cases to this solution to see their specifications
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Table
      header={{
        title: 'Delivered Specifications',
      }}
      columns={columns}
      dataSource={specifications}
      rowKey={(record) => record.latestDeliveredVersion.id}
      loading={loading}
      pagination={false}
      onRow={(record) => ({
        onClick: () => onSelectSpec(record),
        className: selectedSpec?.latestDeliveredVersion.id === record.latestDeliveredVersion.id
          ? 'bg-[var(--primary-light)] cursor-pointer'
          : 'cursor-pointer hover:bg-[var(--bg-hover)]',
      })}
    />
  );
}
