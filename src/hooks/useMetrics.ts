import { useQuery } from '@tanstack/react-query';
import { metricsApi, brokersApi } from '../services/api';
import { DashboardMetrics, SystemMetrics, ConnectorStatus, BrokerConfig } from '../types';

// Balanced intervals for performance
export function useDashboardMetrics() {
  return useQuery<DashboardMetrics, Error>({
    queryKey: ['dashboard-metrics'],
    queryFn: metricsApi.getSummary,
    refetchInterval: 6000, // 6 seconds
    staleTime: 3000,
    refetchOnWindowFocus: true,
  });
}

export function useSystemMetrics() {
  return useQuery<SystemMetrics, Error>({
    queryKey: ['system-metrics'],
    queryFn: metricsApi.getSystem,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useBrokerStatus() {
  return useQuery<{ status: string; latency?: number }, Error>({
    queryKey: ['broker-status'],
    queryFn: metricsApi.getBrokerStatus,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useConnectors() {
  return useQuery<ConnectorStatus[], Error>({
    queryKey: ['connectors'],
    queryFn: metricsApi.getConnectors,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useActiveBroker() {
  return useQuery<BrokerConfig | null, Error>({
    queryKey: ['active-broker'],
    queryFn: brokersApi.getActive,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useBrokersStatus() {
  return useQuery<{ brokers: BrokerConfig[]; activeBrokerId: string | null }, Error>({
    queryKey: ['brokers-status'],
    queryFn: brokersApi.getStatus,
    refetchInterval: 10000,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}
