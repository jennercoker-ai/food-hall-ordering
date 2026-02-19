import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Hook for live order updates via Server-Sent Events
 * @param {string} orderId - The order ID to track
 * @returns {object} - { order, status, isConnected, error, reconnect }
 */
export function useOrderUpdates(orderId) {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!orderId) return;
    
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setStatus('connecting');
    setError(null);
    
    const eventSource = new EventSource(`${API_URL}/api/orders/${orderId}/live`);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setStatus('connected');
      console.log(`SSE connected for order ${orderId}`);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ORDER_STATE' && data.order) {
          setOrder(data.order);
          setStatus(data.order.status);
        } else if (data.type === 'ORDER_STATUS') {
          setOrder(data.order);
          setStatus(data.status);
        } else if (data.status === 'LISTENING') {
          setStatus(data.currentStatus || 'listening');
        }
      } catch (e) {
        console.error('Error parsing SSE message:', e);
      }
    };
    
    eventSource.onerror = (e) => {
      console.error('SSE error:', e);
      setIsConnected(false);
      setError('Connection lost');
      setStatus('disconnected');
      
      // Auto-reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [orderId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    order,
    status,
    isConnected,
    error,
    reconnect: connect,
    disconnect
  };
}

/**
 * Hook for live customer order updates via Server-Sent Events
 * @param {string} phone - Customer phone number
 * @returns {object} - { orders, isConnected, error, reconnect }
 */
export function useCustomerOrderUpdates(phone) {
  const [orders, setOrders] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!phone) return;
    
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setError(null);
    
    const eventSource = new EventSource(`${API_URL}/api/customer/live?phone=${encodeURIComponent(phone)}`);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setIsConnected(true);
      console.log(`SSE connected for customer ${phone}`);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'CURRENT_ORDERS') {
          setOrders(data.orders);
        } else if (data.type === 'ORDER_STATUS') {
          // Update the specific order in our list
          setOrders(prev => prev.map(o => 
            o.id === data.orderId ? data.order : o
          ));
        }
      } catch (e) {
        console.error('Error parsing SSE message:', e);
      }
    };
    
    eventSource.onerror = (e) => {
      console.error('SSE error:', e);
      setIsConnected(false);
      setError('Connection lost');
      
      // Auto-reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [phone]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    orders,
    isConnected,
    error,
    reconnect: connect,
    disconnect
  };
}

export default useOrderUpdates;
