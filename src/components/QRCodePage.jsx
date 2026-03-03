import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

const STORAGE_KEY = 'food_hall_public_url';

function isLocalhost(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
  } catch {
    return true;
  }
}

function QRCodePage() {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const savedUrl = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) || '') : '';
  
  // Use saved/env URL if available, otherwise use current origin
  const defaultUrl = savedUrl || (import.meta.env.VITE_PUBLIC_URL || currentOrigin);
  
  const [publicUrl, setPublicUrl] = useState(defaultUrl);
  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [dataUrl, setDataUrl] = useState('');
  const [isLocal, setIsLocal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'kds' | 'vendor'

  const finalUrl = publicUrl.replace(/\/$/, '') + '/';

  const qrTargets = {
    customer: { label: 'Customer Ordering', url: finalUrl, desc: 'Scan to browse all vendors & order', icon: '🍕' },
    concierge: { label: 'AI Concierge', url: `${publicUrl.replace(/\/$/, '')}/?view=concierge`, desc: 'Scan to open the AI food concierge', icon: '🎩' },
    family: { label: 'Group Order', url: `${publicUrl.replace(/\/$/, '')}/?view=family`, desc: 'Scan to start or join a group order', icon: '👨‍👩‍👧‍👦' },
  };

  const activeTarget = qrTargets[activeTab] || qrTargets.customer;

  const generateQR = useCallback(async (url) => {
    try {
      const d = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: '#0f0f0f', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setDataUrl(d);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  }, []);

  useEffect(() => {
    setIsLocal(isLocalhost(publicUrl));
    generateQR(activeTarget.url);
  }, [publicUrl, activeTab, generateQR, activeTarget.url]);

  const handleApplyUrl = () => {
    const clean = inputUrl.trim().replace(/\/$/, '');
    setPublicUrl(clean);
    localStorage.setItem(STORAGE_KEY, clean);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeTarget.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-purple-700 via-pink-600 to-red-500 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 safe-y safe-x">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">📲 Event QR Codes</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Print, display, or share — guests scan to order</p>
        </div>

        {/* Localhost warning */}
        {isLocal && (
          <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">Localhost detected</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  QR codes pointing to <code className="bg-amber-100 px-1 rounded">localhost</code> only work on this device.
                  Enter your <strong>public URL</strong> below so guests can scan it.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Public URL input */}
        <div className="mb-5 space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
            App Public URL
          </label>
          <div className="flex gap-2">
            <input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
              placeholder="https://your-app.railway.app"
              className={`flex-1 min-w-0 px-3 py-3 sm:py-2.5 border-2 rounded-xl text-base sm:text-sm focus:outline-none transition-colors ${
                isLocal ? 'border-amber-300 focus:border-amber-500' : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="touch-target px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition whitespace-nowrap"
            >
              Apply
            </button>
          </div>
          {!isLocal && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              ✅ Public URL — QR codes will work for all guests
            </p>
          )}
        </div>

        {/* Tab selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 sm:mb-5">
          {Object.entries(qrTargets).map(([key, t]) => (
            <button
              type="button"
              key={key}
              onClick={() => setActiveTab(key)}
              className={`touch-target flex-1 py-2.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key ? 'bg-white text-purple-700 shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-5">
          <div className="bg-white p-4 rounded-2xl border-4 border-gray-100 shadow-inner">
            {dataUrl ? (
              <img src={dataUrl} alt="QR code" width={240} height={240} className="rounded-lg" />
            ) : (
              <div className="w-60 h-60 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">Generating…</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-700">{activeTarget.icon} {activeTarget.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{activeTarget.desc}</p>
          <p className="text-xs text-gray-400 mt-1 font-mono bg-gray-50 px-2 py-1 rounded truncate max-w-full">
            {activeTarget.url}
          </p>
        </div>

        {/* Actions — 2 cols mobile, touch-friendly */}
        <div className="grid grid-cols-2 gap-2">
          {dataUrl && (
            <a
              href={dataUrl}
              download={`qr-${activeTab}.png`}
              className="touch-target flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition"
            >
              ⬇️ Download
            </a>
          )}
          <button
            type="button"
            onClick={handleCopyLink}
            className="touch-target flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
          >
            {copied ? '✅ Copied!' : '🔗 Copy'}
          </button>
          <a
            href={`/api/qr?url=${encodeURIComponent(activeTarget.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
          >
            🖼️ Share
          </a>
          <a
            href={activeTarget.url}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            🚀 Open App
          </a>
        </div>

        {/* Footer hint */}
        <div className="mt-5 bg-purple-50 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-purple-700">
            💡 <strong>Pro tip:</strong> Deploy to Railway or Render (free tier) to get a permanent public URL — then paste it above and all your QR codes will work instantly.
          </p>
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <a href="/?view=demo" className="text-xs text-gray-400 hover:text-gray-600 underline">
            ← Back to demo hub
          </a>
        </div>
      </div>
    </div>
  );
}

export default QRCodePage;
