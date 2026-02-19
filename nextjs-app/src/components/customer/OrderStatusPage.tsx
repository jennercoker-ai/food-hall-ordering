'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Order } from '@/lib/types';
import { useOrderSSE } from '@/hooks/useOrderSSE';

const ORDER_TYPE_CONFIG = {
  DINE_IN:    { icon: '🍽️', label: 'Dine In' },
  COLLECTION: { icon: '🛍️', label: 'Collection' },
  DELIVERY:   { icon: '🚚', label: 'Delivery' },
};

const STATUS_CONFIG = {
  PENDING:   { icon: '⏳', label: 'Order Received',  color: 'from-yellow-400 to-amber-500' },
  PAID:      { icon: '💳', label: 'Payment Confirmed', color: 'from-blue-400 to-blue-500' },
  COMPLETED: { icon: '🎉', label: 'Ready!',           color: 'from-green-400 to-emerald-500' },
  CANCELLED: { icon: '❌', label: 'Cancelled',        color: 'from-red-400 to-red-500' },
};

interface Props { order: Order }

export default function OrderStatusPage({ order: initial }: Props) {
  const [order, setOrder] = useState<Order>(initial);
  const { events, isConnected } = useOrderSSE(order.id);

  // Re-fetch on any SSE event that signals order-level status change
  useEffect(() => {
    const latestOrderUpdate = events.find((e) => e.type === 'ITEM_UPDATE');
    if (latestOrderUpdate?.allReady) {
      fetch(`/api/orders/${order.id}`)
        .then((r) => r.json())
        .then(setOrder)
        .catch(() => null);
    }
  }, [events, order.id]);

  const typeConf = ORDER_TYPE_CONFIG[order.orderType] ?? ORDER_TYPE_CONFIG.DINE_IN;
  const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;

  const readyItems = order.items?.filter((i) => i.status === 'READY' || i.status === 'COLLECTED') ?? [];
  const total = order.items?.length ?? 0;
  const progress = total > 0 ? Math.round((readyItems.length / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 p-4">
      <div className="max-w-xl mx-auto pt-6 pb-12 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className={`bg-gradient-to-r ${statusConf.color} p-8 text-center text-white`}>
            <p className="text-6xl mb-3">{statusConf.icon}</p>
            <h1 className="text-2xl font-black mb-1">{statusConf.label}</h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                #{order.id.slice(-6).toUpperCase()}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                {typeConf.icon} {typeConf.label}
              </span>
              <span className={`w-2 h-2 rounded-full ml-1 ${isConnected ? 'bg-green-300 animate-pulse' : 'bg-white/40'}`} />
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Order Progress</span>
                <span className="font-bold text-purple-700">{readyItems.length}/{total} ready</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Details */}
          <div className="p-6 space-y-3">
            {order.orderType === 'DINE_IN' && order.tableNumber && (
              <InfoRow icon="🍽️" label="Table" value={order.tableNumber} />
            )}
            {order.orderType === 'DELIVERY' && order.deliveryAddress && (
              <InfoRow icon="🚚" label="Delivering to" value={order.deliveryAddress} />
            )}
            {order.customerPhone && (
              <InfoRow icon="📱" label="Updates sent to" value={order.customerPhone} />
            )}

            <h3 className="font-bold text-gray-800 pt-2">Items</h3>
            <div className="space-y-2">
              {order.items?.map((item) => {
                const name = (item.menuItem as { name?: string })?.name ?? '—';
                const station = (item.vendor as { collectionPoint?: string | null })?.collectionPoint;
                return (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.status === 'READY' || item.status === 'COLLECTED' ? 'bg-green-500' :
                      item.status === 'PREPARING' ? 'bg-orange-400 animate-pulse' : 'bg-yellow-400'
                    }`} />
                    <span className="flex-1 text-gray-800">{item.quantity}× {name}</span>
                    {item.status === 'READY' && station && (
                      <span className="text-xs text-green-700 font-medium">📍 {station}</span>
                    )}
                    <span className="text-xs text-gray-400 capitalize">{item.status?.toLowerCase().replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t flex justify-between font-bold text-lg">
              <span className="text-gray-800">Total</span>
              <span className="text-purple-700">£{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Recent updates */}
        {events.filter((e) => e.type === 'ITEM_UPDATE').length > 0 && (
          <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Live Updates</h3>
            <div className="space-y-2">
              {events.filter((e) => e.type === 'ITEM_UPDATE').slice(0, 4).map((ev, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                  <span>✅</span>
                  <span><strong>{ev.itemName}</strong> is {ev.itemStatus}</span>
                  {ev.station && <span className="text-purple-600">→ {ev.station}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/"
          className="w-full block text-center py-4 bg-white text-purple-700 rounded-2xl font-bold shadow hover:shadow-lg transition"
        >
          🏠 Back to Food Hall
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span>{icon}</span>
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
