import { create } from 'zustand';

// In production build set VITE_API_URL="" so API is same-origin
const API_URL = import.meta.env.VITE_API_URL || '';

export const useStore = create((set, get) => ({
  // Session state
  session: null,
  vendor: null,
  
  // Cart state
  cart: [],
  
  // Chat state
  messages: [],
  
  // Loading states
  loading: false,
  
  // Initialize session
  initializeSession: async (vendorId, locationContext) => {
    try {
      const response = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, locationContext })
      });
      const session = await response.json();
      
      // Get vendor info if vendorId provided
      let vendor = null;
      if (vendorId) {
        try {
          const vendorResponse = await fetch(`${API_URL}/api/vendors/${vendorId}`);
          vendor = await vendorResponse.json();
        } catch (error) {
          console.error('Failed to fetch vendor:', error);
        }
      }
      
      set({ session, vendor });
      return session;
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  },
  
  // Add item to cart
  addToCart: (item, quantity = 1) => {
    const { cart, session } = get();
    const existingIndex = cart.findIndex(i => i.id === item.id);
    
    let newCart;
    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart = [...cart, { ...item, quantity }];
    }
    
    set({ cart: newCart });
    
    // Sync with backend
    if (session) {
      fetch(`${API_URL}/api/session/${session.id}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: newCart })
      });
    }
  },
  
  // Remove item from cart
  removeFromCart: (itemId) => {
    const { cart, session } = get();
    const newCart = cart.filter(item => item.id !== itemId);
    set({ cart: newCart });
    
    // Sync with backend
    if (session) {
      fetch(`${API_URL}/api/session/${session.id}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: newCart })
      });
    }
  },
  
  // Update item quantity
  updateQuantity: (itemId, quantity) => {
    const { cart, session } = get();
    const newCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    set({ cart: newCart });
    
    // Sync with backend
    if (session) {
      fetch(`${API_URL}/api/session/${session.id}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: newCart })
      });
    }
  },
  
  // Clear cart
  clearCart: () => {
    set({ cart: [] });
  },
  
  // Add message to chat
  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },
  
  // Send chat message to backend
  sendMessage: async (text) => {
    const { session, vendor, addMessage } = get();
    
    // Add user message
    addMessage({
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });
    
    set({ loading: true });
    
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: session?.id,
          vendorId: vendor?.id || null // Allow null for all-vendor search
        })
      });
      
      const data = await response.json();
      
      // Add bot response
      addMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: data.text,
        menuItems: data.menuItems || [],
        suggestions: data.suggestions || [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        timestamp: new Date().toISOString()
      });
    } finally {
      set({ loading: false });
    }
  },
  
  // Create order
  createOrder: async (customerPhone, specialInstructions, destination, guestName, orderType, tableNumber, deliveryFee) => {
    const { session, cart } = get();
    
    if (!session || cart.length === 0) {
      throw new Error('Invalid order');
    }
    
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          items: cart,
          customerPhone,
          specialInstructions,
          destination: destination || undefined,
          guestName: guestName || undefined,
          orderType: orderType || 'DINE_IN',
          tableNumber: tableNumber || undefined,
          deliveryFee: deliveryFee || 0
        })
      });
      
      const result = await response.json();
      set({ cart: [] }); // Clear cart
      
      // Multi-vendor: return delivery ticket info
      if (result.orders && result.orders.length > 0) {
        if (result.deliveryId) {
          return { id: result.orders[0].id, deliveryId: result.deliveryId };
        }
        return result.orders[0];
      }
      
      return result;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  },
  
  // Get cart total
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
