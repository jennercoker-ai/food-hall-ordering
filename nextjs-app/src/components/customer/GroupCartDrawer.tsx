'use client';

import { useState } from 'react';
import { useGroupSession } from '@/store/groupSession';
import type { OrderType } from '@/lib/types';

const ORDER_TYPES: { id: OrderType; label: string; icon: string; hint: string }[] = [
  { id: 'DINE_IN', label: 'Dine In', icon: '🍽️', hint: 'Eat at a table' },
  { id: 'COLLECTION', label: 'Collection', icon: '🛍️', hint: 'Pick up at counter' },
  { id: 'DELIVERY', label: 'Delivery', icon: '🚚', hint: 'Deliver to you' },
];

interface Props {
  onClose: () => void;
  onOrderComplete: (groupId: string, orderIds: string[]) => void;
}

export default function GroupCartDrawer({ onClose, onOrderComplete }: Props) {
  const {
    groupName, guests, cart, isCartLocked, lockedBy,
    isHost, getGroupTotal, getItemCount, getCartByGuest,
    updateQuantity, removeFromCart, lockCart, unlockCart,
    prepareOrderPayload, setOrderMeta, orderType, tableNumber, deliveryAddress, phone, specialInstructions,
  } = useGroupSession();

  const [step, setStep] = useState<'cart' | 'type' | 'pay'>('cart');
  const [viewMode, setViewMode] = useState<'person' | 'vendor'>('person');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = getGroupTotal();
  const itemCount = getItemCount();
  const cartByGuest = getCartByGuest();
  const deliveryFee = orderType === 'DELIVERY' ? 2.5 : 0;

  const host = isHost();

  const canProceed = () => {
    if (orderType === 'DINE_IN' && !tableNumber.trim()) return false;
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) return false;
    if (!phone.trim()) return false;
    return true;
  };

  const handlePay = async (method: string) => {
    if (!canProceed()) return;
    setIsSubmitting(true);
    try {
      const payload = prepareOrderPayload();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      onOrderComplete(data.groupId, data.orders.map((o: { id: string }) => o.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-5 py-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                👨‍👩‍👧‍👦 {groupName}
              </h2>
              <p className="text-purple-200 text-sm mt-0.5">
                {guests.length} people · {itemCount} items
              </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
          </div>

          {isCartLocked && (
            <div className="mt-3 bg-white/20 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
              🔒 Locked by {lockedBy} · Ready to pay
            </div>
          )}

          {/* View toggle */}
          {itemCount > 0 && step === 'cart' && (
            <div className="mt-3 flex bg-white/20 rounded-lg p-1">
              {(['person', 'vendor'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === m ? 'bg-white text-purple-700' : 'text-white/80 hover:text-white'}`}
                >
                  {m === 'person' ? '👤 By Person' : '🏪 By Vendor'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {step === 'cart' && (
            <>
              {itemCount === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">🛒</p>
                  <p className="text-gray-500">Cart is empty — add items first</p>
                </div>
              ) : viewMode === 'vendor' ? (
                /* By vendor */
                (() => {
                  const byVendor: Record<string, { name: string; items: typeof cart }> = {};
                  cart.forEach((c) => {
                    if (!byVendor[c.vendorId]) byVendor[c.vendorId] = { name: c.vendorName, items: [] };
                    byVendor[c.vendorId].items.push(c);
                  });
                  return Object.entries(byVendor).map(([vid, v]) => (
                    <div key={vid} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <p className="font-semibold text-orange-700 text-sm uppercase tracking-wide">{v.name}</p>
                      </div>
                      {v.items.map((ci) => (
                        <div key={ci.id} className="px-4 py-3 flex items-center gap-3 border-b last:border-0">
                          <div className="flex-1 text-sm">
                            <p className="font-medium">{ci.name}</p>
                            <p className="text-gray-400 text-xs">👤 {ci.guestName}</p>
                          </div>
                          <span className="text-sm font-semibold">£{(ci.price * ci.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ));
                })()
              ) : (
                /* By person */
                Object.values(cartByGuest).map(({ guest, items, subtotal }) => (
                  <div key={guest.id} className={`rounded-xl border-2 ${guest.color.border} overflow-hidden`}>
                    <div className={`px-4 py-2.5 ${guest.color.bg} border-b flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full bg-white ${guest.color.text} flex items-center justify-center font-bold text-sm`}>
                          {guest.name[0].toUpperCase()}
                        </div>
                        <span className={`font-semibold ${guest.color.text}`}>{guest.name}</span>
                        {guest.isHost && <span className="text-xs bg-white/50 text-purple-700 px-2 py-0.5 rounded-full">👑 Host</span>}
                      </div>
                      <span className={`font-bold text-sm ${guest.color.text}`}>£{subtotal.toFixed(2)}</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-3">No items</p>
                    ) : (
                      items.map((ci) => (
                        <div key={ci.id} className="px-4 py-3 flex items-center gap-3 bg-white border-b last:border-0">
                          <div className="flex-1 text-sm">
                            <p className="font-medium">{ci.name}</p>
                            <p className="text-xs text-gray-400">{ci.vendorName}</p>
                          </div>
                          {(!isCartLocked || host) && (
                            <div className="flex items-center bg-gray-100 rounded-full">
                              <button onClick={() => updateQuantity(ci.id, ci.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-600">−</button>
                              <span className="w-5 text-center text-sm font-medium">{ci.quantity}</span>
                              <button onClick={() => updateQuantity(ci.id, ci.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-600">+</button>
                            </div>
                          )}
                          {(!isCartLocked || host) && (
                            <button onClick={() => removeFromCart(ci.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                          )}
                          <span className="text-sm font-semibold w-14 text-right">£{(ci.price * ci.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {step === 'type' && (
            <div className="space-y-3 py-2">
              <h3 className="font-bold text-gray-800 text-lg">How would you like your order?</h3>
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOrderMeta({ orderType: t.id })}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${orderType === t.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="text-3xl">{t.icon}</span>
                  <div className="text-left">
                    <p className={`font-semibold ${orderType === t.id ? 'text-purple-700' : 'text-gray-800'}`}>{t.label}</p>
                    <p className="text-xs text-gray-500">{t.hint}</p>
                  </div>
                  {orderType === t.id && <span className="ml-auto text-purple-500 text-lg">✓</span>}
                </button>
              ))}

              <div className="space-y-2 pt-2">
                <input
                  value={phone}
                  onChange={(e) => setOrderMeta({ phone: e.target.value })}
                  placeholder="Phone number (required)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                {orderType === 'DINE_IN' && (
                  <input
                    value={tableNumber}
                    onChange={(e) => setOrderMeta({ tableNumber: e.target.value })}
                    placeholder="Table number (required)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                )}
                {orderType === 'DELIVERY' && (
                  <input
                    value={deliveryAddress}
                    onChange={(e) => setOrderMeta({ deliveryAddress: e.target.value })}
                    placeholder="Delivery address (required)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                )}
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setOrderMeta({ specialInstructions: e.target.value })}
                  placeholder="Special instructions (optional)"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                />
              </div>
            </div>
          )}

          {step === 'pay' && (
            <div className="space-y-3 py-2">
              <h3 className="font-bold text-gray-800 text-lg text-center">Choose Payment</h3>

              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {ORDER_TYPES.find((t) => t.id === orderType)?.icon} {ORDER_TYPES.find((t) => t.id === orderType)?.label}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between text-gray-600"><span>Subtotal ({itemCount} items)</span><span>£{totalAmount.toFixed(2)}</span></div>
                {deliveryFee > 0 && <div className="flex justify-between text-gray-600"><span>Delivery</span><span>£{deliveryFee.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t mt-1 text-base">
                  <span>Total</span><span>£{(totalAmount + deliveryFee).toFixed(2)}</span>
                </div>
              </div>

              <button onClick={() => handlePay('apple_pay')} disabled={isSubmitting} className="w-full py-3.5 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                 Pay with Apple Pay
              </button>
              <button onClick={() => handlePay('card')} disabled={isSubmitting} className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50">
                💳 Pay with Card
              </button>
              <button onClick={() => handlePay('cash')} disabled={isSubmitting} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                💵 Cash {orderType === 'DELIVERY' ? 'on Delivery' : 'on Collection'}
              </button>

              {isSubmitting && <p className="text-center text-purple-600 text-sm animate-pulse">Placing order…</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {itemCount > 0 && (
          <div className="border-t bg-gray-50 p-4 space-y-2 flex-shrink-0">
            {step === 'cart' && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">{guests.length} people</p>
                    <p className="text-xl font-bold text-gray-900">£{totalAmount.toFixed(2)}</p>
                  </div>
                  {host && (
                    <button
                      onClick={isCartLocked ? unlockCart : lockCart}
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${isCartLocked ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                    >
                      {isCartLocked ? '🔓 Unlock' : '🔒 Lock Cart'}
                    </button>
                  )}
                </div>
                {host ? (
                  <button
                    onClick={() => setStep('type')}
                    disabled={!isCartLocked}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isCartLocked ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    {isCartLocked ? ` Checkout · £${totalAmount.toFixed(2)}` : 'Lock cart to checkout'}
                  </button>
                ) : (
                  <div className="text-center py-3 bg-purple-50 rounded-xl text-sm text-purple-700">
                    👑 Waiting for {guests.find((g) => g.isHost)?.name ?? 'Host'} to checkout
                  </div>
                )}
              </>
            )}

            {step === 'type' && (
              <div className="flex gap-2">
                <button onClick={() => setStep('cart')} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm">← Back</button>
                <button
                  onClick={() => setStep('pay')}
                  disabled={!canProceed()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            )}

            {step === 'pay' && (
              <button onClick={() => setStep('type')} className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm">← Back to order type</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
