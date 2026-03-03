import React, { useState } from 'react';
import { useGroupOrder } from '../hooks/useGroupOrder';
import GroupCartSummary from './GroupCartSummary';

const ORDER_TYPES = [
  { id: 'DINE_IN', label: 'Dine In', icon: '🍽️', description: 'Eat at a table' },
  { id: 'COLLECTION', label: 'Collection', icon: '🛍️', description: 'Pick up at counter' },
  { id: 'DELIVERY', label: 'Delivery', icon: '🚚', description: 'Deliver to location' }
];

function GroupCart({ onClose, onCheckout }) {
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [viewMode, setViewMode] = useState('person'); // 'person' or 'vendor'
  const [paymentMethod, setPaymentMethod] = useState(null); // 'apple', 'card', 'cash'
  const [showCashConfirm, setShowCashConfirm] = useState(false);
  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const deliveryFee = orderType === 'DELIVERY' ? 2.50 : 0;
  
  const {
    groupName,
    guests,
    currentGuest,
    isHost,
    isCartLocked,
    lockedBy,
    getCartByGuest,
    getGroupTotal,
    getItemCount,
    updateQuantity,
    removeFromCart,
    lockCart,
    unlockCart,
    prepareOrderData
  } = useGroupOrder();
  
  const cartByGuest = getCartByGuest();
  const totalAmount = getGroupTotal();
  const itemCount = getItemCount();
  
  const handleLockToggle = () => {
    if (isCartLocked) {
      unlockCart();
    } else {
      lockCart();
    }
  };
  
  const handlePayment = () => {
    if (!isHost) return;
    setShowOrderTypeModal(true);
  };
  
  const proceedToPayment = () => {
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert('Please enter a delivery address');
      return;
    }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      alert('Please enter your table number');
      return;
    }
    setShowOrderTypeModal(false);
    setShowPaymentConfirm(true);
  };
  
  const confirmPayment = async (method) => {
    const orderData = prepareOrderData();
    orderData.paymentMethod = method;
    orderData.orderType = orderType;
    orderData.tableNumber = orderType === 'DINE_IN' ? tableNumber : undefined;
    orderData.deliveryAddress = orderType === 'DELIVERY' ? deliveryAddress : undefined;
    orderData.deliveryFee = deliveryFee;
    setCheckoutError(null);
    setIsSubmitting(true);
    try {
      if (onCheckout) {
        await Promise.resolve(onCheckout(orderData));
      }
      setShowPaymentConfirm(false);
      setShowCashConfirm(false);
      setShowOrderTypeModal(false);
      setPaymentMethod(null);
    } catch (e) {
      setCheckoutError(e.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCashPayment = () => {
    setPaymentMethod('cash');
    setShowCashConfirm(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                👨‍👩‍👧‍👦 {groupName || 'Family Order'}
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                {guests.length} {guests.length === 1 ? 'person' : 'people'} · {itemCount} items
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          
          {/* Lock Status Banner */}
          {isCartLocked && (
            <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span className="text-sm">Cart locked by {lockedBy} — Ready for payment</span>
            </div>
          )}
          
          {/* View Toggle */}
          {itemCount > 0 && (
            <div className="mt-3 flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('person')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'person' 
                    ? 'bg-white text-purple-600' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                👤 By Person
              </button>
              <button
                onClick={() => setViewMode('vendor')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'vendor' 
                    ? 'bg-white text-purple-600' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                🏪 By Vendor
              </button>
            </div>
          )}
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {viewMode === 'vendor' ? (
            /* Vendor View */
            <GroupCartSummary
              items={cartByGuest ? Object.values(cartByGuest).flatMap(g => g.items) : []}
              guests={guests}
              totalAmount={totalAmount}
              onPay={handlePayment}
              isLocked={isCartLocked}
              isHost={isHost}
            />
          ) : (
          /* Person View */
          guests.map(guest => {
            const guestCart = cartByGuest[guest.id];
            if (!guestCart || guestCart.items.length === 0) {
              return (
                <div key={guest.id} className={`rounded-xl border-2 border-dashed ${guest.color.border} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full ${guest.color.bg} ${guest.color.text} flex items-center justify-center font-bold text-sm`}>
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-700">{guest.name}</span>
                    {guest.isHost && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Host</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm text-center py-2">No items yet</p>
                </div>
              );
            }
            
            return (
              <div key={guest.id} className={`rounded-xl border-2 ${guest.color.border} ${guest.color.bg} overflow-hidden`}>
                {/* Guest Header */}
                <div className={`px-4 py-3 ${guest.color.bg} border-b ${guest.color.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-white ${guest.color.text} flex items-center justify-center font-bold text-sm shadow-sm`}>
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={`font-semibold ${guest.color.text}`}>{guest.name}</span>
                      {guest.isHost && (
                        <span className="ml-2 text-xs bg-white/50 text-purple-700 px-2 py-0.5 rounded-full">👑 Host</span>
                      )}
                    </div>
                  </div>
                  <div className={`font-bold ${guest.color.text}`}>
                    £{guestCart.subtotal.toFixed(2)}
                  </div>
                </div>
                
                {/* Guest Items */}
                <div className="bg-white divide-y divide-gray-100">
                  {guestCart.items.map(cartItem => (
                    <div key={cartItem.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">{cartItem.item.name}</h4>
                        <p className="text-xs text-gray-500">{cartItem.item.vendorName}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Quantity Controls */}
                        {(!isCartLocked || isHost) && (
                          <div className="flex items-center bg-gray-100 rounded-full">
                            <button
                              onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                              disabled={isCartLocked && !isHost}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        )}
                        
                        {isCartLocked && !isHost && (
                          <span className="text-sm text-gray-500">×{cartItem.quantity}</span>
                        )}
                        
                        <span className="font-semibold text-gray-800 w-16 text-right">
                          £{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                        </span>
                        
                        {(!isCartLocked || isHost) && (
                          <button
                            onClick={() => removeFromCart(cartItem.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
          )}
          
          {itemCount === 0 && viewMode === 'person' && (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">🛒</span>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Cart is empty</h3>
              <p className="text-gray-500">Add items for your family to get started!</p>
            </div>
          )}
        </div>
        
        {/* Footer with Total & Actions - Only in Person View */}
        {itemCount > 0 && viewMode === 'person' && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
            {/* Summary */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total for {guests.length} people</p>
                <p className="text-2xl font-bold text-gray-800">£{(totalAmount + deliveryFee).toFixed(2)}</p>
                {deliveryFee > 0 && (
                  <p className="text-xs text-amber-600">Includes £{deliveryFee.toFixed(2)} delivery</p>
                )}
              </div>
              
              {/* Host Controls */}
              {isHost && (
                <button
                  onClick={handleLockToggle}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    isCartLocked
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {isCartLocked ? '🔓 Unlock Cart' : '🔒 Lock Cart'}
                </button>
              )}
            </div>
            
            {/* Payment Button - Host Only */}
            {isHost ? (
              <button
                onClick={handlePayment}
                disabled={!isCartLocked}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isCartLocked
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isCartLocked ? (
                  <span className="flex items-center justify-center gap-2">
                     Pay £{(totalAmount + deliveryFee).toFixed(2)}
                  </span>
                ) : (
                  'Lock cart to pay'
                )}
              </button>
            ) : (
              <div className="text-center py-3 bg-purple-50 rounded-xl">
                <p className="text-purple-700 text-sm">
                  👑 Waiting for {guests.find(g => g.isHost)?.name || 'Host'} to complete payment
                </p>
              </div>
            )}
            
            {!isCartLocked && isHost && (
              <p className="text-xs text-center text-gray-500">
                💡 Lock the cart when everyone has finished adding items
              </p>
            )}
          </div>
        )}
        
        {/* Order Type Selection Modal */}
        {showOrderTypeModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">How would you like your order?</h3>
              
              {/* Order Type Options */}
              <div className="space-y-2 mb-4">
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setOrderType(type.id)}
                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                      orderType === type.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl">{type.icon}</span>
                    <div className="text-left">
                      <span className={`font-semibold block ${orderType === type.id ? 'text-purple-700' : 'text-gray-700'}`}>
                        {type.label}
                      </span>
                      <span className="text-xs text-gray-500">{type.description}</span>
                    </div>
                    {orderType === type.id && (
                      <span className="ml-auto text-purple-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Conditional Fields */}
              {orderType === 'DINE_IN' && (
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table number (required)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
              
              {orderType === 'DELIVERY' && (
                <div className="mb-4 space-y-2">
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address (required)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    <span>🚚</span>
                    <span>Delivery fee: £{deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {orderType === 'COLLECTION' && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-4">
                  <span>📍</span>
                  <span>Pick up at the collection counter when ready</span>
                </div>
              )}
              
              <div className="space-y-2">
                <button
                  onClick={proceedToPayment}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold"
                >
                  Continue to Payment
                </button>
                <button
                  onClick={() => setShowOrderTypeModal(false)}
                  className="w-full py-2 text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Confirmation Modal */}
        {showPaymentConfirm && !showCashConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
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
                    <span>Subtotal ({itemCount} items)</span>
                    <span>£{totalAmount.toFixed(2)}</span>
                  </div>
                  {orderType === 'DELIVERY' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>£{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-800">£{(totalAmount + deliveryFee).toFixed(2)}</p>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <p className="text-xs text-gray-500 text-center">
                    Paying for {guests.length} people
                  </p>
                </div>
              </div>
              
              {checkoutError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {checkoutError}
                </div>
              )}
              <div className="space-y-2">
                <button
                  onClick={() => confirmPayment('apple_pay')}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting…' : ' Pay with Apple Pay'}
                </button>
                <button
                  onClick={() => confirmPayment('card')}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  💳 Pay with Card
                </button>
                <button
                  onClick={handleCashPayment}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                >
                  💵 Pay with Cash
                </button>
                <button
                  onClick={() => {
                    setShowPaymentConfirm(false);
                    setShowOrderTypeModal(true);
                  }}
                  className="w-full py-2 text-gray-500 text-sm"
                >
                  ← Back to order type
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Cash Payment Confirmation Modal */}
        {showCashConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center mb-4">
                <span className="text-5xl">💵</span>
                <h3 className="text-xl font-bold text-gray-800 mt-3">Cash Payment</h3>
              </div>
              
              {/* Order Type Badge */}
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {ORDER_TYPES.find(t => t.id === orderType)?.icon} {ORDER_TYPES.find(t => t.id === orderType)?.label}
                </span>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-green-700 mb-1">Amount Due</p>
                  <p className="text-3xl font-bold text-green-800">£{(totalAmount + deliveryFee).toFixed(2)}</p>
                  {orderType === 'DELIVERY' && (
                    <p className="text-xs text-green-600 mt-1">Includes £{deliveryFee.toFixed(2)} delivery</p>
                  )}
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-semibold text-amber-800">
                      {orderType === 'DELIVERY' ? 'Pay on Delivery' : 'Pay at Collection Point'}
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      {orderType === 'DELIVERY' 
                        ? 'Have the exact amount ready. Our delivery person will collect payment upon arrival.'
                        : 'Please proceed to the nearest cash register to complete your payment. Show your order number when prompted.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {checkoutError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {checkoutError}
                </div>
              )}
              <div className="space-y-2">
                <button
                  onClick={() => confirmPayment('cash')}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting…' : '✓ Confirm Cash Payment'}
                </button>
                <button
                  onClick={() => {
                    setShowCashConfirm(false);
                    setPaymentMethod(null);
                    setCheckoutError(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full py-2 text-gray-500 text-sm disabled:opacity-50"
                >
                  Back to payment options
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupCart;
