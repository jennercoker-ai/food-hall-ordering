'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ItemStatus } from '@/lib/types';
import KDSCard from './KDSCard';

interface KDSItem {
  id: string;
  orderId: string;
  orderNumber: string;
  name: string;
  quantity: number;
  guestName?: string | null;
  status: ItemStatus;
  order?: {
    specialInstructions?: string | null;
    tableNumber?: string | null;
    orderType?: string;
    createdAt?: string;
  };
}

interface Props {
  vendorId: string;
  vendorName: string;
  collectionPoint?: string | null;
  initialItems: KDSItem[];
}

type FilterType = 'active' | 'ready' | 'all';

const STATUS_ORDER: Record<ItemStatus, number> = {
  RECEIVED: 0, PREPARING: 1, READY: 2, COLLECTED: 3,
};

export default function KDSBoard({ vendorId, vendorName, collectionPoint, initialItems }: Props) {
  const [items, setItems] = useState<KDSItem[]>(initialItems);
  const [filter, setFilter] = useState<FilterType>('active');
  const [isConnected, setIsConnected] = useState(false);
  const [clock, setClock] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Poll for new items every 10s
  const refreshItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}/order-items`);
      if (res.ok) setItems(await res.json());
    } catch {/* silent */}
  }, [vendorId]);

  useEffect(() => {
    const interval = setInterval(refreshItems, 10_000);
    return () => clearInterval(interval);
  }, [refreshItems]);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket (best-effort)
  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'NEW_ORDER') refreshItems();
        } catch {/* ignore */}
      };
      return () => ws.close();
    } catch {
      // WS not available — polling fallback only
    }
  }, [refreshItems]);

  const handleStatusChange = (itemId: string, newStatus: ItemStatus) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i)),
    );
  };

  const visible = items.filter((i) => {
    if (filter === 'active') return i.status === 'RECEIVED' || i.status === 'PREPARING';
    if (filter === 'ready') return i.status === 'READY';
    return i.status !== 'COLLECTED';
  });

  const sorted = [...visible].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      new Date(a.order?.createdAt ?? 0).getTime() - new Date(b.order?.createdAt ?? 0).getTime(),
  );

  const stats = {
    new: items.filter((i) => i.status === 'RECEIVED').length,
    cooking: items.filter((i) => i.status === 'PREPARING').length,
    ready: items.filter((i) => i.status === 'READY').length,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-mono">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">🍳 KDS</h1>
            <span className="text-slate-400">|</span>
            <span className="text-orange-400 font-bold text-xl">{vendorName}</span>
            {collectionPoint && (
              <span className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded">
                📍 {collectionPoint}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${isConnected ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {isConnected ? 'LIVE' : 'POLLING'}
            </div>
            <span className="text-slate-400 text-sm tabular-nums">{clock}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <Stat color="yellow" count={stats.new} label="New" />
          <Stat color="orange" count={stats.cooking} label="Cooking" />
          <Stat color="green" count={stats.ready} label="Ready" />

          <div className="ml-auto flex bg-slate-700 rounded-lg p-1">
            {(['active', 'ready', 'all'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === f ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        {sorted.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">✨</p>
            <p className="text-2xl font-bold text-slate-400">No active orders</p>
            <p className="text-slate-500 mt-2">New orders appear here in real time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((item) => (
              <KDSCard key={item.id} item={item} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ color, count, label }: { color: 'yellow' | 'orange' | 'green'; count: number; label: string }) {
  const colors = {
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full bg-current ${colors[color]}`} />
      <span className={`font-bold ${colors[color]}`}>{count}</span>
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
  );
}
