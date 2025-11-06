/**
 * PageContent Component
 * Consistent content wrapper with background and padding
 */

interface PageContentProps {
  children: React.ReactNode;
}

export function PageContent({ children }: PageContentProps) {
  return (
    <div
      style={{
        
        padding: '24px',

      }}
    >
      {children}
    </div>
  );
}
