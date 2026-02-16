import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/api';
import { ReportResult } from '../types';

export function useGenerateReport() {
  return useMutation<ReportResult, Error, string>({
    mutationFn: (prompt: string) => reportsApi.generate(prompt),
  });
}

export function useAvailableTopics() {
  return useQuery<string[], Error>({
    queryKey: ['report-topics'],
    queryFn: reportsApi.getTopics,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}
