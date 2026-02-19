'use client';

import { useState } from 'react';
import type { Vendor } from '@/lib/types';
import { useGroupSession } from '@/store/groupSession';
import VendorGallery from './VendorGallery';
import GroupCartDrawer from './GroupCartDrawer';
import GroupSessionSetup from './GroupSessionSetup';
import LiveOrderTracker from './LiveOrderTracker';
import ChatFAB from '@/components/concierge/ChatFAB';

interface Props { vendors: Vendor[] }

export default function CustomerShell({ vendors }: Props) {
  const { groupId, groupName, getItemCount, cart } = useGroupSession();
  const [showCart, setShowCart] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [completedGroup, setCompletedGroup] = useState<{ groupId: string; orderIds: string[] } | null>(null);

  const itemCount = getItemCount();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              🍴 Food Hall
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Group badge */}
            {groupId ? (
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 transition"
              >
                👨‍👩‍👧‍👦 {groupName}
                {itemCount > 0 && (
                  <span className="w-5 h-5 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
              >
                👥 Start Group Order
              </button>
            )}

            {/* Cart button */}
            {groupId && itemCount > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="relative w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition"
              >
                🛒
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-2">
            Find Your Perfect Meal
          </h2>
          <p className="text-purple-200 text-lg max-w-xl mx-auto">
            {vendors.length} vendors · Group ordering · Live order tracking
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <VendorGallery vendors={vendors} />
      </main>

      {/* Modals */}
      {showSetup && (
        <GroupSessionSetup onClose={() => setShowSetup(false)} />
      )}

      {showCart && groupId && (
        <GroupCartDrawer
          onClose={() => setShowCart(false)}
          onOrderComplete={(gId, orderIds) => {
            setShowCart(false);
            setCompletedGroup({ groupId: gId, orderIds });
          }}
        />
      )}

      {completedGroup && (
        <LiveOrderTracker
          groupId={completedGroup.groupId}
          initialOrders={[]}
          onClose={() => setCompletedGroup(null)}
        />
      )}

      {/* Floating AI Concierge */}
      <ChatFAB />
    </div>
  );
}
