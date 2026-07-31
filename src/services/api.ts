import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  DashboardMetrics,
  SystemMetrics,
  ConnectorStatus,
  TopicNode,
  TopicDetail,
  TopicHistory,
  TopicStats,
  HierarchyData,
  HierarchyMapping,
  BrokerConfig,
  BrokerFormData,
  ReportResult,
  McpToken,
  McpTokenCreated,
  CypherResult,
  GraphNode,
  GraphProperties,
  GraphRelationship,
  RawGraph,
  KafkaConnector,
  KafkaConnectorInput,
  SouthboundCommand,
  VirtualSensor,
  VirtualSensorInputForm,
  EuromapEvent,
  MachineAlarm,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance.
//
// `withCredentials: true` is required so the cross-subdomain session cookie
// `edu_token` (set by /auth/login with Domain=.espacodedadosunificado.com.br)
// is sent on every request. The backend's CORS config already echoes the
// Origin and `Access-Control-Allow-Credentials: true`.
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token.
//
// Two transport modes:
//   - Bearer: localStorage has a real JWT (existing flow). Send Authorization
//     header so the backend's Bearer path works.
//   - Cookie: localStorage has the sentinel string 'cookie' (set after
//     cross-subdomain rehydration via /auth/me). Skip the header entirely
//     and rely on the cross-subdomain HttpOnly cookie that travels via
//     withCredentials. Sending an empty/invalid Bearer would force the
//     backend down the header path and fail jwt.verify.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edu_token');
    if (token && token !== 'cookie') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      // Clear stored auth if we still think we're logged in. Don't hard-reload
      // (window.location.href triggers an F5 loop when a polled endpoint
      // intermittently 401s); let the route guards redirect on next render.
      const token = localStorage.getItem('edu_token');
      if (token) {
        localStorage.removeItem('edu_token');
        localStorage.removeItem('edu_refresh_token');
        // Best-effort: clear the persisted Zustand state so guards re-evaluate.
        try {
          const raw = localStorage.getItem('edu-auth');
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.state = { ...parsed.state, user: null, isAuthenticated: false };
            localStorage.setItem('edu-auth', JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
      }
    }
    // Promote the server's error string onto error.message so UI catch
    // blocks reading `err.message` show "Credenciais invalidas" instead of
    // axios' useless "Request failed with status code 401".
    const serverError = error.response?.data?.error;
    if (serverError) {
      error.message = serverError;
    }
    return Promise.reject(error);
  }
);

// ===========================================
// Metrics API
// ===========================================

export const metricsApi = {
  getSummary: async (): Promise<DashboardMetrics> => {
    const { data } = await apiClient.get<ApiResponse<DashboardMetrics>>('/metrics/summary');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch metrics');
    }
    return data.data;
  },

  getSystem: async (): Promise<SystemMetrics> => {
    const { data } = await apiClient.get<ApiResponse<SystemMetrics>>('/metrics/system');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch system metrics');
    }
    return data.data;
  },

  getBrokerStatus: async (): Promise<{ status: string; latency?: number }> => {
    const { data } = await apiClient.get<ApiResponse<{ status: string; latency?: number }>>('/metrics/broker-status');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch broker status');
    }
    return data.data;
  },

  getConnectors: async (): Promise<ConnectorStatus[]> => {
    const { data } = await apiClient.get<ApiResponse<ConnectorStatus[]>>('/metrics/connectors');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch connectors');
    }
    return data.data;
  },
};

// ===========================================
// Topics API
// ===========================================

export const topicsApi = {
  // brokerId scopes the tree: undefined → active broker, '<id>' → that broker,
  // 'all' → every connected broker aggregated.
  getTree: async (brokerId?: string): Promise<TopicNode[]> => {
    const { data } = await apiClient.get<ApiResponse<TopicNode[]>>('/topics', {
      params: brokerId ? { brokerId } : undefined,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch topics');
    }
    return data.data;
  },

  getList: async (): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<string[]>>('/topics/list');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch topic list');
    }
    return data.data;
  },

  // brokerId scopes which broker's value to read (undefined → active broker).
  getDetails: async (topic: string, brokerId?: string): Promise<TopicDetail> => {
    const { data } = await apiClient.get<ApiResponse<TopicDetail>>(`/topics/${encodeURIComponent(topic)}/details`, {
      params: brokerId ? { brokerId } : undefined,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch topic details');
    }
    return data.data;
  },

  // Batched latest-value lookup for dashboard polling: one request for many
  // topics instead of one request per widget. Returns a map keyed by topic.
  // Skips Neo4j metadata (values only) — this is the hot path.
  getBatchDetails: async (
    topics: string[],
    brokerId?: string,
  ): Promise<Record<string, { payload: unknown; qos: number; retain: boolean; updatedAt: string }>> => {
    if (topics.length === 0) return {};
    const { data } = await apiClient.post<
      ApiResponse<Record<string, { payload: unknown; qos: number; retain: boolean; updatedAt: string }>>
    >('/topics/batch-details', { topics, brokerId });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch batch topic details');
    }
    return data.data;
  },

  // `from` is an ISO timestamp lower bound (defaults server-side to 1h ago).
  getHistory: async (topic: string, limit = 100, from?: string): Promise<TopicHistory[]> => {
    const { data } = await apiClient.get<ApiResponse<TopicHistory[]>>(
      `/topics/${encodeURIComponent(topic)}/history`,
      { params: from ? { limit, from } : { limit } }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch topic history');
    }
    return data.data;
  },

  getStats: async (topic: string): Promise<TopicStats[]> => {
    const { data } = await apiClient.get<ApiResponse<TopicStats[]>>(`/topics/${encodeURIComponent(topic)}/stats`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch topic stats');
    }
    return data.data;
  },

  search: async (query: string): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<string[]>>('/topics/search', { params: { q: query } });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to search topics');
    }
    return data.data;
  },
};

