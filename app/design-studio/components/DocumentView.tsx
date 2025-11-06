/**
 * DocumentView Component
 * Displays markdown document content (read-only for now)
 */

import ReactMarkdown from 'react-markdown';
import { Card, Empty } from '~/core/components/ui';
import { useDocument } from '../hooks';

interface DocumentViewProps {
  documentId: string;
}

export function DocumentView({ documentId }: DocumentViewProps) {
  const document = useDocument(documentId);

  if (!document) {
    return <Empty description="Document not found" className='bg-[var(--bg)]'/>;
  }

  return (
    <div className='bg-[var(--bg)]' style={{ padding: '24px' }}>
      <Card title={document.name}>
        <div style={{ padding: '16px' }}>
          <ReactMarkdown>{document.content}</ReactMarkdown>
        </div>
      </Card>
    </div>
  );
}
