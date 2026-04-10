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
  Rule,
  RuleExecution,
  CreateRuleInput,
  AnomalyDetection,
  McpToken,
  McpTokenCreated,
  CypherResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edu_token');
    if (token) {
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
      localStorage.removeItem('edu_token');
      window.location.href = '/login';
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
  getTree: async (): Promise<TopicNode[]> => {
    const { data } = await apiClient.get<ApiResponse<TopicNode[]>>('/topics');
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

  getDetails: async (topic: string): Promise<TopicDetail> => {
    const { data } = await apiClient.get<ApiResponse<TopicDetail>>(`/topics/${encodeURIComponent(topic)}/details`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch topic details');
    }
    return data.data;
  },

  getHistory: async (topic: string, limit = 100): Promise<TopicHistory[]> => {
    const { data } = await apiClient.get<ApiResponse<TopicHistory[]>>(
      `/topics/${encodeURIComponent(topic)}/history`,
      { params: { limit } }
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
};

// ===========================================
// Auth API
// ===========================================

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'engineer';
}

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const { data } = await apiClient.post<ApiResponse<{ token: string; user: AuthUser }>>(
      '/auth/login',
      { email, password }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Login failed');
    }
    return data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get user');
    }
    return data.data;
  },

  logout: async (): Promise<void> => {
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

import { OpcUaConnection, OpcUaSubscription, NodeLiveValue, AlarmDefinition, AlarmEvent, AlarmSummary, OEEDefinition, OEEMetrics, OEESnapshot, ModbusConnection, ModbusRegister, ModbusLiveValue, EthipConnection, EthipTag, EthipDiscoveredTag, EthipLiveValue } from '../types';

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
  }): Promise<OpcUaConnection> => {
    const { data } = await apiClient.post<ApiResponse<OpcUaConnection>>('/opcua/connections', connection);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create OPC-UA connection');
    }
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
    sub: { nodeId: string; mqttTopic: string; samplingIntervalMs?: number; brokerId?: string }
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

// ===========================================
// Alarms API
// ===========================================

export interface AlarmEventFilters {
  alarmId?: string;
  state?: string;
  priority?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface CreateAlarmInput {
  name: string;
  topic: string;
  conditionType: 'threshold' | 'bad_quality';
  conditionConfig: Record<string, unknown>;
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  enabled?: boolean;
}

export const alarmsApi = {
  getDefinitions: async (): Promise<AlarmDefinition[]> => {
    const { data } = await apiClient.get<ApiResponse<AlarmDefinition[]>>('/alarms/definitions');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch alarm definitions');
    return data.data;
  },

  createDefinition: async (input: CreateAlarmInput): Promise<AlarmDefinition> => {
    const { data } = await apiClient.post<ApiResponse<AlarmDefinition>>('/alarms/definitions', input);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create alarm');
    return data.data;
  },

  updateDefinition: async (id: string, updates: Partial<CreateAlarmInput>): Promise<AlarmDefinition> => {
    const { data } = await apiClient.put<ApiResponse<AlarmDefinition>>(`/alarms/definitions/${id}`, updates);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update alarm');
    return data.data;
  },

  deleteDefinition: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/alarms/definitions/${id}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete alarm');
  },

  getActiveAlarms: async (): Promise<AlarmDefinition[]> => {
    const { data } = await apiClient.get<ApiResponse<AlarmDefinition[]>>('/alarms/events/active');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch active alarms');
    return data.data;
  },

  getSummary: async (): Promise<AlarmSummary> => {
    const { data } = await apiClient.get<ApiResponse<AlarmSummary>>('/alarms/summary');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch alarm summary');
    return data.data;
  },

  getEvents: async (filters?: AlarmEventFilters): Promise<AlarmEvent[]> => {
    const { data } = await apiClient.get<ApiResponse<AlarmEvent[]>>('/alarms/events', { params: filters });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch alarm events');
    return data.data;
  },

