import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ToastMessage, BrokerConfig } from '../types';
import type { EditionMode } from '../config/edition';

// ===========================================
// Auth Store
// ===========================================

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  editionMode: EditionMode;
  setEditionMode: (mode: EditionMode) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      editionMode: 'standard',
      setEditionMode: (mode) => set({ editionMode: mode }),
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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        editionMode: state.editionMode,
      }),
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
  sidebarGroupsOpen: Record<string, boolean>;
  toggleSidebarGroup: (key: string) => void;
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
      sidebarGroupsOpen: { protocols: true, monitoring: true, intelligence: true, system: true },
      toggleSidebarGroup: (key) =>
        set((state) => ({
          sidebarGroupsOpen: {
            ...state.sidebarGroupsOpen,
            [key]: !state.sidebarGroupsOpen[key],
          },
        })),
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
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarGroupsOpen: state.sidebarGroupsOpen,
      }),
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

// Brokers are loaded from the backend API — no hardcoded defaults
export const useBrokerStore = create<BrokerStore>()(
  persist(
    (set, get) => ({
      brokers: [],
      activeBrokerId: null,
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
