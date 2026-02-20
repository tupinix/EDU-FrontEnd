import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { opcuaApi } from '../services/api';
import { OpcUaConnection, OpcUaSubscription, NodeLiveValue } from '../types';
import { useSocket } from './useSocket';

export function useOpcUaConnections() {
  return useQuery<OpcUaConnection[], Error>({
    queryKey: ['opcua-connections'],
    queryFn: opcuaApi.getConnections,
    staleTime: 10000,
  });
}

export function useOpcUaConnection(id: string | null) {
  return useQuery<OpcUaConnection, Error>({
    queryKey: ['opcua-connection', id],
    queryFn: () => opcuaApi.getConnectionById(id!),
    enabled: !!id,
    staleTime: 5000,
  });
}

export function useOpcUaSubscriptions(connectionId?: string) {
  return useQuery<OpcUaSubscription[], Error>({
    queryKey: ['opcua-subscriptions', connectionId],
    queryFn: () => opcuaApi.getSubscriptions(connectionId),
    staleTime: 10000,
  });
}

export function useOpcUaBrowse(connectionId: string | null, nodeId?: string) {
  return useQuery({
    queryKey: ['opcua-browse', connectionId, nodeId],
    queryFn: () => opcuaApi.browse(connectionId!, nodeId),
    enabled: !!connectionId,
    staleTime: 30000,
  });
}

export function useCreateOpcUaConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: opcuaApi.createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opcua-connections'] });
    },
  });
}

export function useDeleteOpcUaConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: opcuaApi.deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opcua-connections'] });
    },
  });
}

export function useConnectOpcUa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: opcuaApi.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opcua-connections'] });
    },
  });
}

export function useDisconnectOpcUa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: opcuaApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opcua-connections'] });
    },
  });
}

export function useCreateOpcUaSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, ...data }: { connectionId: string; nodeId: string; mqttTopic: string; samplingIntervalMs?: number; brokerId?: string }) =>
      opcuaApi.createSubscription(connectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opcua-subscriptions'] });
    },
  });
}

export function useDeleteOpcUaSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: opcuaApi.deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opcua-subscriptions'] });
    },
  });
}

export function useOpcUaLiveValues(connectionId: string | null) {
  const [liveMap, setLiveMap] = useState<Map<string, NodeLiveValue>>(new Map());

  // Seed with values already in-memory on the server
  const { data: seedData } = useQuery({
    queryKey: ['opcua-live-values', connectionId],
    queryFn: () => opcuaApi.getLiveValues(connectionId!),
    enabled: !!connectionId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!seedData) return;
    setLiveMap(prev => {
      const next = new Map(prev);
      for (const v of seedData) next.set(`${v.connectionId}::${v.nodeId}`, v);
      return next;
    });
  }, [seedData]);

  // Real-time updates via WebSocket
  const handleValueChange = useCallback((v: NodeLiveValue) => {
    if (connectionId && v.connectionId !== connectionId) return;
    setLiveMap(prev => {
      const next = new Map(prev);
      next.set(`${v.connectionId}::${v.nodeId}`, v);
      return next;
    });
  }, [connectionId]);

  useSocket<NodeLiveValue>('opcua:value-change', handleValueChange, !!connectionId);

  return Array.from(liveMap.values());
}
