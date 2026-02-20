import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oeeApi, CreateOEEInput, OEEHistoryFilters } from '../services/api';
import { useSocketContext } from '../providers/SocketProvider';

export function useOEEDefinitions() {
  return useQuery({
    queryKey: ['oee-definitions'],
    queryFn: oeeApi.getDefinitions,
    staleTime: 10000,
  });
}

export function useCurrentOEE() {
  const { isConnected } = useSocketContext();
  return useQuery({
    queryKey: ['oee-current'],
    queryFn: oeeApi.getCurrentOEE,
    refetchInterval: isConnected ? 10000 : 5000,
    staleTime: 3000,
  });
}

export function useOEEHistory(id: string, filters?: OEEHistoryFilters) {
  return useQuery({
    queryKey: ['oee-history', id, filters],
    queryFn: () => oeeApi.getHistory(id, filters),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateOEE() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOEEInput) => oeeApi.createDefinition(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oee-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['oee-current'] });
    },
  });
}

export function useUpdateOEE() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateOEEInput> }) =>
      oeeApi.updateDefinition(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oee-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['oee-current'] });
    },
  });
}

export function useDeleteOEE() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => oeeApi.deleteDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oee-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['oee-current'] });
    },
  });
}
