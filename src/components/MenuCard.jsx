import React from 'react';

function MenuCard({ item, onAddToCart }) {
  return (
    <div className="bg-white bg-opacity-95 rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">{item.name}</h3>
            {item.vendorName && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                {item.vendorName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-purple-600 font-bold">£{item.price.toFixed(2)}</span>
            
            {item.dietary && item.dietary.length > 0 && (
              <div className="flex gap-1">
                {item.dietary.includes('vegan') && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🌱 Vegan</span>
                )}
                {item.dietary.includes('vegetarian') && !item.dietary.includes('vegan') && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🥗 Veggie</span>
                )}
              </div>
            )}
          </div>
          
          {item.allergens && item.allergens.length > 0 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Contains: {item.allergens.join(', ')}
            </p>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => onAddToCart(item)}
          className="touch-target self-center flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 sm:py-2 rounded-full text-sm font-semibold hover:scale-105 active:scale-95 transition-transform shadow-md"
        >
          Add +
        </button>
      </div>
    </div>
  );
}

export default MenuCard;
