'use client';

import { useEffect, useRef, useState } from 'react';
import type { SSEItemUpdate } from '@/lib/types';

export function useOrderSSE(orderId: string | null) {
  const [events, setEvents] = useState<SSEItemUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const es = new EventSource(`/api/orders/${orderId}/live`);
    esRef.current = es;

    es.onopen = () => setIsConnected(true);
    es.onmessage = (e) => {
      try {
        const data: SSEItemUpdate = JSON.parse(e.data);
        if (data.type !== 'HEARTBEAT' && data.type !== 'CONNECTED') {
          setEvents((prev) => [data, ...prev].slice(0, 50));
        }
      } catch {/* ignore */}
    };
    es.onerror = () => setIsConnected(false);

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [orderId]);

  return { events, isConnected };
}

export function useGroupSSE(groupId: string | null) {
  const [events, setEvents] = useState<SSEItemUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<SSEItemUpdate['orders']>([]);

  useEffect(() => {
    if (!groupId) return;

    const es = new EventSource(`/api/group/${groupId}/live`);

    es.onopen = () => setIsConnected(true);
    es.onmessage = (e) => {
      try {
        const data: SSEItemUpdate = JSON.parse(e.data);
        if (data.type === 'GROUP_UPDATE' && data.orders) {
          setOrders(data.orders);
        } else if (data.type === 'ITEM_UPDATE') {
          setEvents((prev) => [data, ...prev].slice(0, 50));
        }
      } catch {/* ignore */}
    };
    es.onerror = () => setIsConnected(false);

    return () => es.close();
  }, [groupId]);

  return { events, orders, isConnected };
}
