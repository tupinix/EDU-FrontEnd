import { act } from '@testing-library/react';
import { useAuthStore, useUIStore, useExplorerStore, useBrokerStore } from '../hooks/useStore';

// Reset zustand stores between tests
beforeEach(() => {
  // Reset all stores to initial state
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  useUIStore.setState({
    sidebarCollapsed: false,
    selectedTopic: null,
    toasts: [],
  });
  useExplorerStore.setState({
    expandedNodes: new Set<string>(),
    searchQuery: '',
  });
  useBrokerStore.setState({
    brokers: [{
      id: 'hivemq-default',
      name: 'HiveMQ Cloud',
      host: '0e0601f6d61d476eb6a6ca29998a64f6.s1.eu.hivemq.cloud',
      port: 8883,
      username: 'tupinix',
      useTls: true,
      topics: ['Tupinix/#', 'FCC/#'],
      status: 'connected',
      isDefault: true,
    }],
    activeBrokerId: 'hivemq-default',
  });
});

// ============================================================
// Auth Store
// ============================================================
describe('useAuthStore', () => {
  it('should start with no user and not authenticated', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set user and token on setAuth', () => {
    const mockUser = {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin' as const,
      status: 'active' as const,
    };

    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'test-token-123');
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('test-token-123');
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('edu_token')).toBe('test-token-123');
  });

  it('should clear user and token on clearAuth', () => {
    // First set auth
    const mockUser = {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'test@example.com',
      role: 'admin' as const,
      status: 'active' as const,
    };

    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'test-token-123');
    });

    // Then clear
    act(() => {
      useAuthStore.getState().clearAuth();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('edu_token')).toBeNull();
  });
});

