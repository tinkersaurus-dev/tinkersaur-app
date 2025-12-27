/**
 * Design Studio Route
 * Main design studio page with sidebar tree and tabbed content area
 * Lazy loading architecture: only loads DesignWorks (metadata) upfront,
 * content is loaded on-demand when user opens it
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MainLayout } from '~/core/components/MainLayout';
import { Layout, Tabs } from '~/core/components/ui';
import { useDesignStudioUIStore } from '../store';
import { useDesignWorks } from '../hooks';
import { useSolutionQuery } from '~/product-management/queries';
import { useSolutionStore } from '~/core/solution';
import { StudioSidebar } from '../components/sidebar';
import { OverviewTab } from '../components/OverviewTab';
import { DiagramView } from '../components/DiagramView';
import { InterfaceView } from '../components/InterfaceView';
import { DocumentView } from '../components/DocumentView';
import { FolderView } from '../components/FolderView';

export default function StudioPage() {
  const { solutionId } = useParams();
  const navigate = useNavigate();
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Use TanStack Query for solution data
  const { data: solution, isLoading: loadingSolution, isError } = useSolutionQuery(solutionId);

  // Use UI store for tab management
  const { activeTabs, activeTabId, setActiveTab, closeTab, initializeTabs } =
    useDesignStudioUIStore();

  // Only fetch DesignWorks metadata (tree structure with content references)
  // Individual content items are lazy loaded when opened
  const { loading: loadingDesignWorks } = useDesignWorks(solutionId || '');

  // Initialize tabs when component mounts
  useEffect(() => {
    if (solutionId) {
      initializeTabs(solutionId);
    }
  }, [solutionId, initializeTabs]);

  // Redirect to new solution when selected solution changes
  useEffect(() => {
    if (selectedSolution?.solutionId && selectedSolution.solutionId !== solutionId) {
      navigate(`/solution/design/${selectedSolution.solutionId}`, { replace: true });
    }
  }, [selectedSolution?.solutionId, solutionId, navigate]);

  if (loadingSolution || loadingDesignWorks) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-[var(--text-muted)]">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (isError || !solution) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-[var(--text-muted)]">Solution not found (id: {solutionId})</div>
        </div>
      </MainLayout>
    );
  }

  const renderTabContent = (type: string, contentId?: string) => {
    if (type === 'overview') {
      return <OverviewTab solutionId={solutionId || ''} />;
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
    <MainLayout>
      {/* Studio content area - full height within MainLayout's content slot */}
      <div className="flex h-full">
        {/* StudioSidebar with Tree - inside the main content area */}
        <Layout.Sider width={200} className="bg-[var(--surface)] border-r border-[var(--border)]">
          <StudioSidebar solutionId={solutionId || ''} />
        </Layout.Sider>

        {/* Main content area with tabs */}
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
    </MainLayout>
  );
}
