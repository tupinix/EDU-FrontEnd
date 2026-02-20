import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesApi } from '../services/api';
import { Rule, CreateRuleInput } from '../types';

export function useRules() {
  return useQuery<Rule[], Error>({
    queryKey: ['rules'],
    queryFn: rulesApi.getAll,
    staleTime: 10000,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRuleInput) => rulesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateRuleInput> }) =>
      rulesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['rule-executions'] });
    },
  });
}

export function useRuleExecutions(ruleId?: string) {
  return useQuery({
    queryKey: ['rule-executions', ruleId],
    queryFn: () =>
      ruleId ? rulesApi.getExecutions(ruleId) : rulesApi.getAllExecutions(),
    staleTime: 15000,
  });
}