// ===========================================
// Hierarchy API
// ===========================================

export const hierarchyApi = {
  get: async (): Promise<HierarchyData> => {
    const { data } = await apiClient.get<ApiResponse<HierarchyData>>('/hierarchy');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch hierarchy');
    }
    return data.data;
  },

  getMappings: async (): Promise<HierarchyMapping[]> => {
    const { data } = await apiClient.get<ApiResponse<HierarchyMapping[]>>('/hierarchy/mappings');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch mappings');
    }
    return data.data;
  },

  createMapping: async (mapping: Omit<HierarchyMapping, 'id'>): Promise<HierarchyMapping> => {
    const { data } = await apiClient.post<ApiResponse<HierarchyMapping>>('/hierarchy/mappings', mapping);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create mapping');
    }
    return data.data;
  },

  assignTopic: async (topic: string, equipmentId: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/hierarchy/topics/${encodeURIComponent(topic)}/assign`,
      { equipmentId }
    );
    if (!data.success) {
      throw new Error(data.error || 'Failed to assign topic');
    }
  },

  cypher: async (query: string, params?: Record<string, unknown>): Promise<CypherResult> => {
    const { data } = await apiClient.post<ApiResponse<CypherResult>>('/hierarchy/cypher', { query, params });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Cypher query failed');
    }
    return data.data;
  },

  // Knowledge Graph editor — raw nodes + relationships
  getGraph: async (): Promise<RawGraph> => {
    const { data } = await apiClient.get<ApiResponse<RawGraph>>('/hierarchy/graph');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch graph');
    }
    return data.data;
  },

  createNode: async (label: string, properties: GraphProperties): Promise<GraphNode> => {
    const { data } = await apiClient.post<ApiResponse<GraphNode>>('/hierarchy/nodes', {
      label,
      properties,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create node');
    }
    return data.data;
  },

  updateNode: async (id: string, properties: GraphProperties): Promise<GraphNode> => {
    const { data } = await apiClient.patch<ApiResponse<GraphNode>>(`/hierarchy/nodes/${id}`, {
      properties,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update node');
    }
    return data.data;
  },

  // Create (or reuse) a node bound to a real broker tag/namespace (UNS topic).
  // The topic becomes the node's i3X elementId so relationships surface in i3X.
  anchorNode: async (topic: string, kind: 'tag' | 'namespace', name?: string): Promise<GraphNode> => {
    const { data } = await apiClient.post<ApiResponse<GraphNode>>('/hierarchy/anchor', {
      topic, kind, name,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to anchor node');
    }
    return data.data;
  },

  deleteNode: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/hierarchy/nodes/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete node');
    }
  },

  createRelationship: async (
    sourceId: string,
    targetId: string,
    type: string,
    properties: GraphProperties = {},
  ): Promise<GraphRelationship> => {
    const { data } = await apiClient.post<ApiResponse<GraphRelationship>>('/hierarchy/relationships', {
      sourceId,
      targetId,
      type,
      properties,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create relationship');
    }
    return data.data;
  },

  updateRelationship: async (id: string, properties: GraphProperties): Promise<GraphRelationship> => {
    const { data } = await apiClient.patch<ApiResponse<GraphRelationship>>(
      `/hierarchy/relationships/${id}`,
      { properties },
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update relationship');
    }
    return data.data;
  },

  deleteRelationship: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/hierarchy/relationships/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete relationship');
    }
  },
};

// ===========================================
// Auth API
// ===========================================

export interface AuthTenant {
  id: string;
  name: string;
  subdomain: string;
  plan?: string;
  status?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'engineer' | 'viewer';
  /** Populated when the user belongs to a tenant. Admin global users
   *  (tenantId null) get `tenant: null`. */
  tenant?: AuthTenant | null;
}

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const { data } = await apiClient.post<ApiResponse<{ token: string; user: AuthUser }>>(
      '/auth/login',
      { email, password },
      { withCredentials: true },
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Login failed');
    }
    return data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me', { withCredentials: true });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get user');
    }
    return data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {}, { withCredentials: true });
    } catch { /* server might be down — still clear local state */ }
    localStorage.removeItem('edu_token');
  },
};

// ===========================================
// Health API
// ===========================================

export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const { data } = await apiClient.get('/health');
    return data;
  },
};

// ===========================================
// Brokers API
// ===========================================

export const brokersApi = {
  getAll: async (): Promise<BrokerConfig[]> => {
    const { data } = await apiClient.get<ApiResponse<BrokerConfig[]>>('/brokers');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch brokers');
    }
    return data.data;
  },

  getActive: async (): Promise<BrokerConfig | null> => {
    const { data } = await apiClient.get<ApiResponse<BrokerConfig | null>>('/brokers/active');
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch active broker');
    }
    return data.data || null;
  },

  getStatus: async (): Promise<{ brokers: BrokerConfig[]; activeBrokerId: string | null }> => {
    const { data } = await apiClient.get<ApiResponse<{ brokers: BrokerConfig[]; activeBrokerId: string | null }>>('/brokers/status');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch broker status');
    }
    return data.data;
  },

  getById: async (id: string): Promise<BrokerConfig> => {
    const { data } = await apiClient.get<ApiResponse<BrokerConfig>>(`/brokers/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch broker');
    }
    return data.data;
  },

  create: async (broker: BrokerFormData): Promise<BrokerConfig> => {
    const payload = {
      ...broker,
      topics: typeof broker.topics === 'string'
        ? broker.topics.split(',').map((t) => t.trim()).filter(Boolean)
        : broker.topics,
    };
    const { data } = await apiClient.post<ApiResponse<BrokerConfig>>('/brokers', payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create broker');
    }
    return data.data;
  },

  update: async (id: string, updates: Partial<BrokerFormData>): Promise<BrokerConfig> => {
    const payload = {
      ...updates,
      ...(typeof updates.topics === 'string' && {
        topics: updates.topics.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    };
    const { data } = await apiClient.put<ApiResponse<BrokerConfig>>(`/brokers/${id}`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update broker');
    }
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/brokers/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete broker');
    }
  },

  connect: async (id: string): Promise<BrokerConfig> => {
    const { data } = await apiClient.post<ApiResponse<BrokerConfig>>(`/brokers/${id}/connect`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to connect to broker');
    }
    return data.data;
  },

  disconnect: async (id: string): Promise<BrokerConfig> => {
    const { data } = await apiClient.post<ApiResponse<BrokerConfig>>(`/brokers/${id}/disconnect`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to disconnect from broker');
    }
    return data.data;
  },

  activate: async (id: string): Promise<BrokerConfig> => {
    const { data } = await apiClient.post<ApiResponse<BrokerConfig>>(`/brokers/${id}/activate`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to activate broker');
    }
    return data.data;
  },
};

