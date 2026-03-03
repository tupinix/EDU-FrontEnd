import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { modbusApi } from '../services/api';
import { ModbusConnection, ModbusRegister, ModbusLiveValue } from '../types';
import { useSocket } from './useSocket';

export function useModbusConnections() {
  return useQuery<ModbusConnection[], Error>({
    queryKey: ['modbus-connections'],
    queryFn: modbusApi.getConnections,
    staleTime: 10000,
  });
}

export function useModbusConnection(id: string | null) {
  return useQuery<ModbusConnection, Error>({
    queryKey: ['modbus-connection', id],
    queryFn: () => modbusApi.getConnectionById(id!),
    enabled: !!id,
    staleTime: 5000,
  });
}

export function useCreateModbusConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: modbusApi.createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modbus-connections'] });
    },
  });
}

export function useUpdateModbusConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Parameters<typeof modbusApi.updateConnection>[1]) =>
      modbusApi.updateConnection(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modbus-connections'] });
    },
  });
}

export function useDeleteModbusConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: modbusApi.deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modbus-connections'] });
    },
  });
}

export function useConnectModbus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: modbusApi.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modbus-connections'] });
    },
  });
}

export function useDisconnectModbus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: modbusApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modbus-connections'] });
    },
  });
}

export function useModbusRegisters(connectionId: string | null) {
  return useQuery<ModbusRegister[], Error>({
    queryKey: ['modbus-registers', connectionId],
    queryFn: () => modbusApi.getRegisters(connectionId!),
    enabled: !!connectionId,
    staleTime: 10000,
  });
}

export function useCreateModbusRegister(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (register: Parameters<typeof modbusApi.createRegister>[1]) =>
      modbusApi.createRegister(connectionId, register),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modbus-registers', connectionId] });
    },
  });
}

export function useDeleteModbusRegister(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (regId: string) => modbusApi.deleteRegister(connectionId, regId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modbus-registers', connectionId] });
    },
  });
}

export function useModbusLiveValues(connectionId: string | null) {
  const [liveMap, setLiveMap] = useState<Map<string, ModbusLiveValue>>(new Map());

  const { data: seedData } = useQuery({
    queryKey: ['modbus-live-values', connectionId],
    queryFn: () => modbusApi.getLiveValues(connectionId!),
    enabled: !!connectionId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!seedData) return;
    setLiveMap(prev => {
      const next = new Map(prev);
      for (const v of seedData) next.set(`${v.connectionId}::${v.registerId}`, v);
      return next;
    });
  }, [seedData]);

  const handleValueChange = useCallback((v: ModbusLiveValue) => {
    if (connectionId && v.connectionId !== connectionId) return;
    setLiveMap(prev => {
      const next = new Map(prev);
      next.set(`${v.connectionId}::${v.registerId}`, v);
      return next;
    });
  }, [connectionId]);

  useSocket<ModbusLiveValue>('modbus:value-change', handleValueChange, !!connectionId);

  return Array.from(liveMap.values());
}
