/**
 * PageHeader Component
 * Consistent page title and action buttons wrapper
 */

import { HStack } from '../Stack';

interface PageHeaderProps {
  titlePrefix?: string;
  title: string;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
}

export function PageHeader({ titlePrefix, title, actions, extra }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: 'var(--spacing-page)',
        paddingBottom: '0px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
          maxWidth: 'var(--content-max-width)',
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div>
          <h2 className="text-xl font-semibold m-0">
            <span color='red'>{titlePrefix}</span>{title}
          </h2>
          {extra && <div style={{ marginTop: '8px' }}>{extra}</div>}
        </div>
        {actions && <HStack gap="sm">{actions}</HStack>}
      </div>
    </div>
  );
}