// ===========================================
// AI API
// ===========================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIStatus {
  available: boolean;
  model: string;
}

export const aiApi = {
  chat: async (messages: ChatMessage[]): Promise<ChatMessage> => {
    // Longer timeout for AI requests (5 minutes for CPU-only Ollama)
    const { data } = await apiClient.post<ApiResponse<{ message: ChatMessage }>>(
      '/ai/chat',
      { messages },
      { timeout: 300000 }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to send chat message');
    }
    return data.data.message;
  },

  getStatus: async (): Promise<AIStatus> => {
    const { data } = await apiClient.get<ApiResponse<AIStatus>>('/ai/status');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get AI status');
    }
    return data.data;
  },
};

// ===========================================
// Reports API
// ===========================================

export const reportsApi = {
  generate: async (prompt: string): Promise<ReportResult> => {
    // Longer timeout for AI requests (5 minutes for CPU-only Ollama)
    const { data } = await apiClient.post<ApiResponse<ReportResult>>(
      '/reports/generate',
      { prompt },
      { timeout: 300000 }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to generate report');
    }
    return data.data;
  },

  getTopics: async (): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<string[]>>('/reports/topics');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get available topics');
    }
    return data.data;
  },
};

// ===========================================
// OPC-UA API
// ===========================================

import { OpcUaConnection, OpcUaSubscription, NodeLiveValue, ModbusConnection, ModbusRegister, ModbusLiveValue, EthipConnection, EthipTag, EthipDiscoveredTag, EthipLiveValue } from '../types';

export const opcuaApi = {
  getConnections: async (): Promise<OpcUaConnection[]> => {
    const { data } = await apiClient.get<ApiResponse<OpcUaConnection[]>>('/opcua/connections');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch OPC-UA connections');
    }
    return data.data;
  },

  getConnectionById: async (id: string): Promise<OpcUaConnection> => {
    const { data } = await apiClient.get<ApiResponse<OpcUaConnection>>(`/opcua/connections/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch OPC-UA connection');
    }
    return data.data;
  },

  createConnection: async (connection: {
    name: string;
    endpointUrl: string;
    securityMode?: string;
    username?: string;
    password?: string;
    machineId?: string;
    site?: string;
    area?: string;
    euromapEnabled?: boolean;
    statusNodeId?: string;
  }): Promise<OpcUaConnection> => {
    const { data } = await apiClient.post<ApiResponse<OpcUaConnection>>('/opcua/connections', connection);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create OPC-UA connection');
    }
    return data.data;
  },

  updateConnection: async (id: string, updates: Partial<{
    name: string;
    endpointUrl: string;
    securityMode: string;
    username: string;
    password: string;
    machineId: string;
    site: string;
    area: string;
    euromapEnabled: boolean;
    statusNodeId: string;
  }>): Promise<OpcUaConnection> => {
    const { data } = await apiClient.put<ApiResponse<OpcUaConnection>>(`/opcua/connections/${id}`, updates);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update OPC-UA connection');
    return data.data;
  },

  deleteConnection: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/opcua/connections/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete OPC-UA connection');
    }
  },

  connect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/opcua/connections/${id}/connect`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to connect to OPC-UA server');
    }
  },

  disconnect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/opcua/connections/${id}/disconnect`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to disconnect from OPC-UA server');
    }
  },

  browse: async (connectionId: string, nodeId?: string): Promise<unknown[]> => {
    const params = nodeId ? { nodeId } : {};
    const { data } = await apiClient.get<ApiResponse<unknown[]>>(
      `/opcua/connections/${connectionId}/browse`,
      { params }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to browse OPC-UA nodes');
    }
    return data.data;
  },

  getSubscriptions: async (connectionId?: string): Promise<OpcUaSubscription[]> => {
    const params = connectionId ? { connectionId } : {};
    const { data } = await apiClient.get<ApiResponse<OpcUaSubscription[]>>('/opcua/subscriptions', { params });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch OPC-UA subscriptions');
    }
    return data.data;
  },

  createSubscription: async (
    connectionId: string,
    sub: {
      nodeId: string;
      mqttTopic: string;
      samplingIntervalMs?: number;
      brokerId?: string;
      destinationKind?: 'mqtt' | 'kafka';
      connectorId?: string;
    }
  ): Promise<OpcUaSubscription> => {
    const { data } = await apiClient.post<ApiResponse<OpcUaSubscription>>(
      `/opcua/connections/${connectionId}/subscribe`,
      sub
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create OPC-UA subscription');
    }
    return data.data;
  },

  deleteSubscription: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/opcua/subscriptions/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete OPC-UA subscription');
    }
  },

  getLiveValues: async (connectionId: string): Promise<NodeLiveValue[]> => {
    const { data } = await apiClient.get<ApiResponse<NodeLiveValue[]>>(
      `/opcua/connections/${connectionId}/values`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch live values');
    }
    return data.data;
  },

  readNode: async (connectionId: string, nodeId: string): Promise<NodeLiveValue> => {
    const { data } = await apiClient.get<ApiResponse<NodeLiveValue>>(
      `/opcua/connections/${connectionId}/read`,
      { params: { nodeId } }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to read node');
    }
    return data.data;
  },
};

export default apiClient;

// ===========================================
// Export API (returns download URLs)
// ===========================================

export const kafkaApi = {
  getConnectors: async (): Promise<KafkaConnector[]> => {
    const { data } = await apiClient.get<ApiResponse<KafkaConnector[]>>('/kafka');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch Kafka connectors');
    return data.data;
  },
  create: async (input: KafkaConnectorInput): Promise<KafkaConnector> => {
    const { data } = await apiClient.post<ApiResponse<KafkaConnector>>('/kafka', input);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create Kafka connector');
    return data.data;
  },
  update: async (id: string, updates: Partial<KafkaConnectorInput>): Promise<KafkaConnector> => {
    const { data } = await apiClient.put<ApiResponse<KafkaConnector>>(`/kafka/${id}`, updates);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update Kafka connector');
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/kafka/${id}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete Kafka connector');
  },
  connect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/kafka/${id}/connect`);
    if (!data.success) throw new Error(data.error || 'Failed to connect');
  },
  disconnect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/kafka/${id}/disconnect`);
    if (!data.success) throw new Error(data.error || 'Failed to disconnect');
  },
  activate: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/kafka/${id}/activate`);
    if (!data.success) throw new Error(data.error || 'Failed to activate');
  },
  test: async (id: string): Promise<{ ok: boolean; latencyMs?: number; error?: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ ok: boolean; latencyMs?: number; error?: string }>>(`/kafka/${id}/test`);
    if (!data.success || !data.data) throw new Error(data.error || 'Test failed');
    return data.data;
  },
};

