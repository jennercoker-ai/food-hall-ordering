import React, { useState } from 'react';
import { useGroupOrder } from '../hooks/useGroupOrder';

function GuestSelector({ onStartGroup }) {
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [setupHostName, setSetupHostName] = useState('');
  const [setupGroupName, setSetupGroupName] = useState('Family Order');
  
  const {
    isGroupMode,
    guests,
    currentGuest,
    isHost,
    isCartLocked,
    switchGuest,
    addGuest,
    removeGuest,
    createGroupSession,
    endGroupSession,
    getItemCount
  } = useGroupOrder();

  const handleCreateGroup = () => {
    if (!setupHostName.trim()) return;
    createGroupSession(setupHostName.trim(), setupGroupName.trim() || 'Family Order');
    setShowSetup(false);
    setSetupHostName('');
    if (onStartGroup) onStartGroup();
  };

  const handleAddGuest = () => {
    if (!newGuestName.trim()) return;
    addGuest(newGuestName.trim());
    setNewGuestName('');
    setShowAddGuest(false);
  };

  const itemCount = getItemCount();

  // Not in group mode - show start button
  if (!isGroupMode) {
    return (
      <>
        <button
          onClick={() => setShowSetup(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <span>👨‍👩‍👧‍👦</span>
          <span>Family Order</span>
        </button>

        {/* Setup Modal */}
        {showSetup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Start Family Order</h3>
              <p className="text-gray-500 text-sm mb-4">
                Set up a shared cart for your family. You'll be the host who controls payment.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (Host)</label>
                  <input
                    type="text"
                    value={setupHostName}
                    onChange={(e) => setSetupHostName(e.target.value)}
                    placeholder="e.g., Dad, Mum, Alex"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name (Optional)</label>
                  <input
                    type="text"
                    value={setupGroupName}
                    onChange={(e) => setSetupGroupName(e.target.value)}
                    placeholder="Family Order"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-purple-700 text-sm flex items-start gap-2">
                    <span>👑</span>
                    <span>As host, you can add family members, lock the cart when everyone's done, and complete the payment.</span>
                  </p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowSetup(false)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={!setupHostName.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // In group mode - show guest selector bar
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Guest Pills */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Ordering as:</span>
          
          {guests.map(guest => (
            <button
              key={guest.id}
              onClick={() => switchGuest(guest.id)}
              disabled={isCartLocked && !isHost}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                currentGuest?.id === guest.id
                  ? `${guest.color.bg} ${guest.color.text} ${guest.color.border} border-2 shadow-sm`
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              } ${isCartLocked && !isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full ${guest.color.bg} ${guest.color.text} flex items-center justify-center text-xs font-bold`}>
                {guest.name.charAt(0).toUpperCase()}
              </span>
              <span>{guest.name}</span>
              {guest.isHost && <span className="text-xs">👑</span>}
            </button>
          ))}
          
          {/* Add Guest Button */}
          {isHost && !isCartLocked && (
            <button
              onClick={() => setShowAddGuest(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 whitespace-nowrap border-2 border-dashed border-gray-300"
            >
              <span>+</span>
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      {isCartLocked && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center justify-between">
          <span className="text-green-700 text-sm flex items-center gap-2">
            <span>🔒</span>
            <span>Cart locked — {isHost ? 'Ready to pay!' : `Waiting for ${guests.find(g => g.isHost)?.name}`}</span>
          </span>
          {isHost && (
            <span className="text-green-600 text-xs font-medium">{itemCount} items</span>
          )}
        </div>
      )}
      
      {/* Current Guest Indicator */}
      {currentGuest && !isCartLocked && (
        <div className={`px-4 py-2 ${currentGuest.color.bg} border-t ${currentGuest.color.border} flex items-center justify-between`}>
          <span className={`${currentGuest.color.text} text-sm`}>
            Adding items for <strong>{currentGuest.name}</strong>
          </span>
          {isHost && guests.length > 1 && currentGuest && !currentGuest.isHost && (
            <button
              onClick={() => removeGuest(currentGuest.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Add Guest Modal */}
      {showAddGuest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add Family Member</h3>
            
            <input
              type="text"
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="Name (e.g., Mum, Jake, Sophie)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleAddGuest()}
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddGuest(false);
                  setNewGuestName('');
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGuest}
                disabled={!newGuestName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestSelector;
