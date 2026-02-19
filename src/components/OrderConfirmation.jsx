import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';

function OrderConfirmation({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`);
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600">We couldn't find this order. Please check your order number.</p>
        </div>
      </div>
    );
  }

  const orderTypeConfig = {
    DINE_IN: { icon: '🍽️', label: 'Dine In', description: 'Table service' },
    COLLECTION: { icon: '🛍️', label: 'Collection', description: 'Pick up at counter' },
    DELIVERY: { icon: '🚚', label: 'Delivery', description: 'Delivering to you' }
  };

  const statusConfig = {
    pending: {
      icon: '⏳',
      title: 'Order Received',
      description: 'We\'re sending your order to the kitchen',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800'
    },
    confirmed: {
      icon: '✅',
      title: 'Order Confirmed',
      description: 'The vendor has received your order',
      color: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    preparing: {
      icon: '👨‍🍳',
      title: 'Being Prepared',
      description: 'Your food is being freshly made',
      color: 'bg-purple-100 border-purple-300 text-purple-800'
    },
    ready: {
      icon: '🎉',
      title: order.orderType === 'DELIVERY' ? 'Out for Delivery!' : 'Order Ready!',
      description: order.orderType === 'DELIVERY' 
        ? 'Your order is on its way'
        : order.orderType === 'DINE_IN' 
          ? `Your order will be brought to table ${order.tableNumber || 'your table'}`
          : 'Your order is ready for pickup',
      color: 'bg-green-100 border-green-300 text-green-800'
    },
    completed: {
      icon: '✨',
      title: 'Order Completed',
      description: 'Enjoy your meal!',
      color: 'bg-gray-100 border-gray-300 text-gray-800'
    },
    cancelled: {
      icon: '❌',
      title: 'Order Cancelled',
      description: 'This order has been cancelled',
      color: 'bg-red-100 border-red-300 text-red-800'
    }
  };

  const currentStatus = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Order Status Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className={`p-8 border-b-4 ${currentStatus.color}`}>
            <div className="text-center">
              <div className="text-7xl mb-4">{currentStatus.icon}</div>
              <h1 className="text-3xl font-bold mb-2">{currentStatus.title}</h1>
              <p className="text-lg mb-4">{currentStatus.description}</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="inline-block bg-white bg-opacity-50 px-6 py-3 rounded-full">
                  <span className="text-sm font-semibold">Order #{order.orderNumber}</span>
                </div>
                {order.orderType && orderTypeConfig[order.orderType] && (
                  <div className="inline-flex items-center gap-2 bg-white bg-opacity-70 px-4 py-2 rounded-full">
                    <span>{orderTypeConfig[order.orderType].icon}</span>
                    <span className="text-sm font-semibold">{orderTypeConfig[order.orderType].label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
            
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-800">£{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Order Type Info */}
            {order.orderType === 'DINE_IN' && order.tableNumber && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <span>🍽️</span>
                  <span><span className="font-semibold">Table:</span> {order.tableNumber}</span>
                </p>
              </div>
            )}
            
            {order.orderType === 'DELIVERY' && order.destination && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <span>🚚</span>
                  <span><span className="font-semibold">Delivering to:</span> {order.destination}</span>
                </p>
              </div>
            )}
            
            {order.orderType === 'COLLECTION' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <span>📍</span>
                  <span>Pick up at the collection counter when ready</span>
                </p>
              </div>
            )}

            {order.specialInstructions && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-semibold text-gray-700 mb-1">Special Instructions:</p>
                <p className="text-sm text-gray-600">{order.specialInstructions}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t-2 border-gray-200">
              {order.itemsTotal && order.deliveryFee > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>£{order.itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery fee</span>
                    <span>£{order.deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-purple-600">£{order.total.toFixed(2)}</span>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  💷 <span className="font-semibold">Payment:</span> {
                    order.orderType === 'DELIVERY' 
                      ? 'Pay on delivery' 
                      : order.orderType === 'DINE_IN'
                        ? 'Pay at your table'
                        : 'Cash payment on collection'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {order.customerPhone && (
            <div className="bg-gray-50 p-6 border-t">
              <p className="text-sm text-gray-600">
                📱 We'll send updates to: <span className="font-semibold">{order.customerPhone}</span>
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-4">Order Timeline</h3>
          <div className="space-y-4">
            {['pending', 'confirmed', 'preparing', 'ready'].map((status, idx) => {
              const isComplete = ['pending', 'confirmed', 'preparing', 'ready'].indexOf(order.status) >= idx;
              const isCurrent = order.status === status;
              
              return (
                <div key={status} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    isComplete 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-purple-300' : ''}`}>
                    {isComplete ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isComplete ? 'text-gray-800' : 'text-gray-400'}`}>
                      {statusConfig[status].title}
                    </p>
                    <p className="text-sm text-gray-500">{statusConfig[status].description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Order More
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
