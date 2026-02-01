/**
 * MainLayout Component
 * Full-height layout with collapsible sidebar and main content area
 */

import type { ReactNode } from 'react';
import { Layout } from '@/shared/ui';
import { GlobalSidebar } from '@/widgets/global-sidebar';
import { ContextualSubHeader } from '@/app/ui/ContextualSubHeader';
import { useSidebarUIStore } from '@/app/model/stores/sidebar-ui';

interface MainLayoutProps {
  children: ReactNode;
}

// Module bar width (always visible inside sidebar)
const MODULE_BAR_WIDTH = 48;

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebarUIStore();

  return (
    <Layout>
      <div className="flex h-screen">
        {/* Sidebar Panel - contains ModuleBar and content sections */}
        <Layout.Sider
          width="var(--sidebar-width-expanded)"
          collapsedWidth={MODULE_BAR_WIDTH}
          collapsed={isCollapsed}
        >
          <GlobalSidebar />
        </Layout.Sider>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ContextualSubHeader />
          <Layout.Content className="p-0 flex-1 overflow-hidden">
            {children}
          </Layout.Content>
        </div>
      </div>
    </Layout>
  );
}