  acknowledgeEvent: async (id: string, notes?: string): Promise<AlarmEvent> => {
    const { data } = await apiClient.post<ApiResponse<AlarmEvent>>(
      `/alarms/events/${id}/acknowledge`,
      { notes }
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to acknowledge alarm');
    return data.data;
  },
};

// ===========================================
// OEE API
// ===========================================

export interface CreateOEEInput {
  name: string;
  statusTopic: string;
  statusRunningValue?: string;
  statusFormat?: 'numeric' | 'string';
  countTopic?: string;
  idealCycleSeconds?: number;
  rejectTopic?: string;
  plannedHoursPerDay?: number;
  enabled?: boolean;
}

export interface OEEHistoryFilters {
  from?: string;
  to?: string;
  limit?: number;
}

export const oeeApi = {
  getDefinitions: async (): Promise<OEEDefinition[]> => {
    const { data } = await apiClient.get<ApiResponse<OEEDefinition[]>>('/oee/definitions');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch OEE definitions');
    return data.data;
  },

  createDefinition: async (input: CreateOEEInput): Promise<OEEDefinition> => {
    const { data } = await apiClient.post<ApiResponse<OEEDefinition>>('/oee/definitions', input);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create OEE definition');
    return data.data;
  },

  updateDefinition: async (id: string, updates: Partial<CreateOEEInput>): Promise<OEEDefinition> => {
    const { data } = await apiClient.put<ApiResponse<OEEDefinition>>(`/oee/definitions/${id}`, updates);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update OEE definition');
    return data.data;
  },

  deleteDefinition: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/oee/definitions/${id}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete OEE definition');
  },

  getCurrentOEE: async (): Promise<OEEMetrics[]> => {
    const { data } = await apiClient.get<ApiResponse<OEEMetrics[]>>('/oee/current');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch current OEE');
    return data.data;
  },

  getCurrentOEEById: async (id: string): Promise<OEEMetrics> => {
    const { data } = await apiClient.get<ApiResponse<OEEMetrics>>(`/oee/current/${id}`);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch OEE');
    return data.data;
  },

  getHistory: async (id: string, filters?: OEEHistoryFilters): Promise<OEESnapshot[]> => {
    const { data } = await apiClient.get<ApiResponse<OEESnapshot[]>>(`/oee/history/${id}`, { params: filters });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch OEE history');
    return data.data;
  },
};

export default apiClient;

// ===========================================
// Rules API
// ===========================================

export interface RuleFilters {
  enabled?: boolean;
}

export const rulesApi = {
  getAll: async (): Promise<Rule[]> => {
    const { data } = await apiClient.get<ApiResponse<Rule[]>>('/rules');
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch rules');
    return data.data;
  },

  create: async (input: CreateRuleInput): Promise<Rule> => {
    const { data } = await apiClient.post<ApiResponse<Rule>>('/rules', input);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create rule');
    return data.data;
  },

  update: async (id: string, updates: Partial<CreateRuleInput>): Promise<Rule> => {
    const { data } = await apiClient.put<ApiResponse<Rule>>(`/rules/${id}`, updates);
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update rule');
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse>(`/rules/${id}`);
    if (!data.success) throw new Error(data.error || 'Failed to delete rule');
  },

  getExecutions: async (ruleId: string, limit = 100): Promise<RuleExecution[]> => {
    const { data } = await apiClient.get<ApiResponse<RuleExecution[]>>(
      `/rules/${ruleId}/executions`,
      { params: { limit } },
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch executions');
    return data.data;
  },

  getAllExecutions: async (limit = 100): Promise<RuleExecution[]> => {
    const { data } = await apiClient.get<ApiResponse<RuleExecution[]>>(
      '/rules/executions/all',
      { params: { limit } },
    );
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch executions');
    return data.data;
  },
};

// ===========================================
// Anomalies API
// ===========================================

export const anomaliesApi = {
  getAll: async (params?: { limit?: number; topic?: string; acknowledged?: boolean }): Promise<AnomalyDetection[]> => {
    const { data } = await apiClient.get<ApiResponse<AnomalyDetection[]>>('/anomalies', { params });
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch anomalies');
    return data.data;
  },

  acknowledge: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse>(`/anomalies/${id}/acknowledge`);
    if (!data.success) throw new Error(data.error || 'Failed to acknowledge anomaly');
  },
};

// ===========================================
// Export API (returns download URLs)
// ===========================================

export const exportApi = {
  topicCsvUrl: (topic: string, params?: { from?: string; to?: string; limit?: number }) => {
    const base = `${(import.meta.env.VITE_API_URL || '/api')}/export/topics/${encodeURIComponent(topic)}/csv`;
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return base + qs;
  },

  alarmsCsvUrl: (params?: { from?: string; to?: string; priority?: string }) => {
    const base = `${(import.meta.env.VITE_API_URL || '/api')}/export/alarms/csv`;
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return base + qs;
  },

  oeeCsvUrl: (equipmentId: string, params?: { from?: string; to?: string }) => {
    const base = `${(import.meta.env.VITE_API_URL || '/api')}/export/oee/${equipmentId}/csv`;
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
    mqttTopic: string;
    samplingIntervalMs?: number;
    displayName?: string;
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
