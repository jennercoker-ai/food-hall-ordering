import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = typeof window !== 'undefined' ? window.location.origin : '';

function CustomerDashboard() {
  const [phone, setPhone] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchMyOrders = async (phoneNumber) => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `${API_URL}/api/orders?customerPhone=${encodeURIComponent(phoneNumber.trim())}`
      );
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      // Fetch delivery details for any order that has a deliveryId
      const deliveryIds = [...new Set((Array.isArray(data) ? data : [])
        .filter(o => o.deliveryId)
        .map(o => o.deliveryId))];
      const deliveryList = [];
      for (const id of deliveryIds) {
        const dRes = await fetch(`${API_URL}/api/delivery/${id}`);
        if (dRes.ok) deliveryList.push(await dRes.json());
      }
      setDeliveries(deliveryList);
    } catch (e) {
      console.error(e);
      setOrders([]);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedPhone(phone.trim());
    fetchMyOrders(phone.trim());
  };

  const statusConfig = {
    pending: { label: 'Received', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
    ready: { label: 'Ready for pickup', color: 'bg-green-100 text-green-800' },
    completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  };

  const singleOrders = orders.filter(o => !o.deliveryId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-1">Customer Dashboard</h1>
          <p className="text-emerald-100">Track your orders by phone number</p>
          <a
            href={`${BASE}/?view=demo`}
            className="inline-block mt-4 text-sm text-white/90 hover:text-white underline"
          >
            ← Back to demo hub
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your phone number (used when placing order)
          </label>
          <div className="flex gap-3 flex-wrap">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +44 7700 900000"
              className="flex-1 min-w-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Find my orders'}
            </button>
          </div>
        </form>

        {!submittedPhone && !loading && (
          <div className="text-center py-12 bg-white rounded-xl shadow text-gray-500">
            <p className="text-lg">Enter your phone number above to see your orders and deliveries.</p>
          </div>
        )}

        {submittedPhone && !loading && orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-600">No orders found for this number.</p>
            <p className="text-sm text-gray-500 mt-1">Use the same number you entered at checkout.</p>
          </div>
        )}

        {submittedPhone && (orders.length > 0 || deliveries.length > 0) && (
          <div className="space-y-6">
            {deliveries.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-3">Multi-vendor deliveries</h2>
                <div className="space-y-4">
                  {deliveries.map((d) => (
                    <div
                      key={d.deliveryId}
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                    >
                      <div className="p-4 bg-stone-50 border-b flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-gray-800">#{d.orderNumber}</span>
                          <span className="text-gray-500 ml-2">
                            {new Date(d.date).toLocaleDateString()} · {d.guestName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${(d.status === 'delivered' && 'bg-green-100 text-green-800') || (d.status === 'dispatched' && 'bg-blue-100 text-blue-800') || 'bg-amber-100 text-amber-800'}`}>
                            {d.status || 'pending'}
                          </span>
                          <a
                            href={`${BASE}/?view=delivery&deliveryId=${encodeURIComponent(d.deliveryId)}`}
                            className="text-emerald-600 font-semibold text-sm hover:underline"
                          >
                            View ticket →
                          </a>
                        </div>
                      </div>
                      <div className="p-4 text-sm text-gray-600">
                        <p>{d.destination}</p>
                        <p className="mt-1">{d.totalItems} items · {d.vendorCount} vendors</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {singleOrders.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-3">Single-vendor orders</h2>
                <div className="space-y-4">
                  {singleOrders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                      >
                        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-gray-800">#{order.orderNumber}</span>
                            <span className="text-gray-500 ml-2">{order.vendorName}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="p-4">
                          <ul className="space-y-1 text-sm text-gray-700">
                            {order.items.map((item, i) => (
                              <li key={i}>
                                {item.quantity}x {item.name} — £{(item.price * (item.quantity || 1)).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 pt-3 border-t flex justify-between items-center">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-emerald-600">£{order.total.toFixed(2)}</span>
                          </div>
                          <a
                            href={`${BASE}/?view=order&orderId=${encodeURIComponent(order.id)}`}
                            className="mt-3 inline-block text-emerald-600 font-semibold text-sm hover:underline"
                          >
                            Track order →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;