// ── Per-monitored-type publish rules (PUB-01) ──
export interface PublishRuleFieldEntry {
  source: string;
  target?: string;
}
export interface PublishRuleEntry {
  /** Monitored event type NodeId, or 'status' / 'telemetry'. */
  ruleKey: string;
  name: string;
  kind: string;
  defaultTopic: string;
  /** Modelable fields: payload source (dot path) + browse-path segments so the
   *  editor can render them as a folder tree instead of a flat list. */
  availableFields: { source: string; path: string[] }[];
  /** null = active connector. */
  connectorId: string | null;
  /** null = the schema's default topic. */
  topic: string | null;
  /** null = no extra Kafka headers. */
  headers: Record<string, string> | null;
  /** null = full flex payload. */
  fieldModel: { fields: PublishRuleFieldEntry[] } | null;
}
export interface PublishRules {
  machineId: string;
  eventTypes: PublishRuleEntry[];
  platformStreams: PublishRuleEntry[];
}

export const publishRulesApi = {
  getRules: async (machineId: string): Promise<PublishRules> => {
    const { data } = await apiClient.get<ApiResponse<PublishRules>>('/columbus/publish-rules', { params: { machineId } });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch publish rules');
    return data.data;
  },
  updateRule: async (
    machineId: string,
    ruleKey: string,
    body: {
      connectorId?: string | null;
      topic?: string | null;
      headers?: Record<string, string> | null;
      fieldModel?: { fields: PublishRuleFieldEntry[] } | null;
    },
  ): Promise<PublishRuleEntry> => {
    const { data } = await apiClient.put<ApiResponse<PublishRuleEntry>>('/columbus/publish-rules', { machineId, ruleKey, ...body });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to save publish rule');
    return data.data;
  },
};

export const southboundApi = {
  getCommands: async (limit = 100, offset = 0): Promise<{ commands: SouthboundCommand[]; total: number }> => {
    const { data } = await apiClient.get<ApiResponse<{ commands: SouthboundCommand[]; total: number }>>('/southbound/commands', { params: { limit, offset } });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch commands');
    return data.data;
  },
  deleteCommands: async (ids: string[]): Promise<number> => {
    const { data } = await apiClient.delete<ApiResponse<{ deleted: number }>>('/southbound/commands', { data: { ids } });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to delete commands');
    return data.data.deleted;
  },
  getArmed: async (): Promise<{ armedConnections: Array<{ id: string; machine_id?: string; name: string }> }> => {
    const { data } = await apiClient.get<ApiResponse<{ armedConnections: Array<{ id: string; machine_id?: string; name: string }> }>>('/southbound/health');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch armed connections');
    return data.data;
  },
  arm: async (connectionId: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/southbound/connections/${connectionId}/arm`);
    if (!data.success) throw new Error(data.error || 'Failed to arm');
  },
  disarm: async (connectionId: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/southbound/connections/${connectionId}/disarm`);
    if (!data.success) throw new Error(data.error || 'Failed to disarm');
  },
  dispatch: async (input: { machineId: string; commandKind: string; payload?: Record<string, unknown> }): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>('/southbound/commands', input);
    if (!data.success) throw new Error(data.error || 'Failed to dispatch command');
  },
  // SB-METHODS: UaExpert-style method browser support.
  listMethods: async (machineId: string): Promise<MethodDiscovery> => {
    const { data } = await apiClient.get<ApiResponse<MethodDiscovery>>(
      `/southbound/machines/${encodeURIComponent(machineId)}/methods`,
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to discover methods');
    return data.data;
  },
  dispatchMethodCall: async (machineId: string, payload: MethodCallPayload): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>('/southbound/commands', {
      machineId,
      commandKind: 'method-call',
      payload,
    });
    if (!data.success) throw new Error(data.error || 'Failed to dispatch method call');
  },
  getCommandByKey: async (idempotencyKey: string): Promise<SouthboundCommandRow> => {
    const { data } = await apiClient.get<ApiResponse<SouthboundCommandRow>>(
      `/southbound/commands/by-key/${encodeURIComponent(idempotencyKey)}`,
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Command not found');
    return data.data;
  },
};

