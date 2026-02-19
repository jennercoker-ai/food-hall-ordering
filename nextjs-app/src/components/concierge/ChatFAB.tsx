'use client';

import { useState } from 'react';
import type { MenuItem } from '@/lib/types';
import { useGroupSession } from '@/store/groupSession';
import ConciergeChat from './ConciergeChat';

export default function ChatFAB() {
  const [open, setOpen] = useState(false);
  const { addToCart, groupId, currentGuest } = useGroupSession();

  const handleAddToCart = (item: MenuItem) => {
    const guest = currentGuest();
    addToCart({
      id: '', // filled by store
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      vendorId: item.vendorId,
      vendorName: item.vendor?.name ?? '',
      category: item.category,
      guestName: guest?.name ?? 'Guest',
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center text-2xl group"
          aria-label="Open Food Hall Concierge"
        >
          🎩
          {/* Ping dot for group sessions */}
          {groupId && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping-slow" />
          )}
        </button>
      )}

      {/* Chat panel — bottom sheet on mobile, side panel on desktop */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50
          w-full h-[85vh]
          sm:w-[400px] sm:h-[600px] sm:bottom-6 sm:right-6 sm:rounded-2xl
          shadow-2xl overflow-hidden border border-gray-200 animate-slide-up"
        >
          <ConciergeChat
            onAddToCart={handleAddToCart}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
