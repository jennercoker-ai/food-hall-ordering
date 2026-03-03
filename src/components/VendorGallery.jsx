import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const vendorLogos = {
  "Tony's Pizza": '/logos/tonys-pizza-logo.png',
  "El Camino Tacos": '/logos/el-camino-tacos-logo.png',
  "Burger Boulevard": '/logos/burger-boulevard-logo.png',
  "The Codfather": '/logos/codfather-logo.png',
  "Spice Garden": '/logos/spice-garden-logo.png',
  "Brew & Bites": '/logos/brew-bites-logo.png',
  "Smokehouse Grill": '/logos/smokehouse-grill-logo.png',
  "Sweet Treats": '/logos/sweet-treats-logo.png',
  "3 Jays & D": '/logos/3-jays-d.png',
};

const cuisineImages = {
  'Italian': '🍕',
  'Mexican': '🌮',
  'American': '🍔',
  'British': '🐟',
  'Indian': '🍛',
  'Coffee & Bakery': '☕',
  'BBQ': '🍖',
  'Desserts': '🍰',
  'Asian': '🍜',
  'Bar': '🍸',
  'default': '🍽️'
};

const estimatedTimes = {
  'Italian': '12-18m',
  'Mexican': '5-10m',
  'American': '8-12m',
  'British': '10-15m',
  'Indian': '15-20m',
  'Coffee & Bakery': '3-5m',
  'BBQ': '12-18m',
  'Desserts': '2-5m',
  'Asian': '10-15m',
  'Bar': '2-5m',
  'default': '10-15m'
};

export default function VendorGallery({ onSelectVendor, activeFilters = {} }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendors`);
        if (!response.ok) throw new Error('Failed to fetch vendors');
        const data = await response.json();
        setVendors(data.filter(v => v.active !== false));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter(vendor => {
    if (activeFilters.cuisine && vendor.cuisine !== activeFilters.cuisine) {
      return false;
    }
    if (activeFilters.search) {
      const searchLower = activeFilters.search.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(searchLower) ||
        (vendor.cuisine && vendor.cuisine.toLowerCase().includes(searchLower)) ||
        (vendor.description && vendor.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="h-32 bg-gray-200"></div>
                <div className="p-2 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-purple-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2 md:p-4">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 px-0 sm:px-2">Explore Food Hall</h2>

      {filteredVendors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No vendors match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:gap-3 md:gap-4 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredVendors.map((vendor) => {
            const emoji = cuisineImages[vendor.cuisine] || cuisineImages.default;
            const time = estimatedTimes[vendor.cuisine] || estimatedTimes.default;
            const logoUrl = vendorLogos[vendor.name] || vendor.imageUrl;

            return (
              <button
                type="button"
                key={vendor.id}
                onClick={() => onSelectVendor(vendor.id)}
                className="touch-target rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 transition-all bg-white text-left w-full"
              >
                {logoUrl ? (
                  <div className="h-28 sm:h-32 md:h-36 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-4">
                    <img
                      src={logoUrl}
                      alt={vendor.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `<span class="text-4xl sm:text-5xl">${emoji}</span>`;
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-28 sm:h-32 md:h-36 w-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-4xl sm:text-5xl">
                    {emoji}
                  </div>
                )}

                <div className="p-2 sm:p-3 border-t border-gray-100">
                  <h3 className="font-bold text-xs sm:text-sm text-gray-800 truncate">{vendor.name}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1 sm:mt-1.5 gap-1">
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <span className="flex-shrink-0">{emoji}</span>
                      <span className="truncate">{vendor.cuisine || 'Various'}</span>
                    </span>
                    <span className="bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {time}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
