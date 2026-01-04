import type { ReactNode } from 'react';

export type SortDirection = 'ascend' | 'descend' | null;

export interface TableColumn<T> {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T;
  width?: number | string;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  sortDirections?: SortDirection[];
}

export interface TablePaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onChange?: (page: number, pageSize: number) => void;
}

export interface TableRowConfig<T> {
  onClick?: (record: T) => void;
  onDoubleClick?: (record: T) => void;
  className?: string;
}

export interface TableHeaderConfig {
  title: ReactNode;
  actions?: ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string);
  pagination?: false | TablePaginationConfig;
  loading?: boolean;
  empty?: ReactNode;
  className?: string;
  onRow?: (record: T) => TableRowConfig<T>;
  header?: TableHeaderConfig;
}
