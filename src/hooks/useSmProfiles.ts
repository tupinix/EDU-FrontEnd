import { useQuery } from '@tanstack/react-query';
import { smProfilesApi } from '../services/api';
import { SmProfile } from '../types';

export function useSmProfiles() {
  return useQuery<SmProfile[]>({
    queryKey: ['sm-profiles'],
    queryFn: smProfilesApi.getAll,
    staleTime: 300000,
  });
}

export function useSmProfileCategories() {
  return useQuery<string[]>({
    queryKey: ['sm-profile-categories'],
    queryFn: smProfilesApi.getCategories,
    staleTime: 300000,
  });
}

export function useSmProfile(id: string | null) {
  return useQuery<SmProfile>({
    queryKey: ['sm-profile', id],
    queryFn: () => smProfilesApi.getById(id!),
    enabled: !!id,
    staleTime: 300000,
  });
}
