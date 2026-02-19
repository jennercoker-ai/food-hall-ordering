import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = typeof window !== 'undefined' ? window.location.origin : '';

function VendorPicker({ onSelect, forKDS = false }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/vendors`)
      .then(res => res.json())
      .then(data => setVendors(Array.isArray(data) ? data : []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (vendor) => {
    if (onSelect) {
      onSelect(vendor.id);
    } else {
      const viewType = forKDS ? 'kds' : 'vendor';
      window.location.href = `${BASE}/?view=${viewType}&vendor=${encodeURIComponent(vendor.id)}`;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${forKDS ? 'bg-slate-900' : 'bg-gray-100'}`}>
        <p className={forKDS ? 'text-white' : 'text-gray-600'}>Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${forKDS ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className={`${forKDS ? 'bg-slate-800 border-b border-slate-700' : 'bg-gradient-to-r from-purple-600 to-pink-600'} text-white p-6 shadow-lg`}>
        <div className="max-w-4xl mx-auto">
          <a href={`${BASE}/?view=demo`} className="text-sm text-white/90 hover:text-white underline inline-block mb-2">← Back to demo hub</a>
          <h1 className="text-3xl font-bold mb-2">
            {forKDS ? '🍳 Kitchen Display System' : 'Vendor Dashboard'}
          </h1>
          <p className={forKDS ? 'text-slate-400' : 'text-purple-100'}>
            {forKDS ? 'Select your station to view orders' : 'Select a vendor to manage orders'}
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {vendors.map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelect(v)}
              className={`block p-6 rounded-xl shadow-md border text-left transition-all ${
                forKDS 
                  ? 'bg-slate-800 border-slate-700 hover:border-orange-500 hover:shadow-orange-500/20' 
                  : 'bg-white border-gray-200 hover:border-purple-400 hover:shadow-lg'
              }`}
            >
              <h2 className={`text-xl font-bold ${forKDS ? 'text-white' : 'text-gray-800'}`}>{v.name}</h2>
              <p className={`text-sm mt-1 ${forKDS ? 'text-slate-400' : 'text-gray-600'}`}>
                {v.cuisine || v.description}
              </p>
              {v.collectionPoint && (
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${forKDS ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                  📍 {v.collectionPoint}
                </span>
              )}
              <span className={`inline-block mt-3 font-semibold text-sm ${forKDS ? 'text-orange-400' : 'text-purple-600'}`}>
                {forKDS ? 'Open Kitchen Display →' : 'Open dashboard →'}
              </span>
            </button>
          ))}
        </div>
        {vendors.length === 0 && (
          <div className={`text-center py-12 rounded-xl shadow ${forKDS ? 'bg-slate-800' : 'bg-white'}`}>
            <p className={forKDS ? 'text-slate-400' : 'text-gray-600'}>No vendors found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorPicker;
