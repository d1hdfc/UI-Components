import { useEffect, useState } from 'react';

export type SyncEvent = {
  event: string;
  result?: { createdCount: number; updatedCount: number; deletedCount: number };
  componentName?: string;
  error?: string;
};

export type SyncStatus = 'connecting' | 'connected' | 'disconnected';

export function useSyncWebSocket(url = 'ws://localhost:3055') {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let alive = true;

    function connect() {
      if (!alive) return;
      try {
        ws = new WebSocket(url);

        ws.onopen = () => {
          setStatus('connected');
          ws?.send(JSON.stringify({ type: 'join', channel: 'figma-sync' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'broadcast' && data.message) {
              setLastEvent(data.message);
            }
          } catch { /* ignore */ }
        };

        ws.onclose = () => {
          setStatus('disconnected');
          if (alive) reconnectTimer = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          setStatus('disconnected');
        };
      } catch {
        setStatus('disconnected');
        if (alive) reconnectTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      alive = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [url]);

  return { status, lastEvent };
}
