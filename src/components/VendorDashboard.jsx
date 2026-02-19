import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = typeof window !== 'undefined' ? window.location.origin : '';
const getWsBase = () => {
  const base = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return base.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
};

function VendorDashboard({ vendorId }) {
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('active'); // active, all, completed
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/vendors/${vendorId}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch vendor info
    const fetchVendor = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendors/${vendorId}`);
        const data = await response.json();
        setVendor(data);
      } catch (error) {
        console.error('Failed to fetch vendor:', error);
      }
    };

    fetchVendor();

    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(`${getWsBase()}?vendorId=${vendorId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_ORDER') {
        // Play notification sound or show alert
        alert(`New order #${data.order.orderNumber}!`);
        fetchOrders();
      }
    };

    return () => ws.close();
  }, [vendorId]);

  useEffect(() => {
    fetchOrders();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [vendorId]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') {
      return ['pending', 'confirmed', 'preparing'].includes(order.status);
    } else if (filter === 'completed') {
      return ['ready', 'completed'].includes(order.status);
    }
    return true;
  });

  const activeCount = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <a href={`${BASE}/?view=demo`} className="text-sm text-white/90 hover:text-white underline inline-block mb-2">← Back to demo hub</a>
          <h1 className="text-3xl font-bold mb-2">{vendor?.name || 'Vendor Dashboard'}</h1>
          <p className="text-purple-100">{vendor?.description}</p>
          
          <div className="flex gap-4 mt-4">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm opacity-90">Active Orders</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm opacity-90">Ready for Pickup</p>
              <p className="text-2xl font-bold">{readyCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'active' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'completed' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Orders
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-gray-600">No orders to display</p>
            <p className="text-gray-500 mt-2">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={updateOrderStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus }) {
  const statusColors = {
    pending: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    confirmed: 'bg-blue-100 border-blue-300 text-blue-800',
    preparing: 'bg-purple-100 border-purple-300 text-purple-800',
    ready: 'bg-green-100 border-green-300 text-green-800',
    completed: 'bg-gray-100 border-gray-300 text-gray-800',
    cancelled: 'bg-red-100 border-red-300 text-red-800'
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'completed'
    };
    return statusFlow[currentStatus];
  };

  const getStatusLabel = (status) => {
    return {
      pending: 'Accept Order',
      confirmed: 'Start Preparing',
      preparing: 'Mark Ready',
      ready: 'Mark Completed',
      completed: 'Completed'
    }[status];
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-shadow">
      <div className={`p-4 border-b-4 ${statusColors[order.status]}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold">#{order.orderNumber}</h3>
            <p className="text-sm opacity-75 mt-1">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColors[order.status]}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2 mb-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="font-medium">
                {item.quantity}x {item.name}
              </span>
              <span className="text-gray-600">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-1">Special Instructions:</p>
            <p className="text-sm text-gray-600">{order.specialInstructions}</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-lg font-bold text-gray-800">Total</span>
          <span className="text-xl font-bold text-purple-600">£{order.total.toFixed(2)}</span>
        </div>
        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-gray-700">💷 Cash payment on collection</p>
        </div>

        {order.customerPhone && (
          <p className="text-xs text-gray-500 mt-2">📱 {order.customerPhone}</p>
        )}

        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(order.id, nextStatus)}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {getStatusLabel(order.status)}
          </button>
        )}
      </div>
    </div>
  );
}

export default VendorDashboard;
