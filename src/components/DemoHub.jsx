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
    title: 'Browse vendors & menus',
    description: 'Same app – use the "Browse Vendors" tab to see all vendors and menus',
    url: `${BASE}/`,
    samePage: true,
    icon: '📋',
  },
  {
    title: 'Central order board',
    description: 'Live view of every order from every vendor',
    url: `${BASE}/?view=central`,
    icon: '📺',
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
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            Event Ordering – Live Demo
          </h1>
          <p className="text-slate-400 text-lg">
            Open the links below in separate tabs to run the full flow
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {links.map((item, i) => (
            <button
              key={i}
              onClick={() => open(item.url, !item.samePage)}
              className={`text-left p-6 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-xl ${
                item.primary
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-500 shadow-lg'
                  : 'bg-slate-800 border-slate-600 hover:border-purple-500'
              }`}
            >
              <span className="text-3xl mb-2 block">{item.icon}</span>
              <h2 className="font-bold text-lg mb-1">{item.title}</h2>
              <p className="text-sm opacity-90">{item.description}</p>
              {item.samePage && (
                <p className="text-xs mt-2 opacity-75">Opens in same tab – then use "Browse Vendors" tab</p>
              )}
            </button>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-slate-800 border border-slate-700">
          <h3 className="font-bold text-lg mb-3 text-purple-300">Demo script (2–3 min)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
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
