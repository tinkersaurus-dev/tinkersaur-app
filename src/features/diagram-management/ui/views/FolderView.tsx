/**
 * FolderView Component
 * Displays compiled content from a folder and all its descendants
 */

import { Empty } from '@/shared/ui';
import { useFolderContent } from '@/features/diagram-management';
import { useDesignWork } from '@/features/diagram-management';
import { FolderEditor } from '@/features/llm-generation/ui/folder-view';

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
