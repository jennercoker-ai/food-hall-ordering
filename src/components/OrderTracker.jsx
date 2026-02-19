import React, { useState, useEffect } from 'react';
import { useOrderUpdates } from '../hooks/useOrderUpdates';

const statusConfig = {
  RECEIVED: { label: 'Received', color: 'bg-gray-400', icon: '📝' },
  PREPARING: { label: 'Cooking', color: 'bg-orange-500', icon: '👨‍🍳' },
  READY: { label: 'Ready', color: 'bg-green-500', icon: '✅' },
  COLLECTED: { label: 'Collected', color: 'bg-blue-500', icon: '🎉' }
};

function OrderTracker({ orderId, orderData, onClose }) {
  const { order: liveOrder, isConnected } = useOrderUpdates(orderId);
  const [estimatedTimes, setEstimatedTimes] = useState({});
  
  const order = liveOrder || orderData;
  
  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const readyItems = items.filter(i => i.status === 'READY' || i.status === 'COLLECTED');
  const cookingItems = items.filter(i => i.status === 'PREPARING');
  const pendingItems = items.filter(i => i.status === 'RECEIVED');
  
  const totalItems = items.length;
  const readyCount = readyItems.length;
  const progressPercent = totalItems > 0 ? Math.round((readyCount / totalItems) * 100) : 0;
  
  // Group ready items by collection point/station
  const itemsByStation = readyItems.reduce((acc, item) => {
    const station = item.vendor?.collectionPoint || item.collectionPoint || item.vendorName || 'Collection Point';
    if (!acc[station]) {
      acc[station] = [];
    }
    acc[station].push(item);
    return acc;
  }, {});

  // Estimate cooking time based on category
  const getEstimatedTime = (item) => {
    const category = (item.menuItem?.category || item.category || '').toLowerCase();
    if (category.includes('drink') || category.includes('coffee')) return '1-2';
    if (category.includes('dessert') || category.includes('ice cream')) return '2-3';
    if (category.includes('pizza')) return '8-12';
    if (category.includes('burger')) return '5-8';
    if (category.includes('curry') || category.includes('biryani')) return '10-15';
    if (category.includes('bbq') || category.includes('grill')) return '8-12';
    return '3-5';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[95vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-purple-200 text-sm">Order #{order.orderNumber}</p>
              <h2 className="text-2xl font-bold">Order Status</h2>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Progress Ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - progressPercent / 100)}`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{progressPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold">
                {progressPercent === 100 ? '🎉 All Ready!' : `${readyCount}/${totalItems} Ready`}
              </p>
              <p className="text-purple-200 text-sm">
                {cookingItems.length > 0 && `${cookingItems.length} item${cookingItems.length > 1 ? 's' : ''} cooking`}
                {pendingItems.length > 0 && cookingItems.length > 0 && ' · '}
                {pendingItems.length > 0 && `${pendingItems.length} in queue`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Ready Items by Station */}
          {Object.keys(itemsByStation).length > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                <span className="text-xl">✅</span>
                Ready for Collection
              </h3>
              
              {Object.entries(itemsByStation).map(([station, stationItems]) => (
                <div key={station} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📍</span>
                    <span className="font-semibold text-green-700">{station}</span>
                  </div>
                  <div className="pl-7 space-y-1">
                    {stationItems.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center gap-2 text-green-800">
                        <span>{getCategoryEmoji(item.menuItem?.category || item.category)}</span>
                        <span>{item.menuItem?.name || item.name}</span>
                        {item.quantity > 1 && (
                          <span className="text-green-600 text-sm">×{item.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cooking Items */}
          {cookingItems.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
                <span className="text-xl animate-pulse">👨‍🍳</span>
                Still Cooking
              </h3>
              <div className="space-y-3">
                {cookingItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getCategoryEmoji(item.menuItem?.category || item.category)}</span>
                      <div>
                        <p className="font-medium text-orange-800">
                          {item.menuItem?.name || item.name}
                          {item.quantity > 1 && <span className="text-orange-600 text-sm ml-1">×{item.quantity}</span>}
                        </p>
                        <p className="text-sm text-orange-600">
                          {item.vendor?.name || item.vendorName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-700">
                        Est. {getEstimatedTime(item)} mins
                      </p>
                      <div className="w-16 h-1.5 bg-orange-200 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-orange-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
                <span className="text-xl">📝</span>
                In Queue
              </h3>
              <div className="space-y-2">
                {pendingItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-2 text-gray-600">
                    <span>{getCategoryEmoji(item.menuItem?.category || item.category)}</span>
                    <span>{item.menuItem?.name || item.name}</span>
                    {item.quantity > 1 && (
                      <span className="text-gray-500 text-sm">×{item.quantity}</span>
                    )}
                    <span className="text-gray-400 text-sm ml-auto">
                      {item.vendor?.name || item.vendorName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Ready Message */}
          {progressPercent === 100 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white text-center">
              <span className="text-5xl block mb-3">🎉</span>
              <h3 className="text-xl font-bold mb-2">Your Order is Ready!</h3>
              <p className="text-green-100">
                Please collect your items from the stations listed above.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-800">
                £{(order.totalAmount || order.total || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Payment</p>
              <p className="font-semibold text-gray-700">
                {order.paymentMethod === 'cash' ? '💵 Cash' : 
                 order.paymentMethod === 'apple_pay' ? ' Apple Pay' : 
                 order.paymentMethod === 'card' ? '💳 Card' : '✓ Paid'}
              </p>
            </div>
          </div>
          
          {progressPercent < 100 && (
            <p className="text-xs text-center text-gray-500">
              🔔 You'll receive a notification when items are ready
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category) {
  if (!category) return '🍽️';
  const cat = category.toLowerCase();
  if (cat.includes('pizza')) return '🍕';
  if (cat.includes('taco') || cat.includes('mexican')) return '🌮';
  if (cat.includes('burger')) return '🍔';
  if (cat.includes('fish') || cat.includes('chip')) return '🐟';
  if (cat.includes('curry') || cat.includes('indian')) return '🍛';
  if (cat.includes('coffee') || cat.includes('latte')) return '☕';
  if (cat.includes('pastry') || cat.includes('cake')) return '🧁';
  if (cat.includes('bbq') || cat.includes('grill')) return '🍖';
  if (cat.includes('ice cream') || cat.includes('dessert')) return '🍨';
  if (cat.includes('salad')) return '🥗';
  if (cat.includes('drink') || cat.includes('soda')) return '🥤';
  if (cat.includes('beer')) return '🍺';
  if (cat.includes('wine')) return '🍷';
  if (cat.includes('cocktail')) return '🍸';
  return '🍽️';
}

export default OrderTracker;
