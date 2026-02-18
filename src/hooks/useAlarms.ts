import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alarmsApi, AlarmEventFilters, CreateAlarmInput } from '../services/api';
import { useSocketContext } from '../providers/SocketProvider';

export function useAlarmDefinitions() {
  return useQuery({
    queryKey: ['alarm-definitions'],
    queryFn: alarmsApi.getDefinitions,
    staleTime: 10000,
  });
}

export function useActiveAlarms() {
  const { isConnected } = useSocketContext();
  return useQuery({
    queryKey: ['alarm-events-active'],
    queryFn: alarmsApi.getActiveAlarms,
    refetchInterval: isConnected ? 10000 : 5000,
    staleTime: 3000,
  });
}

export function useAlarmSummary() {
  const { isConnected } = useSocketContext();
  return useQuery({
    queryKey: ['alarm-summary'],
    queryFn: alarmsApi.getSummary,
    refetchInterval: isConnected ? 10000 : 5000,
    staleTime: 3000,
  });
}

export function useAlarmEvents(filters?: AlarmEventFilters) {
  return useQuery({
    queryKey: ['alarm-events', filters],
    queryFn: () => alarmsApi.getEvents(filters),
    staleTime: 5000,
  });
}

export function useCreateAlarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlarmInput) => alarmsApi.createDefinition(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarm-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['alarm-summary'] });
    },
  });
}

export function useUpdateAlarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateAlarmInput> }) =>
      alarmsApi.updateDefinition(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarm-definitions'] });
    },
  });
}

export function useDeleteAlarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alarmsApi.deleteDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarm-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['alarm-summary'] });
      queryClient.invalidateQueries({ queryKey: ['alarm-events-active'] });
    },
  });
}

export function useAcknowledgeAlarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      alarmsApi.acknowledgeEvent(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarm-events-active'] });
      queryClient.invalidateQueries({ queryKey: ['alarm-events'] });
      queryClient.invalidateQueries({ queryKey: ['alarm-summary'] });
    },
  });
}
