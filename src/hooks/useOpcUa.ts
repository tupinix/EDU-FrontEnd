import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opcuaApi } from '../services/api';
import { OpcUaConnection, OpcUaSubscription } from '../types';

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
    mutationFn: ({ connectionId, ...data }: { connectionId: string; nodeId: string; mqttTopic: string; samplingIntervalMs?: number }) =>
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
