import React from 'react';

const BASE = typeof window !== 'undefined' ? window.location.origin : '';

const links = [
  {
    title: 'QR code (unified chatbot)',
    description: 'Display this page and let customers scan – opens chatbot for all vendors',
    url: `${BASE}/?view=qr`,
    icon: '📱',
    primary: true,
  },
  {
    title: 'Customer ordering',
    description: 'Unified chatbot – browse all vendors, chat, add to cart, pay on collection',
    url: `${BASE}/`,
    icon: '🍕',
  },
  {
    title: 'Food Hall Concierge',
    description: 'AI-powered assistant with dietary filtering, smart upselling, and group awareness',
    url: `${BASE}/?view=concierge`,
    icon: '🎩',
    highlight: true,
  },
  {
    title: 'Group Order (Concierge)',
    description: 'Concierge mode with group/family sharing suggestions enabled',
    url: `${BASE}/?view=concierge&group=demo-group`,
    icon: '👥',
  },
  {
    title: 'Family Order Mode',
    description: 'Lead guest controls payment. Shared basket grouped by person with cart locking.',
    url: `${BASE}/?view=family`,
    icon: '👨‍👩‍👧‍👦',
    highlight: true,
  },
  {
    title: 'Browse vendors & menus',
    description: 'Same app – use the "Browse Vendors" tab to see all vendors and menus',
    url: `${BASE}/`,
    samePage: true,
    icon: '📋',
  },
  {
    title: 'Central order board',
    description: 'Live, real-time view of every order from every vendor (updates as orders come in)',
    url: `${BASE}/?view=central`,
    icon: '📺',
    live: true,
  },
  {
    title: 'Customer dashboard',
    description: 'Track your orders by phone number – single orders & multi-vendor deliveries',
    url: `${BASE}/?view=customer`,
    icon: '👤',
  },
  {
    title: 'Delivery dashboard',
    description: 'Aggregated deliveries – mark dispatched/delivered, view tickets',
    url: `${BASE}/?view=delivery-dashboard`,
    icon: '🚚',
  },
  {
    title: 'Vendor dashboard (pick vendor)',
    description: 'Live orders for selected vendor – accept and update status',
    url: `${BASE}/?view=vendor`,
    icon: '🏪',
    live: true,
  },
  {
    title: 'Kitchen Display System (KDS)',
    description: 'Live kitchen display – all incoming orders; mark items cooking/ready (real-time)',
    url: `${BASE}/?view=kds`,
    icon: '🍳',
    highlight: true,
    live: true,
  },
  {
    title: "Tony's Pizza – vendor dashboard",
    description: 'Accept orders, update status (pending → ready)',
    url: `${BASE}/?view=vendor&vendor=vendor-001`,
    icon: '🍕',
  },
  {
    title: 'El Camino Tacos – vendor dashboard',
    description: 'Vendor dashboard for tacos',
    url: `${BASE}/?view=vendor&vendor=vendor-002`,
    icon: '🌮',
  },
  {
    title: 'Sweet Treats – vendor dashboard',
    description: 'Vendor dashboard for desserts',
    url: `${BASE}/?view=vendor&vendor=vendor-008`,
    icon: '🍰',
  },
];

function DemoHub() {
  const open = (url, newTab = true) => {
    if (newTab) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url;
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 text-white p-4 sm:p-6 md:p-10 safe-y safe-x">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            Event Ordering – Live Demo
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg mb-2">
            All views use <strong className="text-white">live data</strong>. Orders from customers and family checkout appear in real time on the Central board, KDS, and vendor screens.
          </p>
          <p className="text-slate-500 text-xs sm:text-sm">
            Open links in new tabs to run the full flow – place an order, then watch it appear on the kitchen display.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          {links.map((item, i) => (
            <button
              type="button"
              key={i}
              onClick={() => open(item.url, !item.samePage)}
              className={`touch-target text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] ${
                item.primary
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-500 shadow-lg'
                  : item.highlight
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500 shadow-lg'
                  : 'bg-slate-800 border-slate-600 hover:border-purple-500'
              }`}
            >
              <span className="text-2xl sm:text-3xl mb-2 block">{item.icon}</span>
              <h2 className="font-bold text-base sm:text-lg mb-1 flex items-center gap-2">
                {item.title}
                {item.live && (
                  <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded bg-green-500/30 text-green-300 border border-green-500/50">
                    LIVE
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm opacity-90">{item.description}</p>
              {item.samePage && (
                <p className="text-xs mt-2 opacity-75">Opens in same tab – then use "Browse Vendors" tab</p>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-800 border border-slate-700">
          <h3 className="font-bold text-base sm:text-lg mb-3 text-purple-300">Demo script (2–3 min)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs sm:text-sm">
            <li>Open <strong className="text-white">Customer ordering</strong> (first card).</li>
            <li>In chat, type: &quot;Show me the menu&quot; or switch to <strong className="text-white">Browse Vendors</strong> and pick a vendor.</li>
            <li>Add a few items from different vendors, open Cart, enter a phone number, place order.</li>
            <li>Open <strong className="text-white">Central order board</strong> – see the new order(s) in real time.</li>
            <li>Open a <strong className="text-white">Vendor dashboard</strong> (e.g. Tony&apos;s Pizza) – accept order and move status to Ready.</li>
            <li>Back on the customer tab you’ll be on order confirmation; status updates in real time. 💷 Cash on collection.</li>
          </ol>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Backend: <code className="bg-slate-700 px-2 py-0.5 rounded">localhost:3001</code> · Frontend: <code className="bg-slate-700 px-2 py-0.5 rounded">localhost:3000</code>
        </p>
      </div>
    </div>
  );
}

export default DemoHub;
