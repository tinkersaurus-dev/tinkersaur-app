import { useMemo } from 'react';
import { Link } from 'react-router';
import { Table, Tag } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import type { UseCaseEvidenceRow } from '../lib/useUseCaseEvidenceRows';

interface UseCaseEvidenceTableProps {
  rows: UseCaseEvidenceRow[];
  loading: boolean;
}

export function UseCaseEvidenceTable({ rows, loading }: UseCaseEvidenceTableProps) {
  const columns: TableColumn<UseCaseEvidenceRow>[] = useMemo(
    () => [
      {
        key: 'name',
        title: 'Use Case',
        dataIndex: 'name',
        render: (_, record) => (
          <Link
            to={`/discovery/organize/use-cases/${record.id}`}
            className="text-[var(--primary)] text-xs hover:underline font-medium"
          >
            {record.name}
          </Link>
        ),
      },
      {
        key: 'personaCount',
        title: 'Personas',
        dataIndex: 'personaCount',
        width: 90,
        sorter: (a, b) => a.personaCount - b.personaCount,
        render: (value) => (
          <span className="text-xs tabular-nums">{value as number}</span>
        ),
      },
      {
        key: 'problemCount',
        title: 'Problems',
        dataIndex: 'problemCount',
        width: 90,
        sorter: (a, b) => a.problemCount - b.problemCount,
        render: (value) => (
          <span className="text-xs tabular-nums">{value as number}</span>
        ),
      },
      {
        key: 'suggestionCount',
        title: 'Suggestions',
        dataIndex: 'suggestionCount',
        width: 100,
        sorter: (a, b) => a.suggestionCount - b.suggestionCount,
        render: (value) => (
          <span className="text-xs tabular-nums">{value as number}</span>
        ),
      },
      {
        key: 'otherFeedbackCount',
        title: 'Other',
        dataIndex: 'otherFeedbackCount',
        width: 80,
        sorter: (a, b) => a.otherFeedbackCount - b.otherFeedbackCount,
        render: (value) => (
          <span className="text-xs tabular-nums">{value as number}</span>
        ),
      },
      {
        key: 'sourceCount',
        title: 'Sources',
        dataIndex: 'sourceCount',
        width: 80,
        sorter: (a, b) => a.sourceCount - b.sourceCount,
        render: (value) => (
          <span className="text-xs tabular-nums">{value as number}</span>
        ),
      },
      {
        key: 'evidenceScore',
        title: 'Evidence',
        dataIndex: 'evidenceScore',
        width: 140,
        sorter: (a, b) => a.evidenceScore - b.evidenceScore,
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums">{record.evidenceScore}</span>
            {record.isWeak && <Tag color="amber">Weak</Tag>}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <Table<UseCaseEvidenceRow>
      columns={columns}
      dataSource={rows}
      rowKey="id"
      loading={loading}
      pagination={rows.length > 20 ? { pageSize: 20 } : false}
      empty="No use cases found. Create use cases in the Organize view."
    />
  );
}