// ── Southbound method browser (SB-METHODS) types ──
export interface DiscoveredMethodArgument {
  name: string;
  dataTypeNodeId: string;
  dataTypeName: string;
  /** -1 scalar, >=1 array (OPC UA ValueRank). */
  valueRank: number;
  description?: string;
  /** StructureDefinition optional-field flag. Absent = required. */
  isOptional?: boolean;
  /** Fields of a custom structured type (from its DataTypeDefinition). */
  structure?: DiscoveredMethodArgument[];
  /** Options of a custom enumeration type. */
  enumValues?: Array<{ name: string; value: number }>;
}
export interface DiscoveredMethod {
  methodNodeId: string;
  browseName: string;
  displayName: string;
  description?: string;
  objectNodeId: string;
  /** Browse path from the Objects folder, e.g. "DeviceSet/IMM_Netstal/Jobs". */
  objectPath: string;
  executable: boolean;
  userExecutable: boolean;
  inputArguments: DiscoveredMethodArgument[];
  outputArguments: DiscoveredMethodArgument[];
}
export interface MethodDiscovery {
  connectionId: string;
  armed: boolean;
  methods: DiscoveredMethod[];
}
export interface MethodCallArgument {
  dataType: string;
  value: unknown;
}
export interface MethodCallPayload {
  machineId?: string;
  idempotencyKey: string;
  correlationId?: string;
  /** Browse name of the method, shown in the command log. */
  methodName?: string;
  objectNodeId: string;
  methodNodeId: string;
  arguments: MethodCallArgument[];
}
export interface MethodCallAck {
  status: string;
  statusCode?: string | number;
  outputs?: unknown;
  /** Per-argument OPC UA verdicts, index-aligned with the sent arguments. */
  inputArgumentResults?: string[];
  error?: string;
  ts?: string;
}
export interface SouthboundCommandRow extends SouthboundCommand {
  ack_payload?: MethodCallAck | null;
}

export const exportApi = {
  topicCsvUrl: (topic: string, params?: { from?: string; to?: string; limit?: number }) => {
    const base = `${(import.meta.env.VITE_API_URL || '/api')}/export/topics/${encodeURIComponent(topic)}/csv`;
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return base + qs;
  },
};

// ===========================================
// Modbus TCP API
// ===========================================

export const modbusApi = {
  getConnections: async (): Promise<ModbusConnection[]> => {
    const { data } = await apiClient.get<ApiResponse<ModbusConnection[]>>('/modbus/connections');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch Modbus connections');
    return data.data;
  },

  getConnectionById: async (id: string): Promise<ModbusConnection> => {
    const { data } = await apiClient.get<ApiResponse<ModbusConnection>>(`/modbus/connections/${id}`);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch Modbus connection');
    return data.data;
  },

  createConnection: async (connection: {
    name: string;
    host: string;
    port?: number;
    unitId?: number;
    timeoutMs?: number;
  }): Promise<ModbusConnection> => {
    const { data } = await apiClient.post<ApiResponse<ModbusConnection>>('/modbus/connections', connection);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create Modbus connection');
    return data.data;
  },

  updateConnection: async (id: string, updates: Partial<{
    name: string;
    host: string;
    port: number;
    unitId: number;
    timeoutMs: number;
  }>): Promise<ModbusConnection> => {
    const { data } = await apiClient.put<ApiResponse<ModbusConnection>>(`/modbus/connections/${id}`, updates);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update Modbus connection');
    return data.data;
  },

  deleteConnection: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/modbus/connections/${id}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete Modbus connection');
  },

  connect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/modbus/connections/${id}/connect`);
    if (!data.success) throw new Error(data.error || 'Failed to connect to Modbus device');
  },

  disconnect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/modbus/connections/${id}/disconnect`);
    if (!data.success) throw new Error(data.error || 'Failed to disconnect from Modbus device');
  },

  getLiveValues: async (connectionId: string): Promise<ModbusLiveValue[]> => {
    const { data } = await apiClient.get<ApiResponse<ModbusLiveValue[]>>(
      `/modbus/connections/${connectionId}/values`
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch live values');
    return data.data;
  },

  getRegisters: async (connectionId: string): Promise<ModbusRegister[]> => {
    const { data } = await apiClient.get<ApiResponse<ModbusRegister[]>>(
      `/modbus/connections/${connectionId}/registers`
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch registers');
    return data.data;
  },

  createRegister: async (
    connectionId: string,
    register: {
      name: string;
      registerType: string;
      address: number;
      dataType?: string;
      scaleFactor?: number;
      mqttTopic: string;
      samplingIntervalMs?: number;
      brokerId?: string;
      enabled?: boolean;
    }
  ): Promise<ModbusRegister> => {
    const { data } = await apiClient.post<ApiResponse<ModbusRegister>>(
      `/modbus/connections/${connectionId}/registers`,
      register
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create register');
    return data.data;
  },

  deleteRegister: async (connectionId: string, regId: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(
      `/modbus/connections/${connectionId}/registers/${regId}`
    );
    if (!data.success) throw new Error(data.error || 'Failed to delete register');
  },
};

// ===========================================
// EtherNet/IP API
// ===========================================

export const ethipApi = {
  getConnections: async (): Promise<EthipConnection[]> => {
    const { data } = await apiClient.get<ApiResponse<EthipConnection[]>>('/ethip/connections');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch EtherNet/IP connections');
    return data.data;
  },

  createConnection: async (connection: {
    name: string;
    host: string;
    slot?: number;
    plcType?: 'logix' | 'slc' | 'micro800';
  }): Promise<EthipConnection> => {
    const { data } = await apiClient.post<ApiResponse<EthipConnection>>('/ethip/connections', connection);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create EtherNet/IP connection');
    return data.data;
  },

  updateConnection: async (id: string, updates: Partial<{
    name: string;
    host: string;
    slot: number;
    plcType: 'logix' | 'slc' | 'micro800';
  }>): Promise<EthipConnection> => {
    const { data } = await apiClient.put<ApiResponse<EthipConnection>>(`/ethip/connections/${id}`, updates);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update EtherNet/IP connection');
    return data.data;
  },

  deleteConnection: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/ethip/connections/${id}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete EtherNet/IP connection');
  },

  connect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/ethip/connections/${id}/connect`);
    if (!data.success) throw new Error(data.error || 'Failed to connect to EtherNet/IP device');
  },

  disconnect: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/ethip/connections/${id}/disconnect`);
    if (!data.success) throw new Error(data.error || 'Failed to disconnect from EtherNet/IP device');
  },

  discoverTags: async (id: string): Promise<EthipDiscoveredTag[]> => {
    const { data } = await apiClient.get<ApiResponse<EthipDiscoveredTag[]>>(`/ethip/connections/${id}/tags`);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to discover tags');
    return data.data;
  },

  getSubscribedTags: async (id: string): Promise<EthipTag[]> => {
    const { data } = await apiClient.get<ApiResponse<EthipTag[]>>(`/ethip/connections/${id}/tags/subscribed`);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch subscribed tags');
    return data.data;
  },

  subscribeTag: async (connId: string, body: {
    tagName: string;
    memberPath?: string;
    mqttTopic: string;
    samplingIntervalMs?: number;
    displayName?: string;
    brokerId?: string;
  }): Promise<EthipTag> => {
    const { data } = await apiClient.post<ApiResponse<EthipTag>>(`/ethip/connections/${connId}/tags`, body);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to subscribe tag');
    return data.data;
  },

  deleteTag: async (tagId: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/ethip/tags/${tagId}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete tag');
  },

  getValues: async (id: string): Promise<EthipLiveValue[]> => {
    const { data } = await apiClient.get<ApiResponse<EthipLiveValue[]>>(`/ethip/connections/${id}/values`);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch live values');
    return data.data;
  },

  readTags: async (id: string, tags: string[]): Promise<Record<string, unknown>> => {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/ethip/connections/${id}/read`, { tags });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to read tags');
    return data.data;
  },

  writeTags: async (id: string, tags: [string, unknown][]): Promise<Record<string, unknown>> => {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/ethip/connections/${id}/write`, { tags });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to write tags');
    return data.data;
  },
};

