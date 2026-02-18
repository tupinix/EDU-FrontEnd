import { useEffect, useCallback } from 'react';
import { useSocketContext } from '../providers/SocketProvider';

export function useSocket<T = unknown>(
  event: string,
  callback: (data: T) => void,
  enabled = true
) {
  const { socket, isConnected } = useSocketContext();

  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!socket || !isConnected || !enabled) return;

    socket.on(event, stableCallback);

    return () => {
      socket.off(event, stableCallback);
    };
  }, [socket, isConnected, event, stableCallback, enabled]);

  return { isConnected };
}

export function useSocketStatus() {
  const { isConnected, mode } = useSocketContext();
  return { isConnected, mode };
}
