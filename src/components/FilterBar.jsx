import React, { useState } from 'react';

const cuisineOptions = [
  { value: '', label: 'All Cuisines', icon: '🍽️' },
  { value: 'Italian', label: 'Italian', icon: '🍕' },
  { value: 'Mexican', label: 'Mexican', icon: '🌮' },
  { value: 'American', label: 'American', icon: '🍔' },
  { value: 'British', label: 'British', icon: '🐟' },
  { value: 'Indian', label: 'Indian', icon: '🍛' },
  { value: 'Coffee & Bakery', label: 'Coffee', icon: '☕' },
  { value: 'BBQ', label: 'BBQ', icon: '🍖' },
  { value: 'Desserts', label: 'Desserts', icon: '🍰' },
  { value: 'Bar', label: 'Bar', icon: '🍸' },
];

const dietaryOptions = [
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
];

const allergenOptions = [
  { value: 'dairy', label: 'No Dairy', icon: '🥛' },
  { value: 'gluten', label: 'No Gluten', icon: '🍞' },
  { value: 'nuts', label: 'No Nuts', icon: '🥜' },
  { value: 'fish', label: 'No Fish', icon: '🐟' },
  { value: 'eggs', label: 'No Eggs', icon: '🥚' },
];

export default function FilterBar({ filters, onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false);

  const handleCuisineChange = (cuisine) => {
    onFilterChange({ ...filters, cuisine });
  };

  const handleDietaryToggle = (dietary) => {
    const current = filters.dietary || [];
    const updated = current.includes(dietary)
      ? current.filter(d => d !== dietary)
      : [...current, dietary];
    onFilterChange({ ...filters, dietary: updated });
  };

  const handleAllergenToggle = (allergen) => {
    const current = filters.excludeAllergens || [];
    const updated = current.includes(allergen)
      ? current.filter(a => a !== allergen)
      : [...current, allergen];
    onFilterChange({ ...filters, excludeAllergens: updated });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const clearFilters = () => {
    onFilterChange({ search: '', cuisine: '', dietary: [], excludeAllergens: [] });
  };

  const activeFilterCount = 
    (filters.cuisine ? 1 : 0) + 
    (filters.dietary?.length || 0) + 
    (filters.excludeAllergens?.length || 0);

  return (
    <div className="bg-white border-b border-gray-200 safe-x">
      {/* Search Bar — touch-friendly height on mobile */}
      <div className="p-2 sm:p-3">
        <div className="relative">
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search vendors or dishes..."
            className="w-full pl-10 pr-10 py-3 sm:py-2.5 bg-gray-100 rounded-full text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="touch-target absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-full p-1"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Cuisine Pills — horizontal scroll on mobile/tablet */}
      <div className="px-2 sm:px-3 pb-2 overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch">
        <div className="flex gap-2 min-w-max">
          {cuisineOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => handleCuisineChange(option.value)}
              className={`touch-target flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                filters.cuisine === option.value
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toggle Button */}
      <div className="px-2 sm:px-3 pb-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`touch-target flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-all ${
            activeFilterCount > 0
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>⚙️</span>
          <span className="hidden xs:inline">Dietary & Allergens</span>
          <span className="xs:hidden">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="touch-target text-sm text-purple-600 hover:text-purple-800 font-medium py-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Dietary Preferences
            </h4>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleDietaryToggle(option.value)}
                  className={`touch-target flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.dietary?.includes(option.value)
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Exclude Allergens
            </h4>
            <div className="flex flex-wrap gap-2">
              {allergenOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleAllergenToggle(option.value)}
                  className={`touch-target flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.excludeAllergens?.includes(option.value)
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
