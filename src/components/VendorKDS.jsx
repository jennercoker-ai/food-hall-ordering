import React, { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const getWsBase = () => {
  const base = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return base.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
};

const statusColors = {
  RECEIVED: 'border-yellow-500',
  PREPARING: 'border-orange-500',
  READY: 'border-green-500',
  COLLECTED: 'border-blue-500'
};

const statusLabels = {
  RECEIVED: 'NEW ORDER',
  PREPARING: 'IN PROGRESS',
  READY: 'READY',
  COLLECTED: 'COLLECTED'
};

const statusBg = {
  RECEIVED: 'bg-yellow-500',
  PREPARING: 'bg-orange-500',
  READY: 'bg-green-500',
  COLLECTED: 'bg-blue-500'
};

export default function VendorKDS({ vendorId, vendorName, collectionPoint }) {
  const [orderItems, setOrderItems] = useState([]);
  const [vendor, setVendor] = useState({ name: vendorName, collectionPoint });
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState('active'); // 'active', 'ready', 'all'
  const [isLoading, setIsLoading] = useState(true);

  // Fetch vendor info
  useEffect(() => {
    if (vendorId) {
      fetch(`${API_URL}/api/vendors/${vendorId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.name) {
            setVendor(data);
          }
        })
        .catch(console.error);
    }
  }, [vendorId]);

  // Fetch order items for this vendor
  const fetchOrderItems = useCallback(async () => {
    if (!vendorId) return;
    
    try {
      const res = await fetch(`${API_URL}/api/vendors/${vendorId}/order-items`);
      if (res.ok) {
        const data = await res.json();
        setOrderItems(data);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchOrderItems();
  }, [fetchOrderItems]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!vendorId) return;

    const ws = new WebSocket(`${getWsBase().replace(/\/$/, '')}?vendorId=${vendorId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('Vendor KDS connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ORDER') {
          // Add new order items
          fetchOrderItems();
        } else if (data.type === 'ITEM_STATUS') {
          // Update item status
          setOrderItems(prev => prev.map(item => 
            item.id === data.orderItemId 
              ? { ...item, status: data.itemStatus }
              : item
          ));
        }
      } catch (e) {
        console.error('WS message error:', e);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, [vendorId, fetchOrderItems]);

  // Mark item as preparing
  const markAsPreparing = async (orderItemId) => {
    try {
      const res = await fetch(`${API_URL}/api/order-items/${orderItemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PREPARING', vendorId })
      });
      
      if (res.ok) {
        setOrderItems(prev => prev.map(item =>
          item.id === orderItemId ? { ...item, status: 'PREPARING' } : item
        ));
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  // Mark item as ready
  const markAsReady = async (orderItemId) => {
    try {
      const res = await fetch(`${API_URL}/api/order-items/${orderItemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READY', vendorId })
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrderItems(prev => prev.map(item =>
          item.id === orderItemId ? { ...item, status: 'READY' } : item
        ));
        
        // Show notification
        if (data.allReady) {
          showNotification('🎉 All items ready!', 'Customer notified - complete order ready');
        } else {
          showNotification('✅ Item Ready', `Customer notified (${data.readyCount}/${data.totalItems} ready)`);
        }
      }
    } catch (error) {
      console.error('Error marking item ready:', error);
    }
  };

  // Mark item as collected
  const markAsCollected = async (orderItemId) => {
    try {
      const res = await fetch(`${API_URL}/api/order-items/${orderItemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COLLECTED', vendorId })
      });
      
      if (res.ok) {
        setOrderItems(prev => prev.map(item =>
          item.id === orderItemId ? { ...item, status: 'COLLECTED' } : item
        ));
      }
    } catch (error) {
      console.error('Error marking item collected:', error);
    }
  };

  // Simple notification
  const showNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
    // Also show a toast-style alert
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-pulse';
    toast.innerHTML = `<strong>${title}</strong><br/><span class="text-sm">${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Filter items
  const filteredItems = orderItems.filter(item => {
    if (filter === 'active') return item.status === 'RECEIVED' || item.status === 'PREPARING';
    if (filter === 'ready') return item.status === 'READY';
    return item.status !== 'COLLECTED';
  });

  // Group by order
  const itemsByOrder = filteredItems.reduce((acc, item) => {
    const orderId = item.orderId || item.order?.id;
    if (!acc[orderId]) {
      acc[orderId] = {
        orderId,
        orderNumber: item.order?.orderNumber || orderId?.slice(-4),
        items: [],
        guestName: item.guestName || item.order?.guestName,
        notes: item.order?.specialInstructions
      };
    }
    acc[orderId].items.push(item);
    return acc;
  }, {});

  // Stats
  const stats = {
    newOrders: orderItems.filter(i => i.status === 'RECEIVED').length,
    cooking: orderItems.filter(i => i.status === 'PREPARING').length,
    ready: orderItems.filter(i => i.status === 'READY').length
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 min-h-screen min-h-[100dvh] flex items-center justify-center safe-y">
        <div className="text-white text-lg sm:text-xl">Loading Kitchen Display...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen min-h-[100dvh] text-white font-mono safe-top">
      {/* Header — stacks on mobile, row on tablet+ */}
      <div className="bg-slate-800 border-b border-slate-700 px-3 sm:px-6 py-3 sm:py-4 safe-x">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold whitespace-nowrap">
              🍳 KDS
            </h1>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-base sm:text-xl text-orange-400 font-bold truncate">
              {vendor?.name || 'Loading...'}
            </span>
            {vendor?.collectionPoint && (
              <span className="bg-slate-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                📍 {vendor.collectionPoint}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${isConnected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </div>
            <div className="text-slate-400 text-sm sm:text-base">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        {/* Stats + Filter — wrap on small screens */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></span>
            <span className="text-yellow-500 font-bold">{stats.newOrders}</span>
            <span className="text-slate-400 text-sm">New</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"></span>
            <span className="text-orange-500 font-bold">{stats.cooking}</span>
            <span className="text-slate-400 text-sm">Cooking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></span>
            <span className="text-green-500 font-bold">{stats.ready}</span>
            <span className="text-slate-400 text-sm">Ready</span>
          </div>
          <div className="flex bg-slate-700 rounded-lg p-1 ml-0 sm:ml-auto">
            {['active', 'ready', 'all'].map(f => (
              <button
                type="button"
                key={f}
                onClick={() => setFilter(f)}
                className={`touch-target px-3 sm:px-4 py-2 sm:py-1 rounded text-sm font-medium transition ${
                  filter === f ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid — 1 col mobile, 2 tablet, 3–4 desktop */}
      <div className="p-3 sm:p-6 safe-x safe-bottom">
        {Object.keys(itemsByOrder).length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-slate-400">No Active Orders</h2>
            <p className="text-slate-500 mt-2">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Object.values(itemsByOrder).map((order) => (
              <div 
                key={order.orderId}
                className="bg-slate-800 rounded-lg overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">#{order.orderNumber}</span>
                    {order.guestName && (
                      <span className="ml-2 text-slate-400">{order.guestName}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Order Items */}
                <div className="divide-y divide-slate-700">
                  {order.items.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-4 border-l-4 ${statusColors[item.status]}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded ${statusBg[item.status]} text-white font-bold`}>
                            {statusLabels[item.status]}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-1">
                        {item.quantity}× {item.menuItem?.name || item.name}
                      </h3>
                      
                      {item.guestName && (
                        <p className="text-sm text-slate-400 mb-2">
                          👤 {item.guestName}
                        </p>
                      )}
                      
                      {order.notes && (
                        <p className="text-sm text-yellow-400 mb-3 bg-yellow-900/30 px-2 py-1 rounded">
                          📝 {order.notes}
                        </p>
                      )}
                      
                      {/* Action Buttons — touch-friendly on tablet/mobile */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.status === 'RECEIVED' && (
                          <button
                            type="button"
                            onClick={() => markAsPreparing(item.id)}
                            className="touch-target flex-1 min-w-0 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 py-3 sm:py-2 rounded font-bold transition text-sm"
                          >
                            🍳 START
                          </button>
                        )}
                        {(item.status === 'RECEIVED' || item.status === 'PREPARING') && (
                          <button
                            type="button"
                            onClick={() => markAsReady(item.id)}
                            className="touch-target flex-1 min-w-0 bg-green-600 hover:bg-green-500 active:bg-green-700 py-3 sm:py-2 rounded font-bold transition text-sm"
                          >
                            ✅ READY
                          </button>
                        )}
                        {item.status === 'READY' && (
                          <button
                            type="button"
                            onClick={() => markAsCollected(item.id)}
                            className="touch-target flex-1 min-w-0 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 py-3 sm:py-2 rounded font-bold transition text-sm"
                          >
                            🎉 COLLECTED
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Sound Alert for New Orders */}
      <audio id="new-order-sound" src="/sounds/notification.mp3" preload="auto" />
    </div>
  );
}