// ============================================================
// UI Store
// ============================================================
describe('useUIStore', () => {
  it('should start with sidebar expanded', () => {
    const state = useUIStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
  });

  it('should toggle sidebar', () => {
    act(() => {
      useUIStore.getState().toggleSidebar();
    });
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    act(() => {
      useUIStore.getState().toggleSidebar();
    });
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('should set sidebar collapsed explicitly', () => {
    act(() => {
      useUIStore.getState().setSidebarCollapsed(true);
    });
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it('should set selected topic', () => {
    act(() => {
      useUIStore.getState().setSelectedTopic('factory/line1/temp');
    });
    expect(useUIStore.getState().selectedTopic).toBe('factory/line1/temp');

    act(() => {
      useUIStore.getState().setSelectedTopic(null);
    });
    expect(useUIStore.getState().selectedTopic).toBeNull();
  });

  it('should add and remove toasts', () => {
    act(() => {
      useUIStore.getState().addToast({
        type: 'success',
        title: 'Broker connected',
        message: 'Connected successfully',
      });
    });

    const toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].title).toBe('Broker connected');
    expect(toasts[0].id).toBeDefined();

    // Remove
    act(() => {
      useUIStore.getState().removeToast(toasts[0].id);
    });
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('should add multiple toasts', () => {
    act(() => {
      useUIStore.getState().addToast({ type: 'success', title: 'Toast 1' });
      useUIStore.getState().addToast({ type: 'error', title: 'Toast 2' });
      useUIStore.getState().addToast({ type: 'warning', title: 'Toast 3' });
    });

    expect(useUIStore.getState().toasts).toHaveLength(3);
  });
});

// ============================================================
// Explorer Store
// ============================================================
describe('useExplorerStore', () => {
  it('should start with no expanded nodes', () => {
    const state = useExplorerStore.getState();
    expect(state.expandedNodes.size).toBe(0);
    expect(state.searchQuery).toBe('');
  });

  it('should toggle node expansion', () => {
    act(() => {
      useExplorerStore.getState().toggleNode('factory');
    });
    expect(useExplorerStore.getState().expandedNodes.has('factory')).toBe(true);

    act(() => {
      useExplorerStore.getState().toggleNode('factory');
    });
    expect(useExplorerStore.getState().expandedNodes.has('factory')).toBe(false);
  });

  it('should expand and collapse individual nodes', () => {
    act(() => {
      useExplorerStore.getState().expandNode('factory');
      useExplorerStore.getState().expandNode('factory/line1');
    });

    expect(useExplorerStore.getState().expandedNodes.has('factory')).toBe(true);
    expect(useExplorerStore.getState().expandedNodes.has('factory/line1')).toBe(true);

    act(() => {
      useExplorerStore.getState().collapseNode('factory');
    });

    expect(useExplorerStore.getState().expandedNodes.has('factory')).toBe(false);
    expect(useExplorerStore.getState().expandedNodes.has('factory/line1')).toBe(true);
  });

  it('should collapse all nodes', () => {
    act(() => {
      useExplorerStore.getState().expandNode('a');
      useExplorerStore.getState().expandNode('b');
      useExplorerStore.getState().expandNode('c');
    });
    expect(useExplorerStore.getState().expandedNodes.size).toBe(3);

    act(() => {
      useExplorerStore.getState().collapseAll();
    });
    expect(useExplorerStore.getState().expandedNodes.size).toBe(0);
  });

  it('should set search query', () => {
    act(() => {
      useExplorerStore.getState().setSearchQuery('temperature');
    });
    expect(useExplorerStore.getState().searchQuery).toBe('temperature');
  });
});

// ============================================================
// Broker Store
// ============================================================
describe('useBrokerStore', () => {
  it('should start with default HiveMQ broker', () => {
    const state = useBrokerStore.getState();
    expect(state.brokers).toHaveLength(1);
    expect(state.brokers[0].id).toBe('hivemq-default');
    expect(state.brokers[0].name).toBe('HiveMQ Cloud');
    expect(state.brokers[0].isDefault).toBe(true);
    expect(state.activeBrokerId).toBe('hivemq-default');
  });

  it('should add a new broker', () => {
    act(() => {
      useBrokerStore.getState().addBroker({
        name: 'Local Mosquitto',
        host: 'localhost',
        port: 1883,
        useTls: false,
        topics: ['test/#'],
      });
    });

    const brokers = useBrokerStore.getState().brokers;
    expect(brokers).toHaveLength(2);
    expect(brokers[1].name).toBe('Local Mosquitto');
    expect(brokers[1].status).toBe('disconnected');
    expect(brokers[1].id).toContain('broker-');
  });

  it('should update a broker', () => {
    act(() => {
      useBrokerStore.getState().updateBroker('hivemq-default', {
        name: 'Updated HiveMQ',
      });
    });

    const broker = useBrokerStore.getState().getBrokerById('hivemq-default');
    expect(broker?.name).toBe('Updated HiveMQ');
  });

  it('should delete a non-default broker', () => {
    act(() => {
      useBrokerStore.getState().addBroker({
        name: 'Deletable',
        host: 'test.com',
        port: 1883,
        useTls: false,
        topics: ['#'],
      });
    });

    const brokerId = useBrokerStore.getState().brokers[1].id;

    act(() => {
      useBrokerStore.getState().deleteBroker(brokerId);
    });

    expect(useBrokerStore.getState().brokers).toHaveLength(1);
  });

  it('should switch active broker fallback on delete', () => {
    act(() => {
      useBrokerStore.getState().addBroker({
        name: 'Secondary',
        host: 'secondary.com',
        port: 1883,
        useTls: false,
        topics: ['#'],
      });
    });

    const secondId = useBrokerStore.getState().brokers[1].id;

    // Set secondary as active
    act(() => {
      useBrokerStore.getState().setActiveBroker(secondId);
    });
    expect(useBrokerStore.getState().activeBrokerId).toBe(secondId);

    // Delete the active broker
    act(() => {
      useBrokerStore.getState().deleteBroker(secondId);
    });

    // Should fallback to remaining broker
    expect(useBrokerStore.getState().activeBrokerId).toBe('hivemq-default');
  });

  it('should get active broker', () => {
    const activeBroker = useBrokerStore.getState().getActiveBroker();
    expect(activeBroker).toBeDefined();
    expect(activeBroker?.id).toBe('hivemq-default');
  });

  it('should return undefined for non-existent broker', () => {
    const broker = useBrokerStore.getState().getBrokerById('non-existent');
    expect(broker).toBeUndefined();
  });
});
