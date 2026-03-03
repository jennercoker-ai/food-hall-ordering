import React, { useState, useEffect } from 'react';
import { useGroupOrder } from '../hooks/useGroupOrder';
import GuestSelector from './GuestSelector';
import GroupCart from './GroupCart';
import VendorGallery from './VendorGallery';
import FilterBar from './FilterBar';
import MenuCard from './MenuCard';

const API_URL = import.meta.env.VITE_API_URL || '';

function GroupOrderInterface({ onOrderComplete }) {
  const [showCart, setShowCart] = useState(false);
  const [filters, setFilters] = useState({ search: '', cuisine: '', dietary: [], excludeAllergens: [] });
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [vendorMenu, setVendorMenu] = useState([]);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  
  const {
    isGroupMode,
    groupName,
    currentGuest,
    isHost,
    isCartLocked,
    guests,
    addToCart,
    getItemCount,
    getGroupTotal,
    endGroupSession
  } = useGroupOrder();

  const itemCount = getItemCount();
  const totalAmount = getGroupTotal();

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

  const handleAddToCart = (item) => {
    if (isCartLocked && !isHost) {
      return;
    }
    addToCart(item, 1);
  };

  const handleCheckout = async (orderData) => {
    const body = {
      items: orderData.items,
      groupId: orderData.groupId || null,
      orderType: orderData.orderType || 'DINE_IN',
      tableNumber: orderData.tableNumber,
      deliveryAddress: orderData.deliveryAddress,
      deliveryFee: orderData.deliveryFee || 0,
      guestName: orderData.guests?.[0]?.name || orderData.groupName || 'Group',
      customerPhone: orderData.customerPhone || null,
      specialInstructions: orderData.specialInstructions || null
    };
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Order failed (${res.status})`);
    }
    const result = await res.json();
    if (onOrderComplete) {
      onOrderComplete(result);
    }
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl">
              🍽️
            </div>
            <div>
              <h1 className="font-bold text-gray-800">
                {isGroupMode ? groupName : 'Food Hall'}
              </h1>
              {isGroupMode && (
                <p className="text-xs text-gray-500">
                  {guests.length} people · {itemCount} items
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isGroupMode && <GuestSelector />}
            
            {isGroupMode && (
              <button
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <span>🛒</span>
                <span>£{totalAmount.toFixed(2)}</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
                {isCartLocked && (
                  <span className="absolute -bottom-1 -right-1 text-sm">🔒</span>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Guest Selector Bar - Only in group mode */}
        {isGroupMode && <GuestSelector />}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {!isGroupMode ? (
          // Not in group mode - show welcome / setup
          <div className="p-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
                <h2 className="text-2xl font-bold mb-2">👨‍👩‍👧‍👦 Family Ordering</h2>
                <p className="text-purple-100">
                  Order together, pay once. Everyone picks what they want!
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">1️⃣</div>
                    <h3 className="font-semibold text-gray-800">Add Family</h3>
                    <p className="text-sm text-gray-500">Add names for each person ordering</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">2️⃣</div>
                    <h3 className="font-semibold text-gray-800">Everyone Picks</h3>
                    <p className="text-sm text-gray-500">Switch between people to add their items</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">3️⃣</div>
                    <h3 className="font-semibold text-gray-800">Host Pays</h3>
                    <p className="text-sm text-gray-500">Lock cart & pay for everyone at once</p>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <GuestSelector />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // In group mode - show vendor browser
          <div className="bg-white min-h-full">
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
                  </div>
                )}
                
                {/* Cart Locked Warning for non-hosts */}
                {isCartLocked && !isHost && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm flex items-center gap-2">
                    <span>🔒</span>
                    <span>Cart is locked. Only the host can make changes.</span>
                  </div>
                )}
                
                {/* Currently ordering for indicator */}
                {currentGuest && !isCartLocked && (
                  <div className={`mb-4 p-3 ${currentGuest.color.bg} ${currentGuest.color.border} border rounded-xl flex items-center justify-between`}>
                    <span className={`${currentGuest.color.text} text-sm font-medium`}>
                      Adding items for: <strong>{currentGuest.name}</strong>
                    </span>
                    <span className={`${currentGuest.color.text} text-xs`}>
                      Tap a guest above to switch
                    </span>
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
                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.dietary?.includes('vegan') && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">🌱 Vegan</span>
                              )}
                              {item.dietary?.includes('vegetarian') && !item.dietary?.includes('vegan') && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">🥬 Vegetarian</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-purple-600 text-lg">£{item.price.toFixed(2)}</p>
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={isCartLocked && !isHost}
                              className={`mt-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                isCartLocked && !isHost
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : `${currentGuest?.color.bg || 'bg-purple-100'} ${currentGuest?.color.text || 'text-purple-700'} hover:shadow-md`
                              }`}
                            >
                              {isCartLocked && !isHost ? '🔒 Locked' : `+ Add for ${currentGuest?.name || 'Guest'}`}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No items match your filters</p>
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

      {/* Group Cart Modal */}
      {showCart && (
        <GroupCart 
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}

export default GroupOrderInterface;
