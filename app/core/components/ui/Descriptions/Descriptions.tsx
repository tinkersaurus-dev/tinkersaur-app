/**
 * Descriptions Component
 * Display read-only structured information in a table-like format
 */

import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { DescriptionsItem } from './DescriptionsItem';

export interface DescriptionsItemType {
  key?: string | number;
  label?: ReactNode;
  children?: ReactNode;
  span?: number;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

export interface DescriptionsProps {
  // Visual Appearance
  title?: ReactNode;
  bordered?: boolean;
  size?: 'small' | 'medium' | 'large';

  // Layout
  column?: number;
  layout?: 'horizontal' | 'vertical';
  colon?: boolean;

  // Styling
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;

  // Data - Support both approaches
  items?: DescriptionsItemType[];
  children?: ReactNode;
}

export interface DescriptionsItemProps {
  label?: ReactNode;
  span?: number;
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: ReactNode;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Descriptions({
  title,
  bordered = false,
  size = 'small',
  column = 3,
  layout = 'horizontal',
  colon = true,
  className = '',
  style,
  labelStyle,
  contentStyle,
  items,
  children,
}: DescriptionsProps) {
  // Convert children to items array for unified processing
  const itemsList: DescriptionsItemType[] = items ? [...items] : [];

  if (!items && children) {
    Children.forEach(children, (child, index) => {
      if (isValidElement<DescriptionsItemProps>(child) && child.type === DescriptionsItem) {
        itemsList.push({
          key: child.key || index,
          label: child.props.label,
          span: child.props.span,
          children: child.props.children,
          labelStyle: child.props.labelStyle,
          contentStyle: child.props.contentStyle,
        });
      }
    });
  }

  // Size-based padding classes
  const sizeMap = {
    small: 'py-1.5 px-2',
    medium: 'py-2 px-3',
    large: 'py-3 px-4',
  };

  const cellPadding = sizeMap[size];

  // Build rows from items based on column count
  const rows: DescriptionsItemType[][] = [];
  let currentRow: DescriptionsItemType[] = [];
  let currentSpan = 0;

  itemsList.forEach((item) => {
    const span = item.span || 1;

    if (currentSpan + span > column) {
      // Start new row
      rows.push(currentRow);
      currentRow = [item];
      currentSpan = span;
    } else {
      currentRow.push(item);
      currentSpan += span;
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Base styles
  const containerClassName = cn(
    'w-full',
    bordered && 'border border-[var(--border-muted)] rounded-sm',
    className
  );

  const tableClassName = 'w-full border-collapse';

  return (
    <div className={containerClassName} style={style}>
      {title && (
        <div
          className={cn(
            cellPadding,
            'text-xs bg-[var(--bg)] border-b border-[var(--border-muted)] font-semibold text-[var(--text)]'
          )}
        >
          {title}
        </div>
      )}

      <table className={tableClassName}>
        <tbody>
          {rows.map((row, rowIndex) => {
            if (layout === 'horizontal') {
              // Horizontal: label and content side by side
              return (
                <tr key={rowIndex}>
                  {row.map((item, itemIndex) => {
                    const itemSpan = item.span || 1;
                    // In horizontal layout, each logical column has 2 table columns (label + content)
                    // So if item spans N columns, the content cell should span N*2 - 1
                    // (N*2 total columns minus the 1 label column)
                    const contentColSpan = itemSpan > 1 ? itemSpan * 2 - 1 : 1;

                    return (
                      <Fragment key={item.key}>
                        <th
                          className={cn(
                            cellPadding,
                            'text-xs text-left font-medium text-[var(--text)] bg-[var(--bg-muted)]',
                            bordered && 'border-b border-r border-[var(--border-muted)]'
                          )}
                          style={{ ...labelStyle, ...item.labelStyle }}
                        >
                          {item.label}
                          {colon && item.label && ':'}
                        </th>
                        <td
                          colSpan={contentColSpan}
                          className={cn(
                            cellPadding,
                            'text-xs text-[var(--text)] bg-[var(--bg-light)]',
                            bordered && 'border-b border-r border-[var(--border-muted)]'
                          )}
                          style={{ ...contentStyle, ...item.contentStyle }}
                        >
                          {item.children}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              );
            } else {
              // Vertical: label on top, content below
              return (
                <>
                  <tr key={`labels-${rowIndex}`}>
                    {row.map((item, itemIndex) => {
                      const itemSpan = item.span || 1;
                      return (
                        <th
                          key={item.key}
                          colSpan={itemSpan}
                          className={cn(
                            cellPadding,
                            'text-xs text-left font-medium text-[var(--text)] bg-[var(--bg-muted)]',
                            bordered && 'border-b border-r border-[var(--border-muted)]'
                          )}
                          style={{ ...labelStyle, ...item.labelStyle }}
                        >
                          {item.label}
                          {colon && item.label && ':'}
                        </th>
                      );
                    })}
                  </tr>
                  <tr key={`contents-${rowIndex}`}>
                    {row.map((item, itemIndex) => {
                      const itemSpan = item.span || 1;
                      return (
                        <td
                          key={item.key}
                          colSpan={itemSpan}
                          className={cn(
                            cellPadding,
                            'text-xs text-[var(--text)] bg-[var(--bg-light)]',
                            bordered && 'border-b border-r border-[var(--border-muted)]'
                          )}
                          style={{ ...contentStyle, ...item.contentStyle }}
                        >
                          {item.children}
                        </td>
                      );
                    })}
                  </tr>
                </>
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
}

// Attach Item component for JSX usage
Descriptions.Item = DescriptionsItem;
