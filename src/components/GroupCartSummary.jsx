import React from 'react';

export default function GroupCartSummary({ items, guests, totalAmount, onPay, isLocked, isHost }) {
  // Group items by Vendor so the user knows they are ordering from multiple places
  const groupedByVendor = items.reduce((acc, item) => {
    const vendorName = item.item?.vendorName || item.vendorName || 'Unknown Vendor';
    if (!acc[vendorName]) {
      acc[vendorName] = {
        items: [],
        subtotal: 0
      };
    }
    acc[vendorName].items.push(item);
    acc[vendorName].subtotal += (item.item?.price || item.price) * item.quantity;
    return acc;
  }, {});

  const vendorCount = Object.keys(groupedByVendor).length;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Get guest info for each item
  const getGuestBadge = (item) => {
    const guest = guests?.find(g => g.id === item.guestId);
    if (!guest) return null;
    return (
      <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${guest.color?.bg || 'bg-gray-100'} ${guest.color?.text || 'text-gray-600'}`}>
        {guest.name}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-t-3xl shadow-xl border-t border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Order Summary</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span>🏪</span>
              <span>{vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'}</span>
            </span>
            <span>•</span>
            <span>{itemCount} items</span>
          </div>
        </div>
        
        {vendorCount > 1 && (
          <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm flex items-center gap-2">
              <span>ℹ️</span>
              <span>Your order includes items from <strong>{vendorCount} different vendors</strong>. Items will be prepared separately.</span>
            </p>
          </div>
        )}
      </div>

      {/* Items grouped by Vendor */}
      <div className="max-h-80 overflow-y-auto">
        {Object.entries(groupedByVendor).map(([vendor, data], index) => (
          <div key={vendor} className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
            {/* Vendor Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  {vendor.charAt(0)}
                </div>
                <h4 className="font-bold text-gray-800">{vendor}</h4>
              </div>
              <span className="text-sm font-semibold text-gray-600">
                £{data.subtotal.toFixed(2)}
              </span>
            </div>
            
            {/* Vendor Items */}
            <div className="space-y-2 pl-10">
              {data.items.map((cartItem, itemIndex) => {
                const item = cartItem.item || cartItem;
                const price = item.price * cartItem.quantity;
                
                return (
                  <div key={cartItem.id || itemIndex} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center">
                      <span className="text-gray-800">
                        <span className="font-medium">{cartItem.quantity}×</span> {item.name}
                      </span>
                      {getGuestBadge(cartItem)}
                    </div>
                    <span className="text-gray-700 font-medium">£{price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with Total */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        {/* Breakdown by person (collapsed) */}
        {guests && guests.length > 1 && (
          <details className="mb-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              View breakdown by person
            </summary>
            <div className="mt-2 space-y-1 pl-2">
              {guests.map(guest => {
                const guestItems = items.filter(i => i.guestId === guest.id);
                const guestTotal = guestItems.reduce((sum, i) => sum + (i.item?.price || i.price) * i.quantity, 0);
                if (guestTotal === 0) return null;
                return (
                  <div key={guest.id} className="flex justify-between text-sm">
                    <span className={`${guest.color?.text || 'text-gray-600'}`}>
                      {guest.name} {guest.isHost && '👑'}
                    </span>
                    <span className="text-gray-700">£{guestTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Total */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">£{totalAmount.toFixed(2)}</p>
          </div>
          {isLocked && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
              <span>🔒</span> Cart Locked
            </span>
          )}
        </div>

        {/* Payment Button */}
        {isHost ? (
          <button 
            onClick={onPay}
            disabled={!isLocked}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              isLocked 
                ? 'bg-black text-white hover:bg-gray-800 shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLocked ? (
              <>
                <span className="text-lg"></span>
                <span>Pay £{totalAmount.toFixed(2)}</span>
              </>
            ) : (
              'Lock cart to pay'
            )}
          </button>
        ) : (
          <div className="text-center py-3 bg-purple-50 rounded-xl">
            <p className="text-purple-700 text-sm">
              Waiting for host to complete payment
            </p>
          </div>
        )}
        
        {/* Payment info */}
        {isHost && isLocked && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Apple Pay, Card, or Cash accepted
          </p>
        )}
      </div>
    </div>
  );
}
