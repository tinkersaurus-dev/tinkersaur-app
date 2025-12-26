/**
 * MainLayout Component
 * Global layout wrapper with sidebar for all main pages
 */

import type { ReactNode } from 'react';
import { AppLayout } from './AppLayout';
import { Layout } from '~/core/components/ui';
import { GlobalSidebar } from './GlobalSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-88px)]">
        <Layout.Sider width={300}>
          <GlobalSidebar />
        </Layout.Sider>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
