'use client';

import { useState, useMemo } from 'react';
import type { Vendor } from '@/lib/types';
import VendorCard from './VendorCard';
import FilterBar from './FilterBar';

export default function VendorGallery({ vendors }: { vendors: Vendor[] }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const cuisines = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.cuisine))).sort(),
    [vendors],
  );

  const visible = useMemo(
    () =>
      vendors.filter(
        (v) =>
          (filter === 'All' || v.cuisine === filter) &&
          (search === '' || v.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [vendors, filter, search],
  );

  return (
    <section>
      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
      </div>

      {/* Cuisine filter */}
      <FilterBar selected={filter} onChange={setFilter} cuisines={cuisines} />

      {/* Grid */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((v) => (
          <VendorCard key={v.id} vendor={v} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🔍</p>
          <p>No vendors match your search</p>
        </div>
      )}
    </section>
  );
}
