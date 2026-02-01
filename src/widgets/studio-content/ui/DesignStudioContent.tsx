/**
 * DesignStudioContent Component
 * Shared component that renders the core design studio layout (sidebar + tabs).
 * Can be used standalone in the design studio route or embedded in other views.
 */

import { useEffect } from 'react';
import { Layout, Tabs } from '@/shared/ui';
import { useDesignStudioUIStore } from '@/app/model/stores';
import { canvasInstanceRegistry } from '@/app/model/stores/canvas';
import { useDesignWorksForContext } from '@/features/diagram-management';
import { StudioSidebar } from '@/widgets/studio-sidebar';
import {
  DiagramView,
  InterfaceView,
  DocumentView,
  FolderView,
} from '@/features/diagram-management/ui/views';
import { OverviewTab } from '@/features/diagram-management/ui/overview';

interface DesignStudioContentProps {
  solutionId: string;
  useCaseId?: string;
  className?: string;
}

export function DesignStudioContent({ solutionId, useCaseId, className }: DesignStudioContentProps) {

  const { activeTabs, activeTabId, setActiveTab, closeTab, initializeTabs } =
    useDesignStudioUIStore();

  const { loading } = useDesignWorksForContext({ solutionId, useCaseId });

  // Initialize tabs and clean up canvas stores
  useEffect(() => {
    if (solutionId) {
      canvasInstanceRegistry.clearAll();
      initializeTabs(solutionId);
    }
  }, [solutionId, initializeTabs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const renderTabContent = (type: string, contentId?: string) => {
    if (type === 'overview') {
      return <OverviewTab solutionId={solutionId} useCaseId={useCaseId} />;
    }

    if (!contentId) return null;

    switch (type) {
      case 'diagram':
        return <DiagramView diagramId={contentId} />;
      case 'interface':
        return <InterfaceView interfaceId={contentId} />;
      case 'document':
        return <DocumentView documentId={contentId} />;
      case 'folder-view':
        return <FolderView folderId={contentId} />;
      default:
        return <div>Unknown content type</div>;
    }
  };

  const tabItems = activeTabs.map((tab) => ({
    key: tab.id,
    label: tab.title,
    children: renderTabContent(tab.type, tab.contentId),
    closable: tab.closable,
  }));

  return (
    <div className={`flex h-full ${className || ''}`}>
      <Layout.Sider width={200} className="bg-[var(--surface)] border-r border-[var(--border)]">
        <StudioSidebar solutionId={solutionId} useCaseId={useCaseId} />
      </Layout.Sider>

      <div className="flex-1 bg-[var(--bg)] overflow-hidden">
        <Tabs
          type="editable-card"
          activeKey={activeTabId}
          onChange={setActiveTab}
          onEdit={(targetKey, action) => {
            if (action === 'remove') {
              closeTab(targetKey as string);
            }
          }}
          items={tabItems}
          hideAdd
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
