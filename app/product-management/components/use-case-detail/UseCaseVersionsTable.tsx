/**
 * Versions Table component for the Use Case Versions tab
 * Displays versions in a table with action buttons in the first column
 */

import { FiPlus, FiChevronRight, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { Button, Table, Tag, HStack } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { UseCaseVersion } from '~/core/entities/product-management/types/UseCaseVersion';
import {
  getStatusColor,
  getValidTransitions,
  formatVersionNumber,
  UseCaseVersionStatus,
} from '~/core/entities/product-management/types/UseCaseVersion';

export interface UseCaseVersionsTableProps {
  versions: UseCaseVersion[];
  loading: boolean;
  selectedVersion: UseCaseVersion | null;
  onSelectVersion: (version: UseCaseVersion) => void;
  onCreateVersion: () => void;
  onTransitionStatus: (version: UseCaseVersion) => void;
  onRevertVersion: (version: UseCaseVersion) => void;
  onDeleteVersion: (version: UseCaseVersion) => void;
}

export function UseCaseVersionsTable({
  versions,
  loading,
  selectedVersion,
  onSelectVersion,
  onCreateVersion,
  onTransitionStatus,
  onRevertVersion,
  onDeleteVersion,
}: UseCaseVersionsTableProps) {
  const columns: TableColumn<UseCaseVersion>[] = [
    {
      key: 'actions',
      title: 'Actions',
      width: 120,
      render: (_, record) => (
        <HStack gap="sm">
          {/* Status transition - only if transitions available */}
          {getValidTransitions(record.status).length > 0 && (
            <Button
              variant="text"
              size="small"
              icon={<FiChevronRight />}
              onClick={(e) => {
                e.stopPropagation();
                onTransitionStatus(record);
              }}
              title="Change status"
            />
          )}
          {/* Revert button */}
          <Button
            variant="text"
            size="small"
            icon={<FiRefreshCw />}
            onClick={(e) => {
              e.stopPropagation();
              onRevertVersion(record);
            }}
            title="Revert to this version"
          />
          {/* Delete - only for Drafted status */}
          {record.status === UseCaseVersionStatus.Drafted && (
            <Button
              variant="text"
              size="small"
              icon={<FiTrash2 />}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteVersion(record);
              }}
              title="Delete version"
            />
          )}
        </HStack>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (value) => <Tag color={getStatusColor(value as string)}>{value as string}</Tag>,
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataIndex: 'createdAt',
      width: 120,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'versionName',
      title: 'Name',
      dataIndex: 'versionName',
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {formatVersionNumber(record.versionNumber)}
          </span>
          <span>{value as string}</span>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      render: (value) => (
        <span className="truncate block max-w-[200px]">{(value as string) || '—'}</span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={versions}
      rowKey="id"
      loading={loading}
      onRow={(record) => ({
        onClick: () => onSelectVersion(record),
        className: selectedVersion?.id === record.id ? 'bg-[var(--primary-light)]' : '',
      })}
      header={{
        title: 'Versions',
        actions: (
          <Button variant="primary" size="small" icon={<FiPlus />} onClick={onCreateVersion}>
            Create
          </Button>
        ),
      }}
      pagination={false}
      empty={
        <div className="text-center py-8 text-[var(--text-muted)]">
          No versions created yet. Create a version to snapshot the current state.
        </div>
      }
    />
  );
}
