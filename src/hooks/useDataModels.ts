import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataModelsApi } from '../services/api';
import { DataModel } from '../types';

export function useDataModels() {
  return useQuery<DataModel[], Error>({
    queryKey: ['data-models'],
    queryFn: dataModelsApi.getAll,
    staleTime: 10000,
  });
}

export function useCreateDataModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataModelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-models'] });
    },
  });
}

export function useUpdateDataModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      dataModelsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-models'] });
    },
  });
}

export function useDeleteDataModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataModelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-models'] });
    },
  });
}

export function useToggleDataModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataModelsApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-models'] });
    },
  });
}

export function useTestDataModel() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      dataModelsApi.test(id, payload),
  });
}