// ===========================================
// MCP Connections API
// ===========================================
export const mcpApi = {
  listTokens: async (): Promise<McpToken[]> => {
    const { data } = await apiClient.get<ApiResponse<McpToken[]>>('/auth/mcp-tokens');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch MCP tokens');
    return data.data;
  },

  createToken: async (payload: { name: string; expiresIn?: string }): Promise<McpTokenCreated> => {
    const { data } = await apiClient.post<ApiResponse<McpTokenCreated>>('/auth/mcp-token', payload);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create MCP token');
    return data.data;
  },

  deleteToken: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/auth/mcp-tokens/${id}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete MCP token');
  },
};

// ===========================================
// Config Transfer API (export/import all configs)
// ===========================================

export interface ConfigImportSummary {
  // Per table: rows newly inserted vs skipped because they already existed.
  postgres: Record<string, { inserted: number; skipped: number }>;
  neo4j: { nodes: number; relationships: number; skipped: number };
}

export const configTransferApi = {
  exportAll: async (): Promise<void> => {
    const res = await apiClient.get('/config/export', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edu-config-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importAll: async (bundle: unknown): Promise<ConfigImportSummary> => {
    const { data } = await apiClient.post<ApiResponse<ConfigImportSummary>>('/config/import', bundle);
    if (!data.success || !data.data) throw new Error(data.error || 'Falha ao importar configurações');
    return data.data;
  },
};

// ===========================================
// SM Profiles API
// ===========================================

export const templatesApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/templates');
    return data.data;
  },
  getCategories: async () => {
    const { data } = await apiClient.get('/templates/categories');
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/templates/${id}`);
    return data.data;
  },
};

export const smProfilesApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/sm-profiles');
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/sm-profiles/${id}`);
    return data.data;
  },
};

// ===========================================
// Data Models API
// ===========================================

// ===========================================
// Alerts API
// ===========================================

export const alertsApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/alerts');
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/alerts/${id}`);
    return data.data;
  },
  create: async (body: any) => {
    const { data } = await apiClient.post('/alerts', body);
    return data.data;
  },
  update: async (id: string, body: any) => {
    const { data } = await apiClient.put(`/alerts/${id}`, body);
    return data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/alerts/${id}`);
  },
  toggle: async (id: string) => {
    const { data } = await apiClient.post(`/alerts/${id}/toggle`);
    return data.data;
  },
  test: async (id: string) => {
    const { data } = await apiClient.post(`/alerts/${id}/test`);
    return data.data;
  },
};

// ===========================================
// Dashboards API
// ===========================================

