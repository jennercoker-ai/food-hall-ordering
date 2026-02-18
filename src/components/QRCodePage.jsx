import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

// URL customers get when they scan: unified chatbot (all vendors)
const getChatbotUrl = () => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/`;
};

function QRCodePage() {
  const [dataUrl, setDataUrl] = useState('');
  const [url] = useState(getChatbotUrl());

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then(setDataUrl)
      .catch((err) => console.error('QR generation failed:', err));
  }, [url]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order from all vendors</h1>
        <p className="text-gray-600 text-sm mb-6">Scan to open the menu & chatbot</p>

        {dataUrl ? (
          <div className="inline-block p-4 bg-white rounded-2xl border-4 border-gray-100">
            <img src={dataUrl} alt="Scan to order" width={280} height={280} className="rounded-lg" />
          </div>
        ) : (
          <div className="w-[280px] h-[280px] mx-auto bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-gray-400">Generating QR…</span>
          </div>
        )}

        <p className="mt-6 text-sm font-semibold text-purple-600">Unified experience</p>
        <p className="text-xs text-gray-500 mt-1">One scan → chat, browse vendors, add to cart, pay on collection</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {dataUrl && (
            <a
              href={dataUrl}
              download="order-from-all-vendors.png"
              className="inline-block bg-gray-800 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-700 transition-all"
            >
              Download QR code
            </a>
          )}
          <a
            href={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/qr`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-500 transition-all"
          >
            Share image link
          </a>
          <a
            href={url}
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Open in browser
          </a>
        </div>
      </div>
    </div>
  );
}

export default QRCodePage;
