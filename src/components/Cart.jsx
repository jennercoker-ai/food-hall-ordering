import React, { useState } from 'react';
import { useStore } from '../store';

function Cart({ onClose, onOrderComplete }) {
  const { cart, updateQuantity, removeFromCart, getCartTotal, createOrder } = useStore();
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const total = getCartTotal();

  const handleCheckout = async () => {
    if (!phone.trim()) {
      alert('Please enter your phone number for order updates');
      return;
    }

    setIsCheckingOut(true);
    
    try {
      const order = await createOrder(phone, instructions);
      onOrderComplete(order.id);
    } catch (error) {
      alert('Failed to create order. Please try again.');
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 text-lg">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-2">Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">£{item.price.toFixed(2)} each</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-800">£{(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 text-sm hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Order Details */}
              <div className="mt-6 space-y-3">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number for updates (required)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions (optional)"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-purple-600">£{total.toFixed(2)}</span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? 'Processing...' : 'Place Order'}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              💷 Payment by cash on collection. You'll receive SMS updates when your order is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
