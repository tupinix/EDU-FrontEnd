import {
  LayoutDashboard,
  Search,
  Cpu,
  Network,
  Radio,
  Users,
  Cable,
  Factory,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import { editionPages, type EditionMode } from '../../config/edition';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavGroup {
  key: string;
  labelKey: string;
  items: NavItem[];
}

export const dashboardItem: NavItem = {
  path: '/',
  labelKey: 'sidebar.dashboard',
  icon: LayoutDashboard,
};

export const navGroups: NavGroup[] = [
  {
    key: 'protocols',
    labelKey: 'sidebar.groups.protocols',
    items: [
      { path: '/neo4j', labelKey: 'sidebar.neo4j', icon: Factory },
      { path: '/explorer', labelKey: 'sidebar.explorer', icon: Search },
      { path: '/configuration', labelKey: 'sidebar.mqtt', icon: Radio },
      { path: '/modbus', labelKey: 'sidebar.modbus', icon: Cpu },
      { path: '/opcua', labelKey: 'sidebar.opcua', icon: Network },
      { path: '/ignition', labelKey: 'sidebar.ignition', icon: Monitor },
    ],
  },
  {
    key: 'system',
    labelKey: 'sidebar.groups.system',
    items: [
      { path: '/connections', labelKey: 'sidebar.connections', icon: Cable, adminOnly: true },
      { path: '/users', labelKey: 'sidebar.users', icon: Users, adminOnly: true },
    ],
  },
];

export function getNavGroups(mode: EditionMode): NavGroup[] {
  const allowed = new Set(editionPages[mode]);
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.has(item.path)),
    }))
    .filter((group) => group.items.length > 0);
}
