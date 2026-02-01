import { Layout as LayoutBase } from './Layout';
import { LayoutHeader } from './Header';
import { LayoutSider } from './Sider';
import { LayoutContent } from './Content';

export type { LayoutProps } from './Layout';
export type { LayoutHeaderProps } from './Header';
export type { LayoutSiderProps } from './Sider';
export type { LayoutContentProps } from './Content';

// Create compound component
export const Layout = Object.assign(LayoutBase, {
  Header: LayoutHeader,
  Sider: LayoutSider,
  Content: LayoutContent,
});
