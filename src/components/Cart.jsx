import React, { useState } from 'react';
import { useStore } from '../store';

const ORDER_TYPES = [
  { id: 'DINE_IN', label: 'Dine In', icon: '🍽️', description: 'Eat at a table' },
  { id: 'COLLECTION', label: 'Collection', icon: '🛍️', description: 'Pick up at counter' },
  { id: 'DELIVERY', label: 'Delivery', icon: '🚚', description: 'Deliver to location' }
];

function Cart({ onClose, onOrderComplete }) {
  const { cart, updateQuantity, removeFromCart, getCartTotal, createOrder } = useStore();
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [destination, setDestination] = useState('');
  const [guestName, setGuestName] = useState('');
  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const total = getCartTotal();
  const deliveryFee = orderType === 'DELIVERY' ? 2.50 : 0;
  const finalTotal = total + deliveryFee;

  const handleCheckout = () => {
    if (!phone.trim()) {
      alert('Please enter your phone number for order updates');
      return;
    }
    if (orderType === 'DELIVERY' && !destination.trim()) {
      alert('Please enter a delivery address');
      return;
    }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      alert('Please enter your table number');
      return;
    }
    setShowPaymentOptions(true);
  };
  
  const processPayment = async (method) => {
    setPaymentMethod(method);
    setIsCheckingOut(true);
    
    try {
      const orderData = {
        phone,
        instructions,
        destination: orderType === 'DELIVERY' ? destination.trim() : undefined,
        guestName: guestName.trim() || undefined,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
        deliveryFee
      };
      const result = await createOrder(orderData.phone, orderData.instructions, orderData.destination, orderData.guestName, orderData.orderType, orderData.tableNumber, orderData.deliveryFee);
      result.paymentMethod = method;
      result.orderType = orderType;
      onOrderComplete(result);
    } catch (error) {
      alert('Failed to create order. Please try again.');
      setIsCheckingOut(false);
      setShowPaymentOptions(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 safe-x">
      <div className="bg-white rounded-t-3xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl safe-x">
        {/* Header — touch-friendly close */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b safe-top">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Your Cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target text-gray-500 hover:text-gray-700 text-2xl rounded-full flex items-center justify-center -mr-2"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Cart Items — scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 text-lg">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-2">Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-600">£{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="touch-target w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 text-lg"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="touch-target w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 text-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">£{(item.price * item.quantity).toFixed(2)}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="touch-target text-red-500 text-sm hover:text-red-700 mt-0.5 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order Type Selection — 1 col mobile, 3 col tablet+ */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  How would you like your order?
                </label>
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
                  {ORDER_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => setOrderType(type.id)}
                      className={`touch-target p-3 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-1 ${
                        orderType === type.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{type.icon}</span>
                      <span className={`text-sm font-semibold block ${
                        orderType === type.id ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        {type.label}
                      </span>
                      <span className="text-xs text-gray-500">{type.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Details */}
              <div className="mt-4 space-y-3">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number for updates (required)"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                {/* Table Number - for Dine In */}
                {orderType === 'DINE_IN' && (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Table number (required)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
                
                {/* Delivery Address - for Delivery */}
                {orderType === 'DELIVERY' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Delivery address (required)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      <span>🚚</span>
                      <span>Delivery fee: £{deliveryFee.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {/* Collection Point Info */}
                {orderType === 'COLLECTION' && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <span>📍</span>
                    <span>Pick up at the collection counter when ready</span>
                  </div>
                )}
                
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions (optional)"
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer — safe area on notched devices */}
        {cart.length > 0 && (
          <div className="border-t p-4 sm:p-6 space-y-4 safe-bottom flex-shrink-0">
            {/* Subtotal and fees */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-gray-600">
                <span>Subtotal</span>
                <span>£{total.toFixed(2)}</span>
              </div>
              {orderType === 'DELIVERY' && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>Delivery fee</span>
                  <span>£{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold text-gray-700">Total</span>
                <span className="text-2xl font-bold text-purple-600">£{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="touch-target w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? 'Processing...' : `Checkout · ${ORDER_TYPES.find(t => t.id === orderType)?.icon} ${ORDER_TYPES.find(t => t.id === orderType)?.label}`}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              Apple Pay, Card, or Cash accepted
            </p>
          </div>
        )}
        
        {/* Payment Options Modal */}
        {showPaymentOptions && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 rounded-t-3xl">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose Payment Method</h3>
              
              {/* Order Type Badge */}
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {ORDER_TYPES.find(t => t.id === orderType)?.icon} {ORDER_TYPES.find(t => t.id === orderType)?.label}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                  {orderType === 'DELIVERY' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>£{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t mt-2 pt-2 text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-800">£{finalTotal.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => processPayment('apple_pay')}
                  disabled={isCheckingOut}
                  className="w-full py-3 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                   Pay with Apple Pay
                </button>
                <button
                  onClick={() => processPayment('card')}
                  disabled={isCheckingOut}
                  className="w-full py-3 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  💳 Pay with Card
                </button>
                <button
                  onClick={() => processPayment('cash')}
                  disabled={isCheckingOut}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                >
                  💵 Pay with Cash
                </button>
                {paymentMethod === 'cash' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      <span>📍</span>
                      <span>Pay at the collection point when picking up your order</span>
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowPaymentOptions(false);
                    setPaymentMethod(null);
                  }}
                  disabled={isCheckingOut}
                  className="w-full py-2 text-gray-500 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
