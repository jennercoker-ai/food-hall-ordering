import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import Cart from './Cart';
import MenuCard from './MenuCard';
import VendorGallery from './VendorGallery';
import FilterBar from './FilterBar';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {vendor?.name?.charAt(0) || '🍕'}
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">{vendor?.name || 'Event Food Ordering'}</h1>
              <p className="text-sm text-gray-600">{vendor?.description || 'Browse menus from all vendors'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            🛒 Cart
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'chat'
                ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'browse'
                ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Browse Vendors
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'chat' ? (
          <div className="space-y-4">
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
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-md shadow-lg">
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

      {/* Input Bar - Only show for chat tab */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
