'use client';

import Link from 'next/link';
import type { Vendor } from '@/lib/types';

const CUISINE_EMOJI: Record<string, string> = {
  Italian: '🍕', American: '🍔', Mexican: '🌮', Indian: '🍛',
  'Coffee & Bakery': '☕', Bar: '🍸', BBQ: '🔥', Seafood: '🐟',
  Chinese: '🥡', Japanese: '🍱', Thai: '🍜', Vegan: '🥗',
  Desserts: '🍰',
};

const WAIT_TIMES: Record<string, string> = {
  Italian: '12-18m', American: '10-15m', Mexican: '8-12m', Indian: '15-20m',
  'Coffee & Bakery': '3-5m', Bar: '2-4m', BBQ: '18-25m', Seafood: '12-18m',
};

interface Props {
  vendor: Vendor;
}

export default function VendorCard({ vendor }: Props) {
  const emoji = CUISINE_EMOJI[vendor.cuisine] ?? '🍽️';
  const wait = WAIT_TIMES[vendor.cuisine] ?? '10-15m';

  return (
    <Link href={`/vendor/${vendor.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
        {/* Hero */}
        <div className="relative h-40 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center text-6xl select-none overflow-hidden">
          {vendor.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.imageUrl}
              alt={vendor.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <span>{emoji}</span>
          )}
          {/* Overlay badge */}
          <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur-sm">
            ⏱ {wait}
          </span>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                {vendor.name}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">{vendor.cuisine}</p>
            </div>
            <span className="text-xl flex-shrink-0">{emoji}</span>
          </div>

          {vendor.collectionPoint && (
            <p className="mt-2 text-xs text-purple-600 font-medium flex items-center gap-1">
              <span>📍</span>
              {vendor.collectionPoint}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
