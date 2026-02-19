'use client';

import { useGroupSSE } from '@/hooks/useOrderSSE';
import type { Order } from '@/lib/types';

interface Props {
  groupId: string;
  initialOrders: Partial<Order>[];
  onClose: () => void;
}

const ITEM_STATUS_COLOR: Record<string, string> = {
  RECEIVED: 'bg-yellow-400',
  PREPARING: 'bg-orange-400',
  READY: 'bg-green-500',
  COLLECTED: 'bg-gray-400',
};

export default function LiveOrderTracker({ groupId, initialOrders, onClose }: Props) {
  const { events, orders: liveOrders, isConnected } = useGroupSSE(groupId);
  const orders = liveOrders?.length ? liveOrders : initialOrders;

  const allItems = orders.flatMap((o) => o.items ?? []);
  const readyItems = allItems.filter((i) => i.status === 'READY' || i.status === 'COLLECTED');
  const progress = allItems.length > 0 ? Math.round((readyItems.length / allItems.length) * 100) : 0;

  // Group ready items by collection station
  const byStation: Record<string, typeof allItems> = {};
  allItems
    .filter((i) => i.status === 'READY')
    .forEach((i) => {
      const station = (i.vendor as { collectionPoint?: string | null })?.collectionPoint ?? 'Collection';
      if (!byStation[station]) byStation[station] = [];
      byStation[station].push(i);
    });

  const cookingItems = allItems.filter((i) => i.status === 'RECEIVED' || i.status === 'PREPARING');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-5 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Live Order Tracker</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-ping-slow' : 'bg-red-400'}`} />
                <span className="text-sm text-purple-200">{isConnected ? 'Live' : 'Reconnecting…'}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">×</button>
          </div>

          {/* Progress ring */}
          <div className="mt-4 flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${progress} ${100 - progress}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{progress}%</span>
            </div>
            <div>
              <p className="text-sm text-purple-200">Order progress</p>
              <p className="font-bold">{readyItems.length} of {allItems.length} items ready</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Items ready by station */}
          {Object.entries(byStation).map(([station, stationItems]) => (
            <div key={station} className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-bold text-green-800 flex items-center gap-2 mb-2">
                ✅ {station} — Ready to collect!
              </p>
              {stationItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-green-700">
                  <span>•</span>
                  <span>{item.quantity ?? 1}× {(item.menuItem as { name?: string })?.name ?? 'Item'}</span>
                  <span className="text-green-500 text-xs">({(item.vendor as { name?: string })?.name})</span>
                </div>
              ))}
            </div>
          ))}

          {/* Cooking items */}
          {cookingItems.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                👨‍🍳 Still Cooking
              </p>
              {cookingItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-orange-700 mb-1">
                  <span className={`w-2 h-2 rounded-full ${ITEM_STATUS_COLOR[item.status ?? 'RECEIVED']}`} />
                  <span>{item.quantity ?? 1}× {(item.menuItem as { name?: string })?.name ?? 'Item'}</span>
                  <span className="text-orange-400 text-xs">@ {(item.vendor as { name?: string })?.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent events */}
          {events.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Updates</p>
              <div className="space-y-1">
                {events.slice(0, 5).map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                    <span className={`w-2 h-2 rounded-full ${ITEM_STATUS_COLOR[ev.itemStatus ?? 'RECEIVED']}`} />
                    <span className="text-gray-700">{ev.itemName}</span>
                    <span className="text-gray-400 text-xs ml-auto">{ev.itemStatus?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allItems.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">📦</p>
              <p>Order processing…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
