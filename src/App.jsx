import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import ChatInterface from './components/ChatInterface';
import VendorDashboard from './components/VendorDashboard';
import OrderConfirmation from './components/OrderConfirmation';
import CentralDashboard from './components/CentralDashboard';
import DemoHub from './components/DemoHub';
import QRCodePage from './components/QRCodePage';

function App() {
  const [view, setView] = useState('loading'); // loading, chat, vendor, confirmation
  const [vendorId, setVendorId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const { initializeSession, session } = useStore();

  useEffect(() => {
    // Parse URL parameters (from QR code scan)
    const params = new URLSearchParams(window.location.search);
    const vendor = params.get('vendor');
    const location = params.get('location');
    const viewParam = params.get('view');

    if (viewParam === 'vendor') {
      setView('vendor');
      setVendorId(vendor);
    } else if (viewParam === 'central') {
      setView('central');
    } else if (viewParam === 'demo') {
      setView('demo');
    } else if (viewParam === 'qr') {
      setView('qr');
    } else if (viewParam === 'order') {
      setView('confirmation');
      setOrderId(params.get('orderId'));
    } else {
      // Unified chatbot - works with or without vendor
      setVendorId(vendor || null);
      initializeSession(vendor || null, location || 'Event').then(() => {
        setView('chat');
      });
    }
  }, [initializeSession]);

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (view === 'vendor') {
    return <VendorDashboard vendorId={vendorId} />;
  }

  if (view === 'central') {
    return <CentralDashboard />;
  }

  if (view === 'demo') {
    return <DemoHub />;
  }

  if (view === 'qr') {
    return <QRCodePage />;
  }

  if (view === 'confirmation') {
    return <OrderConfirmation orderId={orderId} />;
  }

  return (
    <ChatInterface 
      vendorId={vendorId} 
      sessionId={session?.id}
      onOrderComplete={(orderId) => {
        setOrderId(orderId);
        setView('confirmation');
      }}
    />
  );
}

export default App;
