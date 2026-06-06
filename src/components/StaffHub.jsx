import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = typeof window !== 'undefined' ? window.location.origin : '';

const customerLinks = [
  {
    title: 'Order now',
    description: 'AI concierge — browse all vendors, dietary filters, cart & pay on collection',
    url: `${BASE}/`,
    icon: '🎩',
    primary: true,
  },
  {
    title: 'Scan to order (QR)',
    description: 'Display at tables or stands — customers scan and order on their phone',
    url: `${BASE}/?view=qr`,
    icon: '📱',
  },
  {
    title: 'Track my order',
    description: 'Enter the phone number used at checkout',
    url: `${BASE}/?view=customer`,
    icon: '👤',
  },
  {
    title: 'Family / group order',
    description: 'Shared basket with one lead guest paying on collection',
    url: `${BASE}/?view=family`,
    icon: '👨‍👩‍👧‍👦',
  },
];

const staffLinks = [
  {
    title: 'Kitchen display (KDS)',
    description: 'Incoming tickets — start, mark ready, collected',
    url: `${BASE}/?view=kds`,
    icon: '🍳',
    highlight: true,
  },
  {
    title: 'Vendor dashboard',
    description: 'Accept orders and update status for your stall',
    url: `${BASE}/?view=vendor`,
    icon: '🏪',
  },
  {
    title: 'Central order board',
    description: 'All orders across every vendor in real time',
    url: `${BASE}/?view=central`,
    icon: '📺',
  },
  {
    title: 'Delivery dashboard',
    description: 'Multi-vendor deliveries — dispatch and complete',
    url: `${BASE}/?view=delivery-dashboard`,
    icon: '🚚',
  },
  {
    title: 'Admin',
    description: 'Manage menu items, employees, and registered devices',
    url: `${BASE}/?view=admin`,
    icon: '⚙️',
    highlight: true,
  },
];

function StaffHub() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/vendors`)
      .then((res) => res.json())
      .then((data) => setVendors(Array.isArray(data) ? data : []))
      .catch(() => setVendors([]));
  }, []);

  const open = (url, newTab = true) => {
    if (newTab) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url;
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 text-white p-4 sm:p-6 md:p-10 safe-y safe-x">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            Food Hall Ordering
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg">
            Live ordering for guests and operations for your team.
          </p>
        </div>

        <section className="mb-8 sm:mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-300 mb-3 px-1">
            For guests
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {customerLinks.map((item, i) => (
              <button
                type="button"
                key={i}
                onClick={() => open(item.url, item.url !== `${BASE}/`)}
                className={`touch-target text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] ${
                  item.primary
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-500 shadow-lg'
                    : 'bg-slate-800 border-slate-600 hover:border-purple-500'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-2 block">{item.icon}</span>
                <h3 className="font-bold text-base sm:text-lg mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm opacity-90">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 sm:mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-orange-300 mb-3 px-1">
            For staff
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {staffLinks.map((item, i) => (
              <button
                type="button"
                key={i}
                onClick={() => open(item.url)}
                className={`touch-target text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] ${
                  item.highlight
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500 shadow-lg'
                    : 'bg-slate-800 border-slate-600 hover:border-orange-500'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-2 block">{item.icon}</span>
                <h3 className="font-bold text-base sm:text-lg mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm opacity-90">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        {vendors.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
              Quick links by vendor
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {vendors.map((v) => (
                <div key={v.id} className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="font-semibold text-sm w-full sm:w-auto">{v.name}</span>
                  <button
                    type="button"
                    onClick={() => open(`${BASE}/?view=vendor&vendor=${encodeURIComponent(v.id)}`)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-700 hover:bg-purple-600 transition"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => open(`${BASE}/?view=kds&vendor=${encodeURIComponent(v.id)}`)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-700 hover:bg-orange-600 transition"
                  >
                    KDS
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default StaffHub;
