'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { CartItem, Guest, OrderType } from '@/lib/types';

const GUEST_COLORS = [
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
];

interface GroupSessionState {
  // Session identity
  groupId: string | null;
  groupName: string;
  sessionId: string | null; // current user's guest id
  guests: Guest[];

  // Cart
  cart: CartItem[];
  isCartLocked: boolean;
  lockedBy: string | null;

  // Order meta (set at checkout)
  orderType: OrderType;
  tableNumber: string;
  deliveryAddress: string;
  phone: string;
  specialInstructions: string;

  // Computed helpers
  isHost: () => boolean;
  currentGuest: () => Guest | null;
  getGroupTotal: () => number;
  getItemCount: () => number;
  getCartByGuest: () => Record<string, { guest: Guest; items: CartItem[]; subtotal: number }>;

  // Actions
  initGroup: (groupName: string, hostName: string) => void;
  joinGroup: (groupId: string, groupName: string, guestName: string) => void;
  addGuest: (name: string) => void;
  addToCart: (item: CartItem) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  lockCart: () => void;
  unlockCart: () => void;
  clearGroup: () => void;
  setOrderMeta: (meta: { orderType?: OrderType; tableNumber?: string; deliveryAddress?: string; phone?: string; specialInstructions?: string }) => void;
  prepareOrderPayload: () => object;
}

export const useGroupSession = create<GroupSessionState>()(
  persist(
    (set, get) => ({
      groupId: null,
      groupName: 'Our Group',
      sessionId: null,
      guests: [],
      cart: [],
      isCartLocked: false,
      lockedBy: null,
      orderType: 'DINE_IN',
      tableNumber: '',
      deliveryAddress: '',
      phone: '',
      specialInstructions: '',

      isHost: () => {
        const { sessionId, guests } = get();
        return guests.find((g) => g.id === sessionId)?.isHost ?? false;
      },

      currentGuest: () => {
        const { sessionId, guests } = get();
        return guests.find((g) => g.id === sessionId) ?? null;
      },

      getGroupTotal: () =>
        get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().cart.reduce((sum, i) => sum + i.quantity, 0),

      getCartByGuest: () => {
        const { cart, guests } = get();
        const map: Record<string, { guest: Guest; items: CartItem[]; subtotal: number }> = {};
        for (const g of guests) {
          const items = cart.filter((c) => c.guestName === g.name);
          map[g.id] = {
            guest: g,
            items,
            subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
          };
        }
        return map;
      },

      initGroup: (groupName, hostName) => {
        const groupId = uuid();
        const guestId = uuid();
        const host: Guest = {
          id: guestId,
          name: hostName,
          isHost: true,
          color: GUEST_COLORS[0],
        };
        set({ groupId, groupName, sessionId: guestId, guests: [host], cart: [], isCartLocked: false });
      },

      joinGroup: (groupId, groupName, guestName) => {
        const guestId = uuid();
        const existingGuests = get().guests;
        const colorIdx = existingGuests.length % GUEST_COLORS.length;
        const newGuest: Guest = {
          id: guestId,
          name: guestName,
          isHost: false,
          color: GUEST_COLORS[colorIdx],
        };
        set((s) => ({
          groupId,
          groupName,
          sessionId: guestId,
          guests: [...s.guests, newGuest],
        }));
      },

      addGuest: (name) => {
        const guestId = uuid();
        const existingGuests = get().guests;
        const colorIdx = existingGuests.length % GUEST_COLORS.length;
        const newGuest: Guest = {
          id: guestId,
          name,
          isHost: false,
          color: GUEST_COLORS[colorIdx],
        };
        set((s) => ({ guests: [...s.guests, newGuest] }));
      },

      addToCart: (item) => {
        const { cart, currentGuest } = get();
        const guest = currentGuest();
        const enriched: CartItem = {
          ...item,
          id: uuid(),
          guestName: guest?.name ?? 'Guest',
        };
        const existing = cart.findIndex(
          (c) => c.menuItemId === item.menuItemId && c.guestName === enriched.guestName,
        );
        if (existing >= 0) {
          const updated = [...cart];
          updated[existing].quantity += item.quantity;
          set({ cart: updated });
        } else {
          set({ cart: [...cart, enriched] });
        }
      },

      updateQuantity: (cartItemId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        set((s) => ({
          cart: s.cart.map((c) => (c.id === cartItemId ? { ...c, quantity: qty } : c)),
        }));
      },

      removeFromCart: (cartItemId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.id !== cartItemId) })),

      lockCart: () => {
        const guest = get().currentGuest();
        set({ isCartLocked: true, lockedBy: guest?.name ?? 'Host' });
      },

      unlockCart: () => set({ isCartLocked: false, lockedBy: null }),

      clearGroup: () =>
        set({
          groupId: null,
          groupName: 'Our Group',
          sessionId: null,
          guests: [],
          cart: [],
          isCartLocked: false,
          lockedBy: null,
        }),

      setOrderMeta: (meta) => set((s) => ({ ...s, ...meta })),

      prepareOrderPayload: () => {
        const { groupId, cart, guests, orderType, tableNumber, deliveryAddress, phone, specialInstructions } = get();
        return {
          groupId,
          items: cart,
          guests: guests.map((g) => ({ id: g.id, name: g.name, isHost: g.isHost })),
          orderType,
          tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
          deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
          customerPhone: phone,
          specialInstructions,
          deliveryFee: orderType === 'DELIVERY' ? 2.5 : 0,
        };
      },
    }),
    {
      name: 'food-hall-group-session',
      partialize: (s) => ({
        groupId: s.groupId,
        groupName: s.groupName,
        sessionId: s.sessionId,
        guests: s.guests,
        cart: s.cart,
        isCartLocked: s.isCartLocked,
        lockedBy: s.lockedBy,
        phone: s.phone,
      }),
    },
  ),
);
