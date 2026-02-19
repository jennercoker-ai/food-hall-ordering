import React, { useState, useEffect, useRef } from 'react';
import { useConcierge } from '../hooks/useConcierge';
import { useStore } from '../store';
import MenuCard from './MenuCard';

function ConciergeChat({ sessionId, groupId, onOrderComplete }) {
  const [inputText, setInputText] = useState('');
  const [showCart, setShowCart] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { cart, addToCart, getCartTotal } = useStore();
  
  const {
    messages,
    isLoading,
    error,
    dietaryFilters,
    allergenFilters,
    sendMessage,
    selectItem,
    startConversation,
    isGroupSession
  } = useConcierge({
    sessionId,
    groupId,
    onAddToCart: addToCart
  });

  useEffect(() => {
    startConversation();
  }, [startConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleAddToCart = (item) => {
    addToCart(item, 1);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              🎩
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Food Hall Concierge</h1>
              <p className="text-sm text-gray-500">Your personal dining assistant</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            🛒 Cart
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters */}
        {(dietaryFilters.length > 0 || allergenFilters.length > 0 || isGroupSession) && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {isGroupSession && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                👥 Group Order
              </span>
            )}
            {dietaryFilters.map(filter => (
              <span key={filter} className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                🌱 {filter}
              </span>
            ))}
            {allergenFilters.map(filter => (
              <span key={filter} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                ⚠️ No {filter}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs shadow-md">
                  <p className="text-gray-800">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-lg">
                  {/* Main response bubble */}
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                    <p className="text-gray-800 leading-relaxed">{message.content}</p>
                  </div>
                  
                  {/* Menu Items */}
                  {message.menuItems && message.menuItems.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-white text-xs font-medium opacity-80 px-1">Available Options:</p>
                      {message.menuItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl p-3 shadow-md">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{item.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{item.vendorName}</p>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.isVegan && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">🌱 Vegan</span>
                                )}
                                {item.isVegetarian && !item.isVegan && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">🥬 Vegetarian</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <p className="font-bold text-indigo-600">{item.formattedPrice}</p>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="mt-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold rounded-full hover:shadow-md transition-all"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upsell Suggestions */}
                  {message.upsells && message.upsells.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-white text-xs font-medium opacity-80 px-1">✨ Perfect Pairings:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {message.upsells.map((item) => (
                          <div key={item.id} className="flex-shrink-0 w-40 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 shadow-md border border-amber-200">
                            <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.vendorName}</p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-bold text-amber-600 text-sm">{item.formattedPrice}</p>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full hover:bg-amber-600 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm hover:shadow transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                <span className="text-gray-500 text-sm ml-1">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about menus, dietary needs, or recommendations..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-xl text-gray-800">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">🛒</p>
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-1">Ask me for recommendations!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.vendorName} × {item.quantity}</p>
                      </div>
                      <p className="font-bold text-indigo-600">£{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-xl text-indigo-600">£{getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t">
                <button 
                  onClick={() => {
                    setShowCart(false);
                    if (onOrderComplete) onOrderComplete();
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConciergeChat;
