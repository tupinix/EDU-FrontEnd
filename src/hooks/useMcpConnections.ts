import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcpApi } from '../services/api';
import { McpToken, McpTokenCreated } from '../types';

export function useMcpTokens() {
  return useQuery<McpToken[], Error>({
    queryKey: ['mcp-tokens'],
    queryFn: mcpApi.listTokens,
    staleTime: 30000,
  });
}

export function useCreateMcpToken() {
  const queryClient = useQueryClient();
  return useMutation<McpTokenCreated, Error, { name: string; expiresIn?: string }>({
    mutationFn: mcpApi.createToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-tokens'] });
    },
  });
}

export function useDeleteMcpToken() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: mcpApi.deleteToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-tokens'] });
    },
  });
}
