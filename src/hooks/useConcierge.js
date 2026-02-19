import { useState, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * useConcierge - React hook for the Food Hall Concierge chatbot
 * 
 * Features:
 * - Manages conversation history
 * - Handles dietary/allergen filtering
 * - Supports group session context
 * - Tracks selected items for upselling
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Current session ID
 * @param {string} options.groupId - Group/collaborative session ID (optional)
 * @param {Function} options.onAddToCart - Callback when user wants to add item to cart
 */
export function useConcierge({ sessionId, groupId, onAddToCart } = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [allergenFilters, setAllergenFilters] = useState([]);
  const selectedItemsRef = useRef([]);

  const addMessage = useCallback((message) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...message
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return null;
    
    setError(null);
    setIsLoading(true);

    const userMessage = addMessage({
      role: 'user',
      content: text
    });

    try {
      const response = await fetch(`${API_URL}/api/concierge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          groupId,
          previousSelections: selectedItemsRef.current
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from concierge');
      }

      const data = await response.json();

      if (data.dietaryFiltersApplied?.length > 0) {
        setDietaryFilters(prev => [...new Set([...prev, ...data.dietaryFiltersApplied])]);
      }
      if (data.allergenFiltersApplied?.length > 0) {
        setAllergenFilters(prev => [...new Set([...prev, ...data.allergenFiltersApplied])]);
      }

      const assistantMessage = addMessage({
        role: 'assistant',
        content: data.text,
        menuItems: data.menuItems || [],
        upsells: data.upsells || [],
        suggestions: data.suggestions || [],
        isGroupContext: data.isGroupContext,
        dietaryFilters: data.dietaryFiltersApplied,
        allergenFilters: data.allergenFiltersApplied
      });

      setIsLoading(false);
      return assistantMessage;
    } catch (err) {
      console.error('Concierge error:', err);
      setError(err.message);
      
      addMessage({
        role: 'assistant',
        content: "I apologise, but I'm having trouble connecting. Please try again in a moment.",
        suggestions: ['Try again', 'Show menu']
      });
      
      setIsLoading(false);
      return null;
    }
  }, [sessionId, groupId, addMessage]);

  const selectItem = useCallback((item) => {
    selectedItemsRef.current = [...selectedItemsRef.current, item];
    
    if (onAddToCart) {
      onAddToCart(item);
    }
    
    return sendMessage(`I'd like the ${item.name}`);
  }, [sendMessage, onAddToCart]);

  const startConversation = useCallback(() => {
    if (messages.length === 0) {
      return sendMessage('Hello');
    }
    return Promise.resolve(null);
  }, [messages.length, sendMessage]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setDietaryFilters([]);
    setAllergenFilters([]);
    selectedItemsRef.current = [];
    setError(null);
  }, []);

  const applyDietaryFilter = useCallback((filter) => {
    const filterMessage = filter === 'vegan' ? "I'm looking for vegan options" :
                         filter === 'vegetarian' ? "Show me vegetarian dishes" :
                         filter === 'gluten-free' ? "I need gluten-free options" :
                         `I need ${filter} options`;
    return sendMessage(filterMessage);
  }, [sendMessage]);

  const askForGroupSuggestions = useCallback(() => {
    return sendMessage("We're ordering as a group, what do you recommend for sharing?");
  }, [sendMessage]);

  const getPopularItems = useCallback(() => {
    return sendMessage("What are your most popular dishes?");
  }, [sendMessage]);

  const browseVendor = useCallback((vendorName) => {
    return sendMessage(`Show me what ${vendorName} has`);
  }, [sendMessage]);

  const browseCategory = useCallback((category) => {
    return sendMessage(`Show me ${category} options`);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    dietaryFilters,
    allergenFilters,
    
    sendMessage,
    selectItem,
    startConversation,
    clearConversation,
    
    applyDietaryFilter,
    askForGroupSuggestions,
    getPopularItems,
    browseVendor,
    browseCategory,
    
    isGroupSession: !!groupId,
    selectedItems: selectedItemsRef.current
  };
}

export default useConcierge;
