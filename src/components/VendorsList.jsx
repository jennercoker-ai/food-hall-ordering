import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import MenuCard from './MenuCard';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';

function VendorsList({ onSelectVendor }) {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useStore();

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendors`);
        const data = await response.json();
        setVendors(data.filter(v => v.active));
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const handleVendorClick = async (vendor) => {
    setSelectedVendor(vendor);
    try {
      const response = await fetch(`${API_URL}/api/menu/${vendor.id}`);
      const data = await response.json();
      // Add vendor name to each item
      const itemsWithVendor = data.map(item => ({
        ...item,
        vendorName: vendor.name,
        vendorId: vendor.id
      }));
      setMenuItems(itemsWithVendor);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    }
  };

  const handleBack = () => {
    setSelectedVendor(null);
    setMenuItems([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-xl">Loading vendors...</div>
      </div>
    );
  }

  if (selectedVendor) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors mb-4"
        >
          ← Back to Vendors
        </button>
        
        <div className="bg-white bg-opacity-95 rounded-lg p-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedVendor.name}</h2>
          <p className="text-gray-600">{selectedVendor.description}</p>
        </div>

        <div className="space-y-3">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <MenuCard 
                key={item.id} 
                item={item} 
                onAddToCart={(item) => addToCart(item, 1)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-white">
              <p>No menu items available</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white bg-opacity-95 rounded-lg p-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">All Vendors</h2>
        <p className="text-gray-600">Browse menus from our vendors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            onClick={() => handleVendorClick(vendor)}
            className="bg-white bg-opacity-95 rounded-lg p-4 shadow-md hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {vendor.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">{vendor.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{vendor.description}</p>
              </div>
              <div className="text-purple-600 text-xl">→</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default VendorsList;
