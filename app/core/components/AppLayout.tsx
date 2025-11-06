/**
 * AppLayout Component
 * Main application layout wrapper with header and content area
 */

import { Layout } from '~/core/components/ui';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Layout>
      <AppHeader />
      <Layout.Content className="p-0">
        {children}
      </Layout.Content>
    </Layout>
  );
}
