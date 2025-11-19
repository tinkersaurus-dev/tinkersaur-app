/**
 * Design Studio Route
 * Main design studio page with sidebar tree and tabbed content area
 * Lazy loading architecture: only loads DesignWorks (metadata) upfront,
 * content is loaded on-demand when user opens it
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AppLayout } from '~/core/components';
import { Layout, Tabs } from '~/core/components/ui';
import { useDesignStudioUIStore } from '../store';
import { useDesignWorks } from '../hooks';
import { useSolutionStore } from '~/core/entities/product-management';
import type { Solution } from '~/core/entities/product-management';
import { StudioSidebar } from '../components/StudioSidebar';
import { OverviewTab } from '../components/OverviewTab';
import { DiagramView } from '../components/DiagramView';
import { InterfaceView } from '../components/InterfaceView';
import { DocumentView } from '../components/DocumentView';

export default function StudioPage() {
  const { solutionId } = useParams();
  const fetchSolution = useSolutionStore((state) => state.fetchSolution);
  const [solution, setSolution] = useState<Solution | null>(null);

  // Use UI store for tab management
  const { activeTabs, activeTabId, setActiveTab, closeTab, initializeTabs } = useDesignStudioUIStore();

  // Only fetch DesignWorks metadata (tree structure with content references)
  // Individual content items are lazy loaded when opened
  const { loading: loadingDesignWorks } = useDesignWorks(solutionId || '');

  // Fetch solution and initialize tabs when component mounts
  useEffect(() => {
    if (solutionId) {
      fetchSolution(solutionId).then((s) => {
        setSolution(s);
      });
      initializeTabs(solutionId);
    }
  }, [solutionId, fetchSolution, initializeTabs]);

  if (!solution) {
    return (
      <AppLayout>
        <div style={{ padding: '24px' }}>
          {loadingDesignWorks ? 'Loading...' : `Solution not found (id: ${solutionId})`}
        </div>
      </AppLayout>
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
    <AppLayout>
      <div className="flex h-[calc(100vh-48px)]">
        {/* Sidebar with Tree */}
        <Layout.Sider width={200} className="bg-gray-50">
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
    </AppLayout>
  );
}
