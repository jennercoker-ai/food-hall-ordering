import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import ChatInterface from './components/ChatInterface';
import ConciergeChat from './components/ConciergeChat';
import GroupOrderInterface from './components/GroupOrderInterface';
import VendorDashboard from './components/VendorDashboard';
import VendorKDS from './components/VendorKDS';
import OrderConfirmation from './components/OrderConfirmation';
import CentralDashboard from './components/CentralDashboard';
import DemoHub from './components/DemoHub';
import QRCodePage from './components/QRCodePage';
import DeliveryTicket from './components/DeliveryTicket';
import CustomerDashboard from './components/CustomerDashboard';
import DeliveryDashboard from './components/DeliveryDashboard';
import VendorPicker from './components/VendorPicker';

function App() {
  const [view, setView] = useState('loading'); // loading, chat, concierge, vendor, confirmation, delivery
  const [vendorId, setVendorId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [deliveryId, setDeliveryId] = useState(null);
  const [groupId, setGroupId] = useState(null);
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
    } else if (viewParam === 'delivery') {
      setView('delivery');
      setDeliveryId(params.get('deliveryId'));
    } else if (viewParam === 'customer') {
      setView('customer');
    } else if (viewParam === 'delivery-dashboard') {
      setView('delivery-dashboard');
    } else if (viewParam === 'kds') {
      setView('kds');
      setVendorId(vendor);
    } else if (viewParam === 'concierge') {
      const group = params.get('group');
      setGroupId(group || null);
      initializeSession(null, location || 'Event').then(() => {
        setView('concierge');
      });
    } else if (viewParam === 'family' || viewParam === 'group-order') {
      setView('family');
    } else {
      // Unified chatbot - works with or without vendor
      setVendorId(vendor || null);
      const group = params.get('group');
      setGroupId(group || null);
      initializeSession(vendor || null, location || 'Event').then(() => {
        setView('chat');
      });
    }
  }, [initializeSession]);

  if (view === 'loading') {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center safe-y safe-x">
        <div className="text-white text-xl sm:text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (view === 'vendor') {
    if (!vendorId) return <VendorPicker />;
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

  if (view === 'delivery') {
    return <DeliveryTicket deliveryId={deliveryId} />;
  }

  if (view === 'customer') {
    return <CustomerDashboard />;
  }

  if (view === 'delivery-dashboard') {
    return <DeliveryDashboard />;
  }

  if (view === 'kds') {
    if (!vendorId) return <VendorPicker onSelect={(id) => setVendorId(id)} forKDS={true} />;
    return <VendorKDS vendorId={vendorId} />;
  }

  if (view === 'concierge') {
    return (
      <ConciergeChat 
        sessionId={session?.id}
        groupId={groupId}
        onOrderComplete={(result) => {
          if (result && result.deliveryId) {
            setDeliveryId(result.deliveryId);
            setView('delivery');
          } else {
            setOrderId(typeof result === 'object' ? result?.id : result);
            setView('confirmation');
          }
        }}
      />
    );
  }

  if (view === 'family') {
    return (
      <GroupOrderInterface 
        onOrderComplete={(result) => {
          if (result?.deliveryId) {
            setDeliveryId(result.deliveryId);
            setOrderId(result.orders?.[0]?.id || null);
            setView('delivery');
          } else {
            setOrderId(result?.id || result?.orders?.[0]?.id || null);
            setView('confirmation');
          }
        }}
      />
    );
  }

  return (
    <ChatInterface 
      vendorId={vendorId} 
      sessionId={session?.id}
      onOrderComplete={(result) => {
        if (result && result.deliveryId) {
          setDeliveryId(result.deliveryId);
          setView('delivery');
        } else {
          setOrderId(typeof result === 'object' ? result?.id : result);
          setView('confirmation');
        }
      }}
    />
  );
}

export default App;
