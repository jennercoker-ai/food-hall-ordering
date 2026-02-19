'use client';

import { useState } from 'react';
import type { ItemStatus } from '@/lib/types';

const STATUS_STYLES: Record<ItemStatus, { border: string; badge: string; label: string }> = {
  RECEIVED:  { border: 'border-yellow-400', badge: 'bg-yellow-400 text-yellow-900', label: 'NEW' },
  PREPARING: { border: 'border-orange-500', badge: 'bg-orange-500 text-white',      label: 'COOKING' },
  READY:     { border: 'border-green-500',  badge: 'bg-green-500 text-white',       label: 'READY' },
  COLLECTED: { border: 'border-gray-400',   badge: 'bg-gray-400 text-white',        label: 'DONE' },
};

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
  };
}

interface Props {
  item: KDSItem;
  onStatusChange: (itemId: string, status: ItemStatus) => void;
}

export default function KDSCard({ item, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);
  const style = STATUS_STYLES[item.status] ?? STATUS_STYLES.RECEIVED;

  const advance = async () => {
    const next: ItemStatus =
      item.status === 'RECEIVED' ? 'PREPARING' :
      item.status === 'PREPARING' ? 'READY' :
      item.status === 'READY' ? 'COLLECTED' : 'COLLECTED';

    setLoading(true);
    try {
      const res = await fetch(`/api/order-items/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) onStatusChange(item.id, next);
    } finally {
      setLoading(false);
    }
  };

  if (item.status === 'COLLECTED') return null;

  return (
    <div className={`bg-slate-800 border-l-4 ${style.border} rounded-r-xl p-4 flex flex-col gap-3`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded font-mono">
            #{item.orderNumber}
          </span>
          {item.order?.tableNumber && (
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">
              🍽️ T{item.order.tableNumber}
            </span>
          )}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Item name */}
      <div>
        <h3 className="text-white text-xl font-bold">
          {item.quantity}× {item.name}
        </h3>
        {item.guestName && (
          <p className="text-slate-400 text-sm mt-0.5">👤 {item.guestName}</p>
        )}
      </div>

      {/* Notes */}
      {item.order?.specialInstructions && (
        <p className="text-amber-400 text-sm bg-amber-900/30 px-3 py-2 rounded-lg">
          📝 {item.order.specialInstructions}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        {item.status === 'RECEIVED' && (
          <button
            onClick={advance}
            disabled={loading}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold text-sm transition disabled:opacity-50"
          >
            🍳 START COOKING
          </button>
        )}
        {item.status === 'PREPARING' && (
          <button
            onClick={advance}
            disabled={loading}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-sm transition disabled:opacity-50"
          >
            ✅ MARK READY
          </button>
        )}
        {item.status === 'READY' && (
          <button
            onClick={advance}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-sm transition disabled:opacity-50"
          >
            🎉 COLLECTED
          </button>
        )}
      </div>
    </div>
  );
}
