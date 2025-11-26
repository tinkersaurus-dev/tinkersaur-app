/**
 * FolderView Component
 * Displays compiled content from a folder and all its descendants
 */

import { Empty } from '~/core/components/ui';
import { useFolderContent } from '../hooks/useFolderContent';
import { useDesignWork } from '../hooks';
import { FolderEditor } from './folder';

interface FolderViewProps {
  folderId: string;
}

export function FolderView({ folderId }: FolderViewProps) {
  const folder = useDesignWork(folderId);
  const { content, loading, error } = useFolderContent(folderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading folder content...
      </div>
    );
  }

  if (error) {
    return <Empty description={`Error: ${error.message}`} className="bg-[var(--bg)]" />;
  }

  if (!folder) {
    return <Empty description="Folder not found" className="bg-[var(--bg)]" />;
  }

  return (
    <div className="bg-[var(--bg)] h-full">
      <FolderEditor content={content} height="100%" />
    </div>
  );
}
