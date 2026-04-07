import { useQuery } from '@tanstack/react-query';
import { smProfilesApi } from '../services/api';

export function useSmProfiles() {
  return useQuery({
    queryKey: ['sm-profiles'],
    queryFn: smProfilesApi.getAll,
    staleTime: 300000,
  });
}

export function useSmProfileCategories() {
  return useQuery({
    queryKey: ['sm-profile-categories'],
    queryFn: smProfilesApi.getCategories,
    staleTime: 300000,
  });
}

export function useSmProfile(id: string | null) {
  return useQuery({
    queryKey: ['sm-profile', id],
    queryFn: () => smProfilesApi.getById(id!),
    enabled: !!id,
    staleTime: 300000,
  });
}
