/**
 * Supporting Quotes tab content component
 * Displays quotes from a use case in a table format
 */

import { useMemo } from 'react';
import { Table, Empty } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { QuoteRow } from './types';
import type { QuoteWithSource } from '~/core/entities/discovery/types/Quote';

export interface UseCaseSupportingQuotesProps {
  quotes: QuoteWithSource[];
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

export function UseCaseSupportingQuotes({ quotes }: UseCaseSupportingQuotesProps) {
  const quoteRows = useMemo((): QuoteRow[] => {
    if (!quotes || quotes.length === 0) return [];
    return quotes.map((quote) => ({
      id: quote.id,
      quote: quote.content,
      source: quote.sourceName ?? 'Unknown source',
    }));
  }, [quotes]);

  if (quoteRows.length === 0) {
    return <Empty image="simple" description="No supporting quotes" />;
  }

  return (
    <Table
      columns={quoteColumns}
      dataSource={quoteRows}
      rowKey="id"
      pagination={false}
    />
  );
}
