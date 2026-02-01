/**
 * MainLayout Component
 * Global layout wrapper with collapsible sidebar for all main pages
 */

import type { ReactNode } from 'react';
import { AppLayout } from './AppLayout';
import { Layout } from '@/shared/ui';
import { GlobalSidebar } from '@/widgets/global-sidebar';
import { useSidebarUIStore } from '@/app/model/stores/sidebar-ui';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_WIDTH = 48;

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebarUIStore();

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-88px)]">
        <Layout.Sider
          width="var(--sidebar-width-expanded)"
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
