import {
  LayoutDashboard,
  Search,
  Cpu,
  CircuitBoard,
  Network,
  Radio,
  Radar,
  Users,
  Cable,
  Factory,
  Workflow,
  Bell,
  LayoutGrid,
  Key,
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
      { path: '/network-scan', labelKey: 'sidebar.networkScan', icon: Radar },
      { path: '/modbus',       labelKey: 'sidebar.modbus',      icon: Cpu },
      { path: '/opcua',        labelKey: 'sidebar.opcua',       icon: Network },
      { path: '/ethip',        labelKey: 'sidebar.ethip',       icon: CircuitBoard },
      // Neo4j is Cloud-only; the edition filter hides it on Edge automatically
      { path: '/neo4j',        labelKey: 'sidebar.neo4j',       icon: Factory },
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

export function getNavGroups(mode: EditionMode): NavGroup[] {
  const allowed = new Set(editionPages[mode]);
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.has(item.path)),
    }))
    .filter((group) => group.items.length > 0);
}
