/**
 * MainLayout Component
 * Global layout wrapper with collapsible sidebar for all main pages
 */

import type { ReactNode } from 'react';
import { AppLayout } from './AppLayout';
import { Layout } from '~/core/components/ui';
import { GlobalSidebar } from './GlobalSidebar';
import { useSidebarUIStore } from '~/core/stores/sidebarUIStore';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_EXPANDED_WIDTH = 300;
const SIDEBAR_COLLAPSED_WIDTH = 48;

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebarUIStore();

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-88px)]">
        <Layout.Sider
          width={SIDEBAR_EXPANDED_WIDTH}
          collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
          collapsed={isCollapsed}
        >
          <GlobalSidebar />
        </Layout.Sider>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
      </div>
    </AppLayout>
  );
}
