/**
 * PageContent Component
 * Consistent content wrapper with background and padding
 */

interface PageContentProps {
  children: React.ReactNode;
  /** When true, content fills available height (for dashboard-style layouts) */
  fillHeight?: boolean;
}

export function PageContent({ children, fillHeight = false }: PageContentProps) {
  return (
    <div
      className={fillHeight ? 'flex-1 min-h-0 flex flex-col' : 'flex-1 overflow-y-auto'}
      style={{
        padding: 'var(--spacing-page)',
      }}
    >
      <div
        className={fillHeight ? 'flex-1 min-h-0 flex flex-col' : ''}
        style={{
          maxWidth: 'var(--content-max-width)',
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {fillHeight ? (
          <div className="flex-1 min-h-0">{children}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
