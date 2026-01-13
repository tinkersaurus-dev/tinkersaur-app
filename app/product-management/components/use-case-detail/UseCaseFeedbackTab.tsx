/**
 * Feedback tab content component
 * Displays suggestions or problems in a table format
 */

import { Table, Empty } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { FeedbackRow } from './types';

export interface UseCaseFeedbackTabProps {
  feedbackRows: FeedbackRow[];
  emptyDescription: string;
}

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
    key: 'quotes',
    title: 'Quotes',
    dataIndex: 'quotes',
    render: (value) => {
      const quotes = value as string[];
      if (quotes.length === 0) {
        return <span className="text-sm text-[var(--text-muted)]">—</span>;
      }
      return (
        <div className="space-y-1">
          {quotes.map((quote, i) => (
            <span
              key={i}
              className="text-xs text-[var(--text-muted)] italic"
            >
              "{quote}"
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

export function UseCaseFeedbackTab({ feedbackRows, emptyDescription }: UseCaseFeedbackTabProps) {
  if (feedbackRows.length === 0) {
    return <Empty image="simple" description={emptyDescription} />;
  }

  return (
    <Table
      columns={feedbackColumns}
      dataSource={feedbackRows}
      rowKey="id"
      pagination={false}
    />
  );
}
