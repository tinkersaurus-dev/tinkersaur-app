/**
 * AppLayout Component
 * Main application layout wrapper with header and content area
 */

import { Layout } from '@/shared/ui';
import { AppHeader } from '@/app/ui/AppHeader';
import { ContextualSubHeader } from '@/app/ui/ContextualSubHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Layout>
      <AppHeader />
      <ContextualSubHeader />
      <Layout.Content className="p-0">
        {children}
      </Layout.Content>
    </Layout>
  );
}
