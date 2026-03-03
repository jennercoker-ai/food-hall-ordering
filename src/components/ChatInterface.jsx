import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import Cart from './Cart';
import MenuCard from './MenuCard';
import VendorGallery from './VendorGallery';
import FilterBar from './FilterBar';

const API_URL = import.meta.env.VITE_API_URL || '';

function ChatInterface({ vendorId, sessionId, onOrderComplete }) {
  const [inputText, setInputText] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'browse'
  const [filters, setFilters] = useState({ search: '', cuisine: '', dietary: [], excludeAllergens: [] });
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [vendorMenu, setVendorMenu] = useState([]);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { 
    messages, 
    sendMessage, 
    loading, 
    vendor, 
    cart,
    addToCart 
  } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Send initial greeting
    if (messages.length === 0 && vendor && activeTab === 'chat') {
      sendMessage('Hello');
    }
  }, [vendor, messages.length, sendMessage, activeTab]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleSelectVendor = async (vendorId) => {
    setSelectedVendorId(vendorId);
    setLoadingMenu(true);
    try {
      const [menuRes, vendorRes] = await Promise.all([
        fetch(`${API_URL}/api/menu/${vendorId}`),
        fetch(`${API_URL}/api/vendors/${vendorId}`)
      ]);
      const menuData = await menuRes.json();
      const vendorData = await vendorRes.json();
      
      const itemsWithVendor = menuData.map(item => ({
        ...item,
        vendorName: vendorData.name,
        vendorId: vendorData.id
      }));
      setVendorMenu(itemsWithVendor);
      setVendorInfo(vendorData);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleBackToVendors = () => {
    setSelectedVendorId(null);
    setVendorMenu([]);
    setVendorInfo(null);
  };

  const getFilteredMenu = () => {
    let items = vendorMenu;
    
    if (filters.dietary?.length > 0) {
      items = items.filter(item => {
        const itemDietary = item.dietary || [];
        return filters.dietary.some(d => itemDietary.includes(d));
      });
    }
    
    if (filters.excludeAllergens?.length > 0) {
      items = items.filter(item => {
        const itemAllergens = item.allergens || [];
        return !filters.excludeAllergens.some(a => itemAllergens.includes(a));
      });
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    }
    
    return items;
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex flex-col safe-top">
      {/* Header — responsive: stacked on mobile, row on tablet+ */}
      <div className="bg-white shadow-lg safe-x">
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
              {vendor?.name?.charAt(0) || '🍕'}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-800 text-base sm:text-lg truncate">{vendor?.name || 'Event Food Ordering'}</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{vendor?.description || 'Browse menus from all vendors'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="touch-target relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 sm:py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span>🛒</span>
            <span>Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Tabs — touch-friendly on all devices */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-3 sm:px-4 py-3.5 sm:py-3 font-semibold text-sm sm:text-base transition-colors touch-target flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>💬</span>
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 px-3 sm:px-4 py-3.5 sm:py-3 font-semibold text-sm sm:text-base transition-colors touch-target flex items-center justify-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>📋</span>
            <span>Browse</span>
          </button>
        </div>
      </div>

      {/* Content Container — scrollable, padding for fixed input + safe area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 pb-28 sm:pb-24 safe-bottom">
        {activeTab === 'chat' ? (
          <div className="space-y-4">
            {messages.map((message) => (
          <div key={message.id}>
            {message.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] sm:max-w-xs shadow-md">
                  <p className="text-gray-800 break-words">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[95%] sm:max-w-md shadow-lg">
                  <p className="mb-2">{message.content}</p>
                  
                  {/* Menu Items */}
                  {message.menuItems && message.menuItems.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {message.menuItems.map((item) => (
                        <MenuCard 
                          key={item.id} 
                          item={item} 
                          onAddToCart={(item) => addToCart(item, 1)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm transition-all"
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
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <FilterBar filters={filters} onFilterChange={setFilters} />
            
            {selectedVendorId ? (
              <div className="p-4">
                <button
                  onClick={handleBackToVendors}
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium mb-4 transition-colors"
                >
                  ← Back to Vendors
                </button>
                
                {vendorInfo && (
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">{vendorInfo.name}</h2>
                    <p className="text-gray-600 text-sm mt-1">{vendorInfo.description}</p>
                    {vendorInfo.cuisine && (
                      <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        {vendorInfo.cuisine}
                      </span>
                    )}
                  </div>
                )}
                
                {loadingMenu ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-24"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredMenu().length > 0 ? (
                      getFilteredMenu().map((item) => (
                        <MenuCard 
                          key={item.id} 
                          item={item} 
                          onAddToCart={(item) => addToCart(item, 1)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-4xl mb-2">🔍</p>
                        <p>No items match your filters</p>
                        <button
                          onClick={() => setFilters({ search: '', cuisine: '', dietary: [], excludeAllergens: [] })}
                          className="mt-2 text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <VendorGallery 
                onSelectVendor={handleSelectVendor} 
                activeFilters={filters}
              />
            )}
          </div>
        )}
      </div>

      {/* Input Bar — fixed at bottom with safe area for notched phones */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg safe-x safe-bottom">
          <form onSubmit={handleSend} className="flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 min-w-0 px-4 py-3 sm:py-3 border border-gray-300 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="touch-target flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 sm:px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <Cart 
          onClose={() => setShowCart(false)} 
          onOrderComplete={onOrderComplete}
        />
      )}
    </div>
  );
}

export default ChatInterface;
