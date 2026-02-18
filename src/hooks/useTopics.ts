import { useQuery } from '@tanstack/react-query';
import { topicsApi } from '../services/api';
import { TopicNode, TopicDetail, TopicHistory, TopicStats } from '../types';
import { useSocketContext } from '../providers/SocketProvider';

// When WebSocket is connected, reduce polling frequency (WS pushes invalidations)
// When disconnected, fall back to normal polling intervals

export function useTopicTree() {
  const { isConnected } = useSocketContext();
  return useQuery<TopicNode[], Error>({
    queryKey: ['topics-tree'],
    queryFn: topicsApi.getTree,
    refetchInterval: isConnected ? 30000 : 6000, // 30s with WS, 6s without
    staleTime: isConnected ? 10000 : 3000,
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
  const { isConnected } = useSocketContext();
  return useQuery<TopicDetail, Error>({
    queryKey: ['topic-details', topic],
    queryFn: () => topicsApi.getDetails(topic!),
    enabled: !!topic,
    refetchInterval: isConnected ? 30000 : 10000,
    staleTime: isConnected ? 15000 : 5000,
    refetchOnWindowFocus: true,
  });
}

export function useTopicHistory(topic: string | null, limit = 100) {
  const { isConnected } = useSocketContext();
  return useQuery<TopicHistory[], Error>({
    queryKey: ['topic-history', topic, limit],
    queryFn: () => topicsApi.getHistory(topic!, limit),
    enabled: !!topic,
    refetchInterval: isConnected ? 30000 : 10000,
    staleTime: isConnected ? 15000 : 5000,
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
