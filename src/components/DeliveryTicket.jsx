import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';

function DeliveryTicket({ deliveryId }) {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await fetch(`${API_URL}/api/delivery/${deliveryId}`);
        if (res.ok) {
          const data = await res.json();
          setDelivery(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDelivery();
  }, [deliveryId]);

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  };

  const qrUrl = `${API_URL}/api/delivery/${deliveryId}/qr`;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <p className="text-stone-600 font-medium">Loading delivery ticket...</p>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold">Delivery not found.</p>
          <a href="/" className="mt-4 inline-block text-purple-600 font-medium">Back to order</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Printable ticket - matches Unified Food Hall Delivery format */}
        <div
          id="delivery-ticket"
          className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-stone-300"
        >
          <div className="p-6 font-mono text-sm text-stone-800 whitespace-pre-wrap">
            <div className="text-center border-b-2 border-dashed border-stone-400 pb-3 mb-3">
              <h1 className="text-lg font-bold tracking-wider">UNIFIED FOOD HALL DELIVERY</h1>
            </div>
            <div className="space-y-1 border-b border-stone-300 pb-3 mb-3">
              <p>ORDER ID: #{delivery.orderNumber}          DATE: {formatDate(delivery.date)}</p>
              <p>DESTINATION: {delivery.destination}</p>
              <p>TYPE: Multi-Vendor Aggregated Delivery</p>
            </div>
            <p className="mb-4">GUEST: {delivery.guestName} (Host)</p>
            <div className="space-y-4">
              {delivery.vendors.map((v) => (
                <div key={v.vendorId}>
                  <p>[ ] {v.vendorName}</p>
                  <ul className="ml-4 list-none space-y-1">
                    {v.items.map((item, i) => (
                      <li key={i}>
                        - {item.quantity}x {item.name}
                        {item.allergens && item.allergens.length > 0 && (
                          <span className="text-amber-700"> (ALLERGEN: {item.allergens.join(', ').toUpperCase()})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-dashed border-stone-400 mt-4 pt-3 space-y-1">
              <p>TOTAL ITEMS: {delivery.totalItems} | VENDORS: {delivery.vendorCount}</p>
              <p>DISPATCHED FROM: Central Aggregation Hub</p>
            </div>
            <div className="border-t-2 border-stone-400 mt-3 pt-3 text-center">
              <p className="mb-2">SCAN FOR LIVE TRACKING & SUPPORT:</p>
              <img src={qrUrl} alt="QR Code for tracking" className="mx-auto w-[140px] h-[140px] border border-stone-300 rounded" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-stone-700 text-white rounded-lg font-semibold hover:bg-stone-800 transition"
          >
            Print ticket
          </button>
          <a
            href={qrUrl}
            download="delivery-tracking-qr.png"
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition inline-block"
          >
            Download QR code
          </a>
          <a
            href="/"
            className="px-5 py-2.5 bg-stone-200 text-stone-800 rounded-lg font-semibold hover:bg-stone-300 transition inline-block"
          >
            Back to order
          </a>
        </div>
      </div>
    </div>
  );
}

export default DeliveryTicket;
