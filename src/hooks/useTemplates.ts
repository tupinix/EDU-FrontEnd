import { useQuery } from '@tanstack/react-query';
import { templatesApi } from '../services/api';
import { SmProfile } from '../types';

export function useTemplates() {
  return useQuery<SmProfile[]>({
    queryKey: ['templates'],
    queryFn: templatesApi.getAll,
    staleTime: 300000,
  });
}

export function useTemplate(id: string | null) {
  return useQuery<SmProfile>({
    queryKey: ['template', id],
    queryFn: () => templatesApi.getById(id!),
    enabled: !!id,
    staleTime: 300000,
  });
}
