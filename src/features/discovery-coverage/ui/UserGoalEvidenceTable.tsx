import { useMemo } from 'react';
import { Link } from 'react-router';
import { Table, Tag } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import type { UserGoalEvidenceRow } from '../lib/useUserGoalEvidenceRows';

interface UserGoalEvidenceTableProps {
  rows: UserGoalEvidenceRow[];
  loading: boolean;
}

export function UserGoalEvidenceTable({ rows, loading }: UserGoalEvidenceTableProps) {
  const columns: TableColumn<UserGoalEvidenceRow>[] = useMemo(
    () => [
      {
        key: 'name',
        title: 'User Goal',
        dataIndex: 'name',
        render: (_, record) => (
          <Link
            to={`/discovery/organize/user-goals/${record.id}`}
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
        width: 80,
        sorter: (a, b) => a.personaCount - b.personaCount,
        render: (value) => (
          <span className="text-xs tabular-nums">{value as number}</span>
        ),
      },
      {
        key: 'problemCount',
        title: 'Problems',
        dataIndex: 'problemCount',
        width: 80,
        sorter: (a, b) => a.problemCount - b.problemCount,
        render: (value) => (
          <span className="text-xs tabular-nums">{value as number}</span>
        ),
      },
      {
        key: 'suggestionCount',
        title: 'Suggestions',
        dataIndex: 'suggestionCount',
        width: 80,
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
        title: 'Evidence Score',
        dataIndex: 'evidenceScore',
        width: 200,
        sorter: (a, b) => a.evidenceScore - b.evidenceScore,
        render: (_, record) => (
          <div className="flex items-center">
            <span className="text-xs tabular-nums flex-1 text-center">{record.evidenceScore}</span>
            {record.isWeak && <Tag color="amber">Weak</Tag>}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <Table<UserGoalEvidenceRow>
      columns={columns}
      dataSource={rows}
      rowKey="id"
      loading={loading}
      pagination={rows.length > 20 ? { pageSize: 20 } : false}
      empty="No user goals found. Create user goals in the Organize view."
    />
  );
}
