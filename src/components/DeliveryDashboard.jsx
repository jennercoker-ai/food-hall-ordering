import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = typeof window !== 'undefined' ? window.location.origin : '';

function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, dispatched, delivered
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({}); // deliveryId -> full delivery payload

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? `${API_URL}/api/deliveries`
        : `${API_URL}/api/deliveries?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchDeliveryDetails = async (deliveryId) => {
    if (details[deliveryId]) {
      setExpandedId(expandedId === deliveryId ? null : deliveryId);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/delivery/${deliveryId}`);
      if (res.ok) {
        const data = await res.json();
        setDetails(prev => ({ ...prev, [deliveryId]: data }));
        setExpandedId(deliveryId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (deliveryId, status) => {
    try {
      await fetch(`${API_URL}/api/delivery/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setDetails(prev => {
        const next = { ...prev };
        if (next[deliveryId]) next[deliveryId] = { ...next[deliveryId], status };
        return next;
      });
      fetchDeliveries();
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = deliveries.filter(d => d.status === 'pending').length;
  const dispatchedCount = deliveries.filter(d => d.status === 'dispatched').length;
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-1">Delivery Dashboard</h1>
          <p className="text-amber-100">Multi-vendor aggregated deliveries – dispatch & track</p>
          <a
            href={`${BASE}/?view=demo`}
            className="inline-block mt-4 text-sm text-white/90 hover:text-white underline"
          >
            ← Back to demo hub
          </a>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm opacity-90">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm opacity-90">Dispatched</p>
              <p className="text-2xl font-bold">{dispatchedCount}</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm opacity-90">Delivered</p>
              <p className="text-2xl font-bold">{deliveredCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'dispatched', 'delivered'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                filter === f
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading deliveries...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-600">No deliveries in this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((d) => (
              <div
                key={d.deliveryId}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
              >
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-gray-800">#{d.deliveryId}</span>
                    <span className="text-gray-500 ml-2">
                      {new Date(d.createdAt).toLocaleString()} · {d.guestName || 'Guest'}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{d.destination || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      d.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      d.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {d.status || 'pending'}
                    </span>
                    {d.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(d.deliveryId, 'dispatched')}
                        className="px-3 py-1.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700"
                      >
                        Mark dispatched
                      </button>
                    )}
                    {d.status === 'dispatched' && (
                      <button
                        onClick={() => updateStatus(d.deliveryId, 'delivered')}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
                      >
                        Mark delivered
                      </button>
                    )}
                    <button
                      onClick={() => fetchDeliveryDetails(d.deliveryId)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
                    >
                      {expandedId === d.deliveryId ? 'Hide' : 'Details'}
                    </button>
                    <a
                      href={`${BASE}/?view=delivery&deliveryId=${encodeURIComponent(d.deliveryId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 font-semibold text-sm hover:underline"
                    >
                      Open ticket
                    </a>
                  </div>
                </div>

                {expandedId === d.deliveryId && details[d.deliveryId] && (
                  <div className="border-t bg-gray-50 p-4 text-sm">
                    <p className="font-semibold text-gray-700 mb-2">Vendors & items</p>
                    <ul className="space-y-2">
                      {details[d.deliveryId].vendors?.map((v) => (
                        <li key={v.vendorId}>
                          <span className="font-medium">{v.vendorName}</span>
                          <ul className="ml-4 text-gray-600">
                            {v.items?.map((item, i) => (
                              <li key={i}>{item.quantity}x {item.name}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryDashboard;
