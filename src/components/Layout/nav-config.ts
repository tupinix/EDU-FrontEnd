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
  Building2,
  DatabaseBackup,
  Server,
  Cpu,
  Network,
  Send,
  Wrench,
  Activity,
  Sigma,
  Radar,
  Sparkles,
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
      { path: '/network-scan', labelKey: 'sidebar.networkScan', icon: Radar },
      { path: '/opcua',      labelKey: 'sidebar.opcua',  icon: Server },
      { path: '/modbus',     labelKey: 'sidebar.modbus', icon: Cpu },
      { path: '/ethernetip', labelKey: 'sidebar.ethip',  icon: Network },
      { path: '/kafka',      labelKey: 'sidebar.kafka',  icon: Send },
      { path: '/neo4j',      labelKey: 'sidebar.neo4j',  icon: Factory },
    ],
  },
  {
    key: 'integrations',
    labelKey: 'sidebar.groups.integrations',
    items: [
      { path: '/southbound', labelKey: 'sidebar.southbound', icon: Wrench },
      { path: '/api-rest',   labelKey: 'API REST',           icon: Globe },
      { path: '/i3x',      labelKey: 'i3X',           icon: Zap },
    ],
  },
  {
    key: 'transformation',
    labelKey: 'sidebar.groups.transformation',
    items: [
      { path: '/configuration',    labelKey: 'sidebar.mqtt',        icon: Radio },
      { path: '/data-models',      labelKey: 'sidebar.dataModels',  icon: Workflow },
      { path: '/virtual-sensors',  labelKey: 'sidebar.virtualSensors',   icon: Sigma },
    ],
  },
  {
    key: 'analytics',
    labelKey: 'sidebar.groups.analytics',
    items: [
      { path: '/events',  labelKey: 'sidebar.events',        icon: Activity },
      { path: '/alerts',  labelKey: 'sidebar.alerts',  icon: Bell },
      { path: '/process', labelKey: 'sidebar.process', icon: LayoutGrid },
    ],
  },
  {
    key: 'aiTools',
    labelKey: 'sidebar.groups.aiTools',
    items: [
      { path: '/comando', labelKey: 'AI Bot', icon: Sparkles },
      { path: '/connections', labelKey: 'sidebar.mcpServer', icon: Cable, adminOnly: true },
    ],
  },
  {
    key: 'system',
    labelKey: 'sidebar.groups.system',
    items: [
      { path: '/users',         labelKey: 'sidebar.users',     icon: Users,     adminOnly: true },
      { path: '/organizations', labelKey: 'Organizations',     icon: Building2, adminOnly: true },
      { path: '/licenses',        labelKey: 'sidebar.licenses',       icon: Key,            adminOnly: true },
      { path: '/config-transfer', labelKey: 'sidebar.configTransfer', icon: DatabaseBackup, adminOnly: true },
    ],
  },
];

export function getNavGroups(): NavGroup[] {
  return navGroups;
}
