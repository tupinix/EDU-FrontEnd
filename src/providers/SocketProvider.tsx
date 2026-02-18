import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';
import { useAuthStore } from '../hooks/useStore';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  mode: 'realtime' | 'polling';
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  mode: 'polling',
});

export function useSocketContext() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const handleConnect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  // Invalidate React Query caches on WS events
  const handleMqttMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['topics-tree'] });
  }, [queryClient]);

  const handleBrokerStatus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['active-broker'] });
    queryClient.invalidateQueries({ queryKey: ['brokers-status'] });
  }, [queryClient]);

  const handleMetricsUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['system-metrics'] });
  }, [queryClient]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = getSocket();
    setSocket(s);

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    s.on('mqtt:message', handleMqttMessage);
    s.on('mqtt:broker-status', handleBrokerStatus);
    s.on('metrics:update', handleMetricsUpdate);

    connectSocket();

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.off('mqtt:message', handleMqttMessage);
      s.off('mqtt:broker-status', handleBrokerStatus);
      s.off('metrics:update', handleMetricsUpdate);
      disconnectSocket();
    };
  }, [isAuthenticated, handleConnect, handleDisconnect, handleMqttMessage, handleBrokerStatus, handleMetricsUpdate]);

  const mode = isConnected ? 'realtime' : 'polling';

  return (
    <SocketContext.Provider value={{ socket, isConnected, mode }}>
      {children}
    </SocketContext.Provider>
  );
}
