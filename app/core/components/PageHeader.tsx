/**
 * PageHeader Component
 * Consistent page title and action buttons wrapper
 */

import { HStack } from '~/core/components/ui';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
}

export function PageHeader({ title, actions, extra }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}
    >
      <div>
        <h2 className="text-2xl font-semibold m-0">
          {title}
        </h2>
        {extra && <div style={{ marginTop: '8px' }}>{extra}</div>}
      </div>
      {actions && <HStack gap="sm">{actions}</HStack>}
    </div>
  );
}
