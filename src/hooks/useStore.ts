import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ToastMessage, BrokerConfig } from '../types';

// ===========================================
// Auth Store
// ===========================================

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('edu_token', token);
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('edu_token');
        localStorage.removeItem('edu_refresh_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'edu-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ===========================================
// UI Store
// ===========================================

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      selectedTopic: null,
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'edu-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);

// ===========================================
// Explorer Store
// ===========================================

interface ExplorerStore {
  expandedNodes: Set<string>;
  toggleNode: (path: string) => void;
  expandNode: (path: string) => void;
  collapseNode: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useExplorerStore = create<ExplorerStore>()((set) => ({
  expandedNodes: new Set<string>(),
  toggleNode: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedNodes: newExpanded };
    }),
  expandNode: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      newExpanded.add(path);
      return { expandedNodes: newExpanded };
    }),
  collapseNode: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      newExpanded.delete(path);
      return { expandedNodes: newExpanded };
    }),
  expandAll: () => set({ expandedNodes: new Set<string>() }), // Implement with actual nodes
  collapseAll: () => set({ expandedNodes: new Set<string>() }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// ===========================================
// Broker Store
// ===========================================

interface BrokerStore {
  brokers: BrokerConfig[];
  activeBrokerId: string | null;
  addBroker: (broker: Omit<BrokerConfig, 'id' | 'status'>) => void;
  updateBroker: (id: string, broker: Partial<BrokerConfig>) => void;
  deleteBroker: (id: string) => void;
  setActiveBroker: (id: string) => void;
  getBrokerById: (id: string) => BrokerConfig | undefined;
  getActiveBroker: () => BrokerConfig | undefined;
}

// Default HiveMQ broker from environment
const defaultBroker: BrokerConfig = {
  id: 'hivemq-default',
  name: 'HiveMQ Cloud',
  host: '0e0601f6d61d476eb6a6ca29998a64f6.s1.eu.hivemq.cloud',
  port: 8883,
  username: 'tupinix',
  useTls: true,
  topics: ['Tupinix/#', 'FCC/#'],
  status: 'connected',
  isDefault: true,
};

export const useBrokerStore = create<BrokerStore>()(
  persist(
    (set, get) => ({
      brokers: [defaultBroker],
      activeBrokerId: 'hivemq-default',
      addBroker: (broker) =>
        set((state) => ({
          brokers: [
            ...state.brokers,
            {
              ...broker,
              id: `broker-${Date.now()}`,
              status: 'disconnected',
            },
          ],
        })),
      updateBroker: (id, updates) =>
        set((state) => ({
          brokers: state.brokers.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      deleteBroker: (id) =>
        set((state) => ({
          brokers: state.brokers.filter((b) => b.id !== id),
          activeBrokerId:
            state.activeBrokerId === id
              ? state.brokers.find((b) => b.id !== id)?.id || null
              : state.activeBrokerId,
        })),
      setActiveBroker: (id) => set({ activeBrokerId: id }),
      getBrokerById: (id) => get().brokers.find((b) => b.id === id),
      getActiveBroker: () => {
        const state = get();
        return state.brokers.find((b) => b.id === state.activeBrokerId);
      },
    }),
    {
      name: 'edu-brokers',
    }
  )
);
