import {
  LayoutDashboard,
  Search,
  Cpu,
  Network,
  Radio,
  Bell,
  Gauge,
  Zap,
  Bot,
  FileBarChart,
  Users,
  Cable,
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
      { path: '/explorer', labelKey: 'sidebar.explorer', icon: Search },
      { path: '/configuration', labelKey: 'sidebar.mqtt', icon: Radio },
      { path: '/modbus', labelKey: 'sidebar.modbus', icon: Cpu },
      { path: '/opcua', labelKey: 'sidebar.opcua', icon: Network },
    ],
  },
  {
    key: 'monitoring',
    labelKey: 'sidebar.groups.monitoring',
    items: [
      { path: '/alarms', labelKey: 'sidebar.alarms', icon: Bell },
      { path: '/oee', labelKey: 'sidebar.oee', icon: Gauge },
      { path: '/rules', labelKey: 'sidebar.rules', icon: Zap },
    ],
  },
  {
    key: 'intelligence',
    labelKey: 'sidebar.groups.intelligence',
    items: [
      { path: '/assistant', labelKey: 'sidebar.assistant', icon: Bot },
      { path: '/reports', labelKey: 'sidebar.reports', icon: FileBarChart },
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
