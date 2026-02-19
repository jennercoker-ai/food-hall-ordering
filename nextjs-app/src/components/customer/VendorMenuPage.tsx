'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Vendor, MenuItem } from '@/lib/types';
import { useGroupSession } from '@/store/groupSession';

const DIETARY_BADGES: Record<string, string> = {
  vegan: 'bg-green-100 text-green-700',
  vegetarian: 'bg-emerald-100 text-emerald-700',
  'gluten-free': 'bg-yellow-100 text-yellow-700',
};

interface Props {
  vendor: Vendor;
  menuItems: MenuItem[];
}

export default function VendorMenuPage({ vendor, menuItems }: Props) {
  const { addToCart, currentGuest, groupId } = useGroupSession();
  const [addedId, setAddedId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((i) => i.category))).sort(),
    [menuItems],
  );

  const handleAdd = (item: MenuItem) => {
    const guest = currentGuest();
    addToCart({
      id: '',
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      vendorId: vendor.id,
      vendorName: vendor.name,
      category: item.category,
      guestName: guest?.name ?? 'Guest',
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="relative h-48 bg-gradient-to-br from-purple-700 to-pink-600 overflow-hidden">
        {vendor.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.imageUrl} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-30" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-5">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-3 inline-flex items-center gap-1 transition">
            ← All vendors
          </Link>
          <h1 className="text-3xl font-black text-white">{vendor.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/80 text-sm">{vendor.cuisine}</span>
            {vendor.collectionPoint && (
              <span className="text-white/80 text-sm flex items-center gap-1">
                📍 {vendor.collectionPoint}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Group context hint */}
      {groupId && (
        <div className="bg-purple-50 border-b border-purple-100 px-4 py-2 text-sm text-purple-700 flex items-center gap-2">
          👨‍👩‍👧‍👦 Group order mode — items added on behalf of <strong>{currentGuest()?.name ?? 'you'}</strong>
        </div>
      )}

      {/* Menu */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {categories.map((category) => {
          const items = menuItems.filter((i) => i.category === category);
          return (
            <section key={category}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                {category}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <span className="font-bold text-purple-700 flex-shrink-0">£{item.price.toFixed(2)}</span>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                        {item.dietary?.map((d) => (
                          <span key={d} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIETARY_BADGES[d] ?? 'bg-gray-100 text-gray-600'}`}>
                            {d}
                          </span>
                        ))}
                        {item.allergens?.length > 0 && (
                          <span className="text-xs text-amber-600">⚠️ {item.allergens.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(item)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all shadow ${
                        addedId === item.id
                          ? 'bg-green-500 scale-110'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105'
                      }`}
                    >
                      {addedId === item.id ? '✓' : '+'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
