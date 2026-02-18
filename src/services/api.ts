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
    const { data } = await apiClient.post<ApiResponse<BrokerConfig>>('/brokers', broker);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create broker');
    }
    return data.data;
  },

  update: async (id: string, updates: Partial<BrokerFormData>): Promise<BrokerConfig> => {
    const { data } = await apiClient.put<ApiResponse<BrokerConfig>>(`/brokers/${id}`, updates);
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

import { OpcUaConnection, OpcUaSubscription } from '../types';

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
    sub: { nodeId: string; mqttTopic: string; samplingIntervalMs?: number }
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
};

export default apiClient;
