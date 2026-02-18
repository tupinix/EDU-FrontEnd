import { useQuery } from '@tanstack/react-query';
import { metricsApi, brokersApi } from '../services/api';
import { DashboardMetrics, SystemMetrics, ConnectorStatus, BrokerConfig } from '../types';
import { useSocketContext } from '../providers/SocketProvider';

// When WebSocket is connected, reduce polling frequency (WS pushes invalidations)
// When disconnected, fall back to normal polling intervals

export function useDashboardMetrics() {
  const { isConnected } = useSocketContext();
  return useQuery<DashboardMetrics, Error>({
    queryKey: ['dashboard-metrics'],
    queryFn: metricsApi.getSummary,
    refetchInterval: isConnected ? 30000 : 6000, // 30s with WS, 6s without
    staleTime: isConnected ? 10000 : 3000,
    refetchOnWindowFocus: true,
  });
}

export function useSystemMetrics() {
  const { isConnected } = useSocketContext();
  return useQuery<SystemMetrics, Error>({
    queryKey: ['system-metrics'],
    queryFn: metricsApi.getSystem,
    refetchInterval: isConnected ? 30000 : 10000,
    staleTime: isConnected ? 15000 : 5000,
    refetchOnWindowFocus: true,
  });
}

export function useBrokerStatus() {
  const { isConnected } = useSocketContext();
  return useQuery<{ status: string; latency?: number }, Error>({
    queryKey: ['broker-status'],
    queryFn: metricsApi.getBrokerStatus,
    refetchInterval: isConnected ? 30000 : 10000,
    staleTime: isConnected ? 15000 : 5000,
    refetchOnWindowFocus: true,
  });
}

export function useConnectors() {
  const { isConnected } = useSocketContext();
  return useQuery<ConnectorStatus[], Error>({
    queryKey: ['connectors'],
    queryFn: metricsApi.getConnectors,
    refetchInterval: isConnected ? 30000 : 10000,
    staleTime: isConnected ? 15000 : 5000,
  });
}

export function useActiveBroker() {
  const { isConnected } = useSocketContext();
  return useQuery<BrokerConfig | null, Error>({
    queryKey: ['active-broker'],
    queryFn: brokersApi.getActive,
    refetchInterval: isConnected ? 30000 : 10000,
    staleTime: isConnected ? 15000 : 5000,
    refetchOnWindowFocus: true,
  });
}

export function useBrokersStatus() {
  const { isConnected } = useSocketContext();
  return useQuery<{ brokers: BrokerConfig[]; activeBrokerId: string | null }, Error>({
    queryKey: ['brokers-status'],
    queryFn: brokersApi.getStatus,
    refetchInterval: isConnected ? 30000 : 10000,
    staleTime: isConnected ? 15000 : 5000,
    refetchOnWindowFocus: true,
  });
}
