import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';

export interface BreadcrumbItemType {
  title: ReactNode;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItemType[];
  separator?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Breadcrumb({
  items,
  separator = '/',
  className = '',
  style,
}: BreadcrumbProps) {
  const classes = ['flex', 'items-center', 'gap-2', 'text-sm', className]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={classes} style={style} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                >
                  {item.title}
                </Link>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 ${
                    isLast
                      ? 'text-[var(--text)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {item.title}
                </span>
              )}
              {!isLast && (
                <span className="text-[var(--text-muted)]">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
