import { useQuery } from '@tanstack/react-query';
import { topicsApi } from '../services/api';
import { TopicNode, TopicDetail, TopicHistory, TopicStats } from '../types';

export function useTopicTree() {
  return useQuery<TopicNode[], Error>({
    queryKey: ['topics-tree'],
    queryFn: topicsApi.getTree,
    refetchInterval: 6000, // 6 seconds
    staleTime: 3000,
    refetchOnWindowFocus: true,
  });
}

export function useTopicList() {
  return useQuery<string[], Error>({
    queryKey: ['topics-list'],
    queryFn: topicsApi.getList,
    staleTime: 60000, // Keep for 1 minute
  });
}

export function useTopicDetails(topic: string | null) {
  return useQuery<TopicDetail, Error>({
    queryKey: ['topic-details', topic],
    queryFn: () => topicsApi.getDetails(topic!),
    enabled: !!topic,
    refetchInterval: 10000, // 10 seconds when selected
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useTopicHistory(topic: string | null, limit = 100) {
  return useQuery<TopicHistory[], Error>({
    queryKey: ['topic-history', topic, limit],
    queryFn: () => topicsApi.getHistory(topic!, limit),
    enabled: !!topic,
    refetchInterval: 10000,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useTopicStats(topic: string | null) {
  return useQuery<TopicStats[], Error>({
    queryKey: ['topic-stats', topic],
    queryFn: () => topicsApi.getStats(topic!),
    enabled: !!topic,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}

export function useTopicSearch(query: string) {
  return useQuery<string[], Error>({
    queryKey: ['topic-search', query],
    queryFn: () => topicsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 10000,
  });
}
