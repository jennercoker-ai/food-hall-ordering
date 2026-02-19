import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Group Order Store - Manages family/group ordering sessions
 * 
 * Features:
 * - Lead Guest (Host) designation
 * - Multiple guest management
 * - Cart items grouped by guest
 * - Cart locking by host
 * - Combined payment handling
 */

const generateGroupId = () => `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useGroupOrder = create(
  persist(
    (set, get) => ({
      // Group session state
      groupId: null,
      groupName: '',
      isGroupMode: false,
      isHost: false,
      hostId: null,
      
      // Current user
      currentGuest: null,
      
      // All guests in the group
      guests: [],
      
      // Cart state
      cartItems: [], // { id, guestId, guestName, item, quantity, addedAt }
      isCartLocked: false,
      lockedAt: null,
      lockedBy: null,
      
      // Initialize a new group session (called by host)
      createGroupSession: (hostName, groupName = 'Family Order') => {
        const groupId = generateGroupId();
        const hostId = `guest-${Date.now()}`;
        const host = {
          id: hostId,
          name: hostName,
          isHost: true,
          joinedAt: new Date().toISOString(),
          color: getGuestColor(0)
        };
        
        set({
          groupId,
          groupName,
          isGroupMode: true,
          isHost: true,
          hostId,
          currentGuest: host,
          guests: [host],
          cartItems: [],
          isCartLocked: false,
          lockedAt: null,
          lockedBy: null
        });
        
        return { groupId, hostId };
      },
      
      // Join existing group session
      joinGroupSession: (groupId, guestName) => {
        const { guests, hostId } = get();
        const guestId = `guest-${Date.now()}`;
        const newGuest = {
          id: guestId,
          name: guestName,
          isHost: false,
          joinedAt: new Date().toISOString(),
          color: getGuestColor(guests.length)
        };
        
        set({
          groupId,
          isGroupMode: true,
          isHost: false,
          currentGuest: newGuest,
          guests: [...guests, newGuest]
        });
        
        return { guestId };
      },
      
      // Add a guest (host only in single-device mode)
      addGuest: (guestName) => {
        const { guests, isHost } = get();
        if (!isHost) return null;
        
        const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newGuest = {
          id: guestId,
          name: guestName,
          isHost: false,
          joinedAt: new Date().toISOString(),
          color: getGuestColor(guests.length)
        };
        
        set({ guests: [...guests, newGuest] });
        return newGuest;
      },
      
      // Remove a guest (host only)
      removeGuest: (guestId) => {
        const { guests, cartItems, isHost, hostId } = get();
        if (!isHost || guestId === hostId) return false;
        
        set({
          guests: guests.filter(g => g.id !== guestId),
          cartItems: cartItems.filter(item => item.guestId !== guestId)
        });
        return true;
      },
      
      // Switch active guest (for single-device family ordering)
      switchGuest: (guestId) => {
        const { guests } = get();
        const guest = guests.find(g => g.id === guestId);
        if (guest) {
          set({ currentGuest: guest });
        }
      },
      
      // Add item to cart for current guest
      addToCart: (item, quantity = 1) => {
        const { cartItems, currentGuest, isCartLocked } = get();
        if (!currentGuest || isCartLocked) return false;
        
        const existingIndex = cartItems.findIndex(
          ci => ci.item.id === item.id && ci.guestId === currentGuest.id
        );
        
        if (existingIndex >= 0) {
          const updated = [...cartItems];
          updated[existingIndex].quantity += quantity;
          set({ cartItems: updated });
        } else {
          const newItem = {
            id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            guestId: currentGuest.id,
            guestName: currentGuest.name,
            guestColor: currentGuest.color,
            item,
            quantity,
            addedAt: new Date().toISOString()
          };
          set({ cartItems: [...cartItems, newItem] });
        }
        return true;
      },
      
      // Update item quantity
      updateQuantity: (cartItemId, quantity) => {
        const { cartItems, isCartLocked, currentGuest, isHost } = get();
        if (isCartLocked && !isHost) return false;
        
        const item = cartItems.find(ci => ci.id === cartItemId);
        if (!item) return false;
        
        // Non-hosts can only edit their own items
        if (!isHost && item.guestId !== currentGuest?.id) return false;
        
        if (quantity <= 0) {
          set({ cartItems: cartItems.filter(ci => ci.id !== cartItemId) });
        } else {
          set({
            cartItems: cartItems.map(ci =>
              ci.id === cartItemId ? { ...ci, quantity } : ci
            )
          });
        }
        return true;
      },
      
      // Remove item from cart
      removeFromCart: (cartItemId) => {
        const { cartItems, isCartLocked, currentGuest, isHost } = get();
        if (isCartLocked && !isHost) return false;
        
        const item = cartItems.find(ci => ci.id === cartItemId);
        if (!item) return false;
        
        // Non-hosts can only remove their own items
        if (!isHost && item.guestId !== currentGuest?.id) return false;
        
        set({ cartItems: cartItems.filter(ci => ci.id !== cartItemId) });
        return true;
      },
      
      // Lock cart (host only) - prevents further additions
      lockCart: () => {
        const { isHost, currentGuest } = get();
        if (!isHost) return false;
        
        set({
          isCartLocked: true,
          lockedAt: new Date().toISOString(),
          lockedBy: currentGuest?.name
        });
        return true;
      },
      
      // Unlock cart (host only)
      unlockCart: () => {
        const { isHost } = get();
        if (!isHost) return false;
        
        set({
          isCartLocked: false,
          lockedAt: null,
          lockedBy: null
        });
        return true;
      },
      
      // Get cart grouped by guest
      getCartByGuest: () => {
        const { cartItems, guests } = get();
        const grouped = {};
        
        guests.forEach(guest => {
          grouped[guest.id] = {
            guest,
            items: cartItems.filter(ci => ci.guestId === guest.id),
            subtotal: cartItems
              .filter(ci => ci.guestId === guest.id)
              .reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0)
          };
        });
        
        return grouped;
      },
      
      // Get total for entire group
      getGroupTotal: () => {
        const { cartItems } = get();
        return cartItems.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
      },
      
      // Get item count
      getItemCount: () => {
        const { cartItems } = get();
        return cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
      },
      
      // Clear cart
      clearCart: () => {
        set({ cartItems: [], isCartLocked: false, lockedAt: null, lockedBy: null });
      },
      
      // End group session
      endGroupSession: () => {
        set({
          groupId: null,
          groupName: '',
          isGroupMode: false,
          isHost: false,
          hostId: null,
          currentGuest: null,
          guests: [],
          cartItems: [],
          isCartLocked: false,
          lockedAt: null,
          lockedBy: null
        });
      },
      
      // Prepare order data for submission
      prepareOrderData: () => {
        const { groupId, groupName, cartItems, guests, getGroupTotal } = get();
        
        return {
          groupId,
          groupName,
          totalAmount: getGroupTotal(),
          guestCount: guests.length,
          items: cartItems.map(ci => ({
            ...ci.item,
            quantity: ci.quantity,
            guestName: ci.guestName,
            guestId: ci.guestId
          })),
          guests: guests.map(g => ({
            id: g.id,
            name: g.name,
            isHost: g.isHost,
            itemCount: cartItems.filter(ci => ci.guestId === g.id).reduce((s, ci) => s + ci.quantity, 0),
            subtotal: cartItems.filter(ci => ci.guestId === g.id).reduce((s, ci) => s + ci.item.price * ci.quantity, 0)
          }))
        };
      }
    }),
    {
      name: 'group-order-storage',
      partialize: (state) => ({
        groupId: state.groupId,
        groupName: state.groupName,
        isGroupMode: state.isGroupMode,
        isHost: state.isHost,
        hostId: state.hostId,
        currentGuest: state.currentGuest,
        guests: state.guests,
        cartItems: state.cartItems,
        isCartLocked: state.isCartLocked
      })
    }
  )
);

// Guest color palette
const GUEST_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', accent: '#3B82F6' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', accent: '#EC4899' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', accent: '#22C55E' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', accent: '#A855F7' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', accent: '#F97316' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', accent: '#14B8A6' },
  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', accent: '#EF4444' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', accent: '#6366F1' },
];

function getGuestColor(index) {
  return GUEST_COLORS[index % GUEST_COLORS.length];
}

export default useGroupOrder;