export const dashboardsApi = {
  getAll: async () => { const { data } = await apiClient.get('/dashboards'); return data.data; },
  getById: async (id: string) => { const { data } = await apiClient.get(`/dashboards/${id}`); return data.data; },
  create: async (body: any) => { const { data } = await apiClient.post('/dashboards', body); return data.data; },
  update: async (id: string, body: any) => { const { data } = await apiClient.put(`/dashboards/${id}`, body); return data.data; },
  delete: async (id: string) => { await apiClient.delete(`/dashboards/${id}`); },
  duplicate: async (id: string) => { const { data } = await apiClient.post(`/dashboards/${id}/duplicate`); return data.data; },
  share: async (id: string) => { const { data } = await apiClient.post(`/dashboards/${id}/share`); return data.data; },
  unshare: async (id: string) => { await apiClient.delete(`/dashboards/${id}/share`); },
  getShared: async (token: string) => { const { data } = await apiClient.get(`/dashboards/shared/${token}`); return data.data; },
  listTemplates: async () => { const { data } = await apiClient.get('/dashboards/templates'); return data.data; },
  getTemplate: async (id: string) => { const { data } = await apiClient.get(`/dashboards/templates/${id}`); return data.data; },
};

// ===========================================
// Network Discovery API (Edge only)
// ===========================================

export const discoveryApi = {
  startScan: async (cidr: string, protocols?: string[]) => {
    const { data } = await apiClient.post('/discovery/scan', { cidr, protocols });
    return data.data;
  },
  getScan: async (id: string) => {
    const { data } = await apiClient.get(`/discovery/scan/${id}`);
    return data.data;
  },
  cancelScan: async (id: string) => {
    await apiClient.post(`/discovery/scan/${id}/cancel`);
  },
  getLatest: async () => {
    const { data } = await apiClient.get('/discovery/latest');
    return data.data;
  },
  getSuggestedCidr: async () => {
    const { data } = await apiClient.get('/discovery/interfaces');
    return data.data as { cidr: string; interface: string; ip: string } | null;
  },
};

// ===========================================
// Licenses API
// ===========================================

export const licensesApi = {
  getAll: async () => { const { data } = await apiClient.get('/licenses'); return data.data; },
  create: async (body: any) => { const { data } = await apiClient.post('/licenses', body); return data.data; },
  getById: async (id: string) => { const { data } = await apiClient.get(`/licenses/${id}`); return data.data; },
  revoke: async (id: string) => { await apiClient.delete(`/licenses/${id}`); },
  download: async (id: string) => { const { data } = await apiClient.get(`/licenses/${id}/download`); return data; },
  getStatus: async () => { const { data } = await apiClient.get('/license'); return data.data; },
  uploadKey: async (key: string) => { const { data } = await apiClient.post('/license/upload', { key }); return data.data; },
};

export const dataModelsApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/data-models');
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/data-models/${id}`);
    return data.data;
  },
  create: async (body: any) => {
    const { data } = await apiClient.post('/data-models', body);
    return data.data;
  },
  update: async (id: string, body: any) => {
    const { data } = await apiClient.put(`/data-models/${id}`, body);
    return data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/data-models/${id}`);
  },
  toggle: async (id: string) => {
    const { data } = await apiClient.post(`/data-models/${id}/toggle`);
    return data.data;
  },
  test: async (id: string, payload: unknown) => {
    const { data } = await apiClient.post(`/data-models/${id}/test`, { payload });
    return data.data;
  },
  getStats: async () => {
    const { data } = await apiClient.get('/data-models/stats');
    return data.data;
  },
};

// ===========================================
// Waitlist API — public, invite-only early access list
// ===========================================

export interface WaitlistSubscribePayload {
  email:    string;
  name?:    string;
  company?: string;
  role?:    string;
  useCase?: string;
  source?:  string;
  locale?:  string;
}

export interface WaitlistSubscribeResult {
  id:                string;
  email:             string;
  createdAt:         string;
  alreadySubscribed: boolean;
}

export const waitlistApi = {
  subscribe: async (payload: WaitlistSubscribePayload): Promise<WaitlistSubscribeResult> => {
    const { data } = await apiClient.post<ApiResponse<WaitlistSubscribeResult>>('/waitlist', payload);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to subscribe');
    return data.data;
  },
};

// ===========================================
// Organizations API (multi-tenant, admin only)
// ===========================================

import type { Organization } from '../types';

export interface OrganizationCreatePayload {
  name: string;
  subdomain: string;
  plan?: 'trial' | 'starter' | 'professional' | 'enterprise';
  contactEmail?: string;
  maxUsers?: number;
  maxConnections?: number;
}

export interface OrganizationUpdatePayload {
  name?: string;
  subdomain?: string;
  plan?: 'trial' | 'starter' | 'professional' | 'enterprise';
  status?: 'active' | 'suspended' | 'deleted';
  contactEmail?: string | null;
  maxUsers?: number;
  maxConnections?: number;
}

export const organizationsApi = {
  list: async (includeDeleted = false): Promise<Organization[]> => {
    const { data } = await apiClient.get<ApiResponse<Organization[]>>(
      `/organizations${includeDeleted ? '?includeDeleted=true' : ''}`,
    );
    return data.data ?? [];
  },
  getById: async (id: string): Promise<Organization> => {
    const { data } = await apiClient.get<ApiResponse<Organization>>(`/organizations/${id}`);
    if (!data.data) throw new Error(data.error || 'Organization not found');
    return data.data;
  },
  create: async (payload: OrganizationCreatePayload): Promise<Organization> => {
    const { data } = await apiClient.post<ApiResponse<Organization>>('/organizations', payload);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create organization');
    return data.data;
  },
  update: async (id: string, payload: OrganizationUpdatePayload): Promise<Organization> => {
    const { data } = await apiClient.put<ApiResponse<Organization>>(`/organizations/${id}`, payload);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update organization');
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/organizations/${id}`);
  },
  listUsers: async (id: string): Promise<{ id: string; email: string; name: string; role: string }[]> => {
    const { data } = await apiClient.get<ApiResponse<{ id: string; email: string; name: string; role: string }[]>>(
      `/organizations/${id}/users`,
    );
    return data.data ?? [];
  },
};

// ── Virtual Sensors ──
export const virtualSensorsApi = {
  list: async (): Promise<VirtualSensor[]> => {
    const { data } = await apiClient.get<ApiResponse<VirtualSensor[]>>('/virtual-sensors');
    return data.data ?? [];
  },
  create: async (payload: VirtualSensorInputForm): Promise<VirtualSensor> => {
    const { data } = await apiClient.post<ApiResponse<VirtualSensor>>('/virtual-sensors', payload);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create virtual sensor');
    return data.data;
  },
  update: async (id: string, payload: Partial<VirtualSensorInputForm>): Promise<VirtualSensor> => {
    const { data } = await apiClient.put<ApiResponse<VirtualSensor>>(`/virtual-sensors/${id}`, payload);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update virtual sensor');
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/virtual-sensors/${id}`);
  },
  test: async (expression: string, scope: Record<string, number>): Promise<{ result: number; variables: string[] }> => {
    const { data } = await apiClient.post<ApiResponse<{ result: number; variables: string[] }>>(
      '/virtual-sensors/test',
      { expression, scope },
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Invalid expression');
    return data.data;
  },
};

