import { vi } from 'vitest';
import axios from 'axios';
import { metricsApi, topicsApi, authApi, brokersApi, healthApi } from '../services/api';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      ...mockAxiosInstance,
    },
  };
});

// Get the mocked axios instance
const mockedAxios = axios.create() as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// Metrics API
// ============================================================
describe('metricsApi', () => {
  it('getSummary should return dashboard metrics on success', async () => {
    const mockMetrics = {
      system: { brokerStatus: 'connected', messagesPerMinute: 100, totalTopics: 50, uptime: 3600 },
      connectors: [],
      recentMessages: [],
      topTopics: [],
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMetrics, timestamp: new Date().toISOString() },
    });

    const result = await metricsApi.getSummary();
    expect(result).toEqual(mockMetrics);
    expect(mockedAxios.get).toHaveBeenCalledWith('/metrics/summary');
  });

  it('getSummary should throw on failure', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: false, error: 'Service unavailable' },
    });

    await expect(metricsApi.getSummary()).rejects.toThrow('Service unavailable');
  });

  it('getSystem should return system metrics', async () => {
    const mockSystem = {
      brokerStatus: 'connected',
      messagesPerMinute: 42,
      totalTopics: 10,
      uptime: 7200,
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockSystem },
    });

    const result = await metricsApi.getSystem();
    expect(result).toEqual(mockSystem);
  });

  it('getConnectors should return connector list', async () => {
    const mockConnectors = [
      { id: '1', name: 'MQTT', type: 'mqtt', status: 'connected' },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockConnectors },
    });

    const result = await metricsApi.getConnectors();
    expect(result).toEqual(mockConnectors);
  });
});

// ============================================================
// Topics API
// ============================================================
describe('topicsApi', () => {
  it('getTree should return topic nodes', async () => {
    const mockTree = [
      { name: 'factory', fullPath: 'factory', children: [], hasValue: false, messageCount: 0 },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockTree },
    });

    const result = await topicsApi.getTree();
    expect(result).toEqual(mockTree);
    expect(mockedAxios.get).toHaveBeenCalledWith('/topics');
  });

  it('getDetails should encode topic in URL', async () => {
    const mockDetail = {
      topic: 'factory/line1/temp',
      payload: 23.5,
      qos: 1,
      retain: false,
      updatedAt: '2025-01-01T00:00:00Z',
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockDetail },
    });

    const result = await topicsApi.getDetails('factory/line1/temp');
    expect(result).toEqual(mockDetail);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `/topics/${encodeURIComponent('factory/line1/temp')}/details`
    );
  });

  it('getHistory should pass limit param', async () => {
    const mockHistory = [{ payload: 23.5, qos: 1, receivedAt: '2025-01-01' }];

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockHistory },
    });

    const result = await topicsApi.getHistory('test/topic', 50);
    expect(result).toEqual(mockHistory);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `/topics/${encodeURIComponent('test/topic')}/history`,
      { params: { limit: 50 } }
    );
  });

  it('search should pass query param', async () => {
    const mockResults = ['factory/temp', 'factory/temperature'];

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockResults },
    });

    const result = await topicsApi.search('temp');
    expect(result).toEqual(mockResults);
    expect(mockedAxios.get).toHaveBeenCalledWith('/topics/search', { params: { q: 'temp' } });
  });

  it('getTree should throw on failure', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: false, error: 'No topics available' },
    });

    await expect(topicsApi.getTree()).rejects.toThrow('No topics available');
  });
});

// ============================================================
// Auth API
// ============================================================
describe('authApi', () => {
  it('login should post credentials and return token + user', async () => {
    const mockResponse = {
      token: 'jwt-token-123',
      user: { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, data: mockResponse },
    });

    const result = await authApi.login('admin@test.com', 'password123');
    expect(result).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@test.com',
      password: 'password123',
    });
  });

  it('login should throw on invalid credentials', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: false, error: 'Credenciais invalidas' },
    });

    await expect(authApi.login('bad@test.com', 'wrong')).rejects.toThrow('Credenciais invalidas');
  });

  it('getMe should return current user', async () => {
    const mockUser = { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'admin' };

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockUser },
    });

    const result = await authApi.getMe();
    expect(result).toEqual(mockUser);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/me');
  });

  it('logout should remove token from localStorage', async () => {
    localStorage.setItem('edu_token', 'some-token');
    await authApi.logout();
    expect(localStorage.getItem('edu_token')).toBeNull();
  });
});

// ============================================================
// Brokers API
// ============================================================
describe('brokersApi', () => {
  it('getAll should return broker list', async () => {
    const mockBrokers = [
      { id: 'b1', name: 'HiveMQ', host: 'test.com', port: 8883, useTls: true, topics: ['#'], status: 'connected' },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockBrokers },
    });

    const result = await brokersApi.getAll();
    expect(result).toEqual(mockBrokers);
  });

  it('create should post broker data', async () => {
    const formData = {
      name: 'New Broker',
      host: 'mqtt.test.com',
      port: 1883,
      username: 'user',
      password: 'pass',
      useTls: false,
      topics: 'sensors/#',
    };

    const mockCreated = { ...formData, id: 'b2', status: 'disconnected' };

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, data: mockCreated },
    });

    const result = await brokersApi.create(formData);
    expect(result).toEqual(mockCreated);
    expect(mockedAxios.post).toHaveBeenCalledWith('/brokers', formData);
  });

  it('connect should post to broker connect endpoint', async () => {
    const mockBroker = { id: 'b1', name: 'HiveMQ', status: 'connected' };

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, data: mockBroker },
    });

    const result = await brokersApi.connect('b1');
    expect(result).toEqual(mockBroker);
    expect(mockedAxios.post).toHaveBeenCalledWith('/brokers/b1/connect');
  });

  it('delete should call delete endpoint', async () => {
    mockedAxios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    await brokersApi.delete('b2');
    expect(mockedAxios.delete).toHaveBeenCalledWith('/brokers/b2');
  });
});

// ============================================================
// Health API
// ============================================================
describe('healthApi', () => {
  it('check should return status', async () => {
    const mockHealth = { status: 'healthy', timestamp: '2025-01-01T00:00:00Z' };

    mockedAxios.get.mockResolvedValueOnce({ data: mockHealth });

    const result = await healthApi.check();
    expect(result).toEqual(mockHealth);
    expect(mockedAxios.get).toHaveBeenCalledWith('/health');
  });
});
