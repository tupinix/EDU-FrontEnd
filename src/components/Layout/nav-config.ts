import {
  LayoutDashboard,
  Search,
  Radio,
  Users,
  Cable,
  Factory,
  Workflow,
  Bell,
  LayoutGrid,
  Key,
  Globe,
  Zap,
  type LucideIcon,
} from 'lucide-react';

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

// Standalone (no group): Home + Explorer
export const dashboardItem: NavItem = {
  path: '/',
  labelKey: 'sidebar.dashboard',
  icon: LayoutDashboard,
};

export const standaloneItems: NavItem[] = [
  { path: '/explorer', labelKey: 'sidebar.explorer', icon: Search },
];

// Groups in display order: Connections → Transformation → Analytics → AI Tools → System
export const navGroups: NavGroup[] = [
  {
    key: 'connections',
    labelKey: 'sidebar.groups.connections',
    items: [
      { path: '/neo4j',    labelKey: 'sidebar.neo4j', icon: Factory },
      { path: '/api-rest', labelKey: 'API REST',      icon: Globe },
      { path: '/i3x',      labelKey: 'i3X',           icon: Zap },
    ],
  },
  {
    key: 'transformation',
    labelKey: 'sidebar.groups.transformation',
    items: [
      { path: '/configuration', labelKey: 'sidebar.mqtt',        icon: Radio },
      { path: '/data-models',   labelKey: 'sidebar.dataModels', icon: Workflow },
    ],
  },
  {
    key: 'analytics',
    labelKey: 'sidebar.groups.analytics',
    items: [
      { path: '/alerts',  labelKey: 'sidebar.alerts',  icon: Bell },
      { path: '/process', labelKey: 'sidebar.process', icon: LayoutGrid },
    ],
  },
  {
    key: 'aiTools',
    labelKey: 'sidebar.groups.aiTools',
    items: [
      { path: '/connections', labelKey: 'sidebar.mcpServer', icon: Cable, adminOnly: true },
    ],
  },
  {
    key: 'system',
    labelKey: 'sidebar.groups.system',
    items: [
      { path: '/users',    labelKey: 'sidebar.users',    icon: Users, adminOnly: true },
      { path: '/licenses', labelKey: 'sidebar.licenses', icon: Key,   adminOnly: true },
    ],
  },
];

export function getNavGroups(): NavGroup[] {
  return navGroups;
}
