import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { ethipApi } from '../services/api';
import { EthipConnection, EthipTag, EthipDiscoveredTag, EthipLiveValue } from '../types';
import { useSocket } from './useSocket';

export function useEthipConnections() {
  return useQuery<EthipConnection[], Error>({
    queryKey: ['ethip-connections'],
    queryFn: ethipApi.getConnections,
    staleTime: 10000,
  });
}

export function useCreateEthipConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ethipApi.createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethip-connections'] });
    },
  });
}

export function useDeleteEthipConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ethipApi.deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethip-connections'] });
    },
  });
}

export function useConnectEthip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ethipApi.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethip-connections'] });
    },
  });
}

export function useDisconnectEthip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ethipApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethip-connections'] });
    },
  });
}

export function useEthipDiscoverTags(connId: string | null) {
  return useQuery<EthipDiscoveredTag[], Error>({
    queryKey: ['ethip-discover-tags', connId],
    queryFn: () => ethipApi.discoverTags(connId!),
    enabled: !!connId,
    staleTime: 30000,
  });
}

export function useEthipSubscribedTags(connId: string | null) {
  return useQuery<EthipTag[], Error>({
    queryKey: ['ethip-subscribed-tags', connId],
    queryFn: () => ethipApi.getSubscribedTags(connId!),
    enabled: !!connId,
    staleTime: 10000,
  });
}

export function useCreateEthipTag(connId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { tagName: string; mqttTopic: string; samplingIntervalMs?: number; displayName?: string; brokerId?: string }) =>
      ethipApi.subscribeTag(connId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethip-subscribed-tags', connId] });
      queryClient.invalidateQueries({ queryKey: ['ethip-discover-tags', connId] });
    },
  });
}

export function useDeleteEthipTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ethipApi.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethip-subscribed-tags'] });
    },
  });
}

export function useEthipLiveValues(connectionId: string | null) {
  const [liveMap, setLiveMap] = useState<Map<string, EthipLiveValue>>(new Map());

  const { data: seedData } = useQuery({
    queryKey: ['ethip-live-values', connectionId],
    queryFn: () => ethipApi.getValues(connectionId!),
    enabled: !!connectionId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!seedData) return;
    setLiveMap(prev => {
      const next = new Map(prev);
      for (const v of seedData) next.set(`${v.connectionId}::${v.tagName}`, v);
      return next;
    });
  }, [seedData]);

  const handleValueChange = useCallback((v: EthipLiveValue) => {
    if (connectionId && v.connectionId !== connectionId) return;
    setLiveMap(prev => {
      const next = new Map(prev);
      next.set(`${v.connectionId}::${v.tagName}`, v);
      return next;
    });
  }, [connectionId]);

  useSocket<EthipLiveValue>('ethip:value-change', handleValueChange, !!connectionId);

  return Array.from(liveMap.values());
}