// ── EUROMAP events / history / alarms (Events monitor) ──
export const eventsApi = {
  history: async (machineId: string, hours = 3, max = 200): Promise<EuromapEvent[]> => {
    const { data } = await apiClient.get<ApiResponse<EuromapEvent[]>>('/columbus/events/history', {
      params: { machineId, hours, max },
    });
    return data.data ?? [];
  },
  recent: async (machineId: string): Promise<EuromapEvent[]> => {
    const { data } = await apiClient.get<ApiResponse<EuromapEvent[]>>('/columbus/events/recent', {
      params: { machineId },
    });
    return data.data ?? [];
  },
  // Clears the server-side live feed buffer, so the trash button survives refresh.
  clearRecent: async (machineId: string): Promise<number> => {
    const { data } = await apiClient.post<ApiResponse<{ cleared: number }>>('/columbus/events/recent/clear', { machineId });
    if (!data.success) throw new Error(data.error || 'Failed to clear live events');
    return data.data?.cleared ?? 0;
  },
  alarms: async (machineId: string): Promise<MachineAlarm[]> => {
    const { data } = await apiClient.get<ApiResponse<MachineAlarm[]>>('/columbus/alarms', {
      params: { machineId },
    });
    return data.data ?? [];
  },
  // DESTRUCTIVE: delete events from the machine's history buffer (needs ops:action).
  deleteEvents: async (machineId: string, nodeId: string, eventIds: string[]): Promise<{ deleted: number; total: number }> => {
    const { data } = await apiClient.post<ApiResponse<{ deleted: number; total: number }>>(
      '/columbus/events/delete',
      { machineId, nodeId, eventIds },
    );
    if (!data.success) throw new Error(data.error || 'Falha ao deletar eventos');
    return data.data ?? { deleted: 0, total: eventIds.length };
  },
  // Navigate the EventType tree (subtypes to drill into + this type's fields).
  browseEventTypes: async (machineId: string, nodeId?: string): Promise<EventTypeTree> => {
    const { data } = await apiClient.get<ApiResponse<EventTypeTree>>('/columbus/event-types', {
      params: { machineId, ...(nodeId ? { nodeId } : {}) },
    });
    if (!data.success) throw new Error(data.error || 'Falha ao navegar tipos de evento');
    return data.data ?? { nodeId: nodeId ?? '', subtypes: [], fields: [] };
  },
  getEventTypeAttributes: async (
    machineId: string,
    nodeId: string,
  ): Promise<{ nodeId: string; fields: EventTypeAttribute[] }> => {
    const { data } = await apiClient.get<ApiResponse<{ nodeId: string; fields: EventTypeAttribute[] }>>(
      '/columbus/event-type-attributes',
      { params: { machineId, nodeId } },
    );
    return data.data ?? { nodeId, fields: [] };
  },
  getEventSelection: async (machineId: string): Promise<{ eventTypes: EventTypeSelection[]; isDefault: boolean }> => {
    const { data } = await apiClient.get<ApiResponse<{ eventTypes: EventTypeSelection[]; isDefault: boolean }>>(
      '/columbus/event-selection',
      { params: { machineId } },
    );
    return data.data ?? { eventTypes: [], isDefault: true };
  },
  saveEventSelection: async (machineId: string, eventTypes: EventTypeSelection[]): Promise<EventTypeSelection[]> => {
    const { data } = await apiClient.put<ApiResponse<{ eventTypes: EventTypeSelection[] }>>(
      '/columbus/event-selection',
      { machineId, eventTypes },
    );
    if (!data.success) throw new Error(data.error || 'Falha ao salvar seleção de eventos');
    return data.data?.eventTypes ?? eventTypes;
  },
  setEventEnabled: async (machineId: string, nodeId: string, enabled: boolean): Promise<EventTypeSelection[]> => {
    const { data } = await apiClient.put<ApiResponse<{ eventTypes: EventTypeSelection[] }>>(
      '/columbus/event-selection/enabled',
      { machineId, nodeId, enabled },
    );
    if (!data.success) throw new Error(data.error || 'Falha ao alternar tipo de evento');
    return data.data?.eventTypes ?? [];
  },
};

export interface EventTypeRef {
  nodeId: string;
  browseName: string;
  displayName: string;
  namespace?: number;
}
export interface EventTypeTree {
  nodeId: string;
  subtypes: EventTypeRef[];
  fields: EventTypeRef[];
}
/** One deep attribute of an event type: its full browse path (for the folder
 *  tree) and the UaExpert-style key. This is exactly what the raw payload carries. */
export interface EventTypeAttribute {
  key: string;
  path: string[];
  nodeId: string;
}
export interface EventTypeSelection {
  nodeId: string;
  name: string;
  /** Whether the type is actively monitored (live subscription). Missing =
   *  enabled (legacy / default set); new additions come disabled until toggled. */
  enabled?: boolean;
}
