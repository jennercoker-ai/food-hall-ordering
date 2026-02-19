import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function GroupOrderTracker({ groupId, orders: initialOrders, onClose }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [isConnected, setIsConnected] = useState(false);

  // SSE connection for live updates
  useEffect(() => {
    if (!groupId) return;

    const eventSource = new EventSource(`${API_URL}/api/group/${groupId}/live`);
    
    eventSource.onopen = () => setIsConnected(true);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'GROUP_UPDATE' || data.type === 'ITEM_STATUS') {
          // Refresh orders
          fetchOrders();
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };
    
    return () => eventSource.close();
  }, [groupId]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders?groupId=${groupId}`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
  };

  // Aggregate all items across orders
  const allItems = orders.flatMap(order => 
    (order.items || []).map(item => ({
      ...item,
      orderId: order.id,
      orderNumber: order.orderNumber
    }))
  );

  const totalItems = allItems.length;
  const readyItems = allItems.filter(i => i.status === 'READY' || i.status === 'COLLECTED');
  const cookingItems = allItems.filter(i => i.status === 'PREPARING');
  const pendingItems = allItems.filter(i => i.status === 'RECEIVED');
  
  const readyCount = readyItems.length;
  const progressPercent = totalItems > 0 ? Math.round((readyCount / totalItems) * 100) : 0;

  // Group ready items by station
  const itemsByStation = readyItems.reduce((acc, item) => {
    const station = item.vendor?.collectionPoint || item.collectionPoint || item.vendorName || 'Collection Point';
    if (!acc[station]) {
      acc[station] = { items: [], vendorName: item.vendor?.name || item.vendorName };
    }
    acc[station].items.push(item);
    return acc;
  }, {});

  // Group cooking items by vendor
  const cookingByVendor = cookingItems.reduce((acc, item) => {
    const vendorName = item.vendor?.name || item.vendorName || 'Vendor';
    if (!acc[vendorName]) {
      acc[vendorName] = { items: [], station: item.vendor?.collectionPoint || '' };
    }
    acc[vendorName].items.push(item);
    return acc;
  }, {});

  const getEstimatedTime = (item) => {
    const category = (item.menuItem?.category || item.category || '').toLowerCase();
    if (category.includes('drink') || category.includes('coffee')) return '1-2';
    if (category.includes('dessert') || category.includes('ice cream')) return '2-3';
    if (category.includes('pizza')) return '8-12';
    if (category.includes('burger')) return '5-8';
    if (category.includes('curry')) return '10-15';
    if (category.includes('bbq')) return '8-12';
    return '3-5';
  };

  const getCategoryEmoji = (category) => {
    if (!category) return '🍽️';
    const cat = category.toLowerCase();
    if (cat.includes('pizza')) return '🍕';
    if (cat.includes('taco')) return '🌮';
    if (cat.includes('burger')) return '🍔';
    if (cat.includes('fish')) return '🐟';
    if (cat.includes('curry')) return '🍛';
    if (cat.includes('coffee')) return '☕';
    if (cat.includes('bbq')) return '🍖';
    if (cat.includes('dessert') || cat.includes('ice')) return '🍨';
    if (cat.includes('salad')) return '🥗';
    if (cat.includes('drink') || cat.includes('coke') || cat.includes('soda')) return '🥤';
    if (cat.includes('beer')) return '🍺';
    if (cat.includes('wine')) return '🍷';
    if (cat.includes('cocktail')) return '🍸';
    return '🍽️';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[95vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-sm flex items-center gap-2">
                👨‍👩‍👧‍👦 Family Order
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </p>
              <h2 className="text-2xl font-bold">Group Sync</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Big Progress Display */}
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-3xl font-bold">{progressPercent}%</p>
                <p className="text-white/80 text-sm">Ready</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{readyCount}/{totalItems}</p>
                <p className="text-white/80 text-sm">Items</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {/* Status Summary */}
            <div className="flex justify-between mt-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {readyCount} ready
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                {cookingItems.length} cooking
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                {pendingItems.length} queued
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Ready Items by Station */}
          {Object.keys(itemsByStation).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">📍</span>
                Collection Points
              </h3>
              
              {Object.entries(itemsByStation).map(([station, data]) => (
                <div 
                  key={station} 
                  className="bg-green-50 border-2 border-green-300 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-green-800 flex items-center gap-2">
                      <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                        ✓
                      </span>
                      {station}
                    </h4>
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {data.items.length} READY
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {data.items.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm"
                      >
                        <span className="text-lg">
                          {getCategoryEmoji(item.menuItem?.category || item.category)}
                        </span>
                        <span className="font-medium text-gray-800 truncate">
                          {item.menuItem?.name || item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Still Cooking Section */}
          {cookingItems.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
                <span className="text-xl animate-bounce">🔥</span>
                Still Cooking
              </h3>
              
              <div className="space-y-3">
                {Object.entries(cookingByVendor).map(([vendorName, data]) => (
                  <div key={vendorName} className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-orange-700">{vendorName}</span>
                      {data.station && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                          → {data.station}
                        </span>
                      )}
                    </div>
                    {data.items.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="flex items-center justify-between py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span>{getCategoryEmoji(item.menuItem?.category || item.category)}</span>
                          <span className="text-gray-700">{item.menuItem?.name || item.name}</span>
                        </div>
                        <span className="text-sm text-orange-600 font-medium">
                          ~{getEstimatedTime(item)} min
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending/Queued Items */}
          {pendingItems.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-600 flex items-center gap-2 mb-2">
                <span>📝</span>
                In Queue
              </h3>
              <div className="flex flex-wrap gap-2">
                {pendingItems.map((item, idx) => (
                  <span 
                    key={item.id || idx}
                    className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-600"
                  >
                    {getCategoryEmoji(item.menuItem?.category || item.category)}
                    {item.menuItem?.name || item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All Ready Celebration */}
          {progressPercent === 100 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-2xl font-bold mb-2">All Items Ready!</h3>
              <p className="text-green-100">
                Collect from the stations above. Enjoy your meal!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total for group</p>
              <p className="text-2xl font-bold text-gray-800">
                £{orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0).toFixed(2)}
              </p>
            </div>
            
            {progressPercent < 100 ? (
              <div className="text-right">
                <p className="text-sm text-gray-500">Estimated wait</p>
                <p className="text-lg font-semibold text-orange-600">
                  ~{Math.max(...cookingItems.map(i => parseInt(getEstimatedTime(i).split('-')[1]) || 5))} mins
                </p>
              </div>
            ) : (
              <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold">
                ✓ Ready to Collect
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupOrderTracker;
