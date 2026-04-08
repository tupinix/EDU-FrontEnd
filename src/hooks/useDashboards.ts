import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardsApi } from '../services/api';
import { ProcessDashboard } from '../types';

export function useDashboards() {
  return useQuery<ProcessDashboard[], Error>({
    queryKey: ['dashboards'],
    queryFn: dashboardsApi.getAll,
    staleTime: 10000,
  });
}

export function useDashboard(id: string | null) {
  return useQuery<ProcessDashboard, Error>({
    queryKey: ['dashboards', id],
    queryFn: () => dashboardsApi.getById(id!),
    enabled: !!id,
    staleTime: 10000,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      dashboardsApi.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboards', variables.id] });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useDuplicateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}
