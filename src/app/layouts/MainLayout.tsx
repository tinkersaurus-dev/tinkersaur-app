/**
 * MainLayout Component
 * Full-height layout with collapsible sidebar and main content area
 * Used as a layout route - renders child routes via Outlet
 */

import { Outlet } from 'react-router';
import { Layout } from '@/shared/ui';
import { GlobalSidebar } from '@/widgets/global-sidebar';
import { ContextualSubHeader } from '@/widgets/contextual-sub-header';
import { useSidebarUIStore } from '@/app/model/stores/sidebar-ui';

// Collapsed sidebar width (just enough for expand icon)
const SIDEBAR_COLLAPSED_WIDTH = 48;

export default function MainLayout() {
  const { isCollapsed } = useSidebarUIStore();

  return (
    <Layout>
      <div className="flex h-screen">
        {/* Sidebar Panel - contains ModuleBar and content sections */}
        <Layout.Sider
          width="var(--sidebar-width-expanded)"
          collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
          collapsed={isCollapsed}
        >
          <GlobalSidebar />
        </Layout.Sider>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ContextualSubHeader />
          <Layout.Content className="p-0 flex-1 overflow-hidden">
            <Outlet />
          </Layout.Content>
        </div>
      </div>
    </Layout>
  );
}
