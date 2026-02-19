export type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
export type ItemStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'COLLECTED';
export type OrderType = 'DINE_IN' | 'COLLECTION' | 'DELIVERY';

export interface Vendor {
  id: string;
  name: string;
  cuisine: string;
  imageUrl?: string | null;
  collectionPoint?: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string | null;
  allergens: string[];
  dietary: string[];
  isVegan: boolean;
  available: boolean;
  vendorId: string;
  vendor?: Vendor;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  vendorId: string;
  quantity: number;
  price: number;
  guestName?: string | null;
  status: ItemStatus;
  menuItem?: MenuItem;
  vendor?: Vendor;
  order?: Partial<Order>;
}

export interface Order {
  id: string;
  orderNumber?: number | null;
  orderType: OrderType;
  status: OrderStatus;
  totalAmount: number;
  groupId?: string | null;
  tableNumber?: string | null;
  deliveryAddress?: string | null;
  deliveryFee: number;
  customerPhone?: string | null;
  customerName?: string | null;
  specialInstructions?: string | null;
  vendorId?: string | null;
  vendor?: Vendor | null;
  items: OrderItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Cart types ───────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  category: string;
  guestName?: string;
}

// ─── Group Session types ──────────────────────────────────────────────────────
export interface Guest {
  id: string;
  name: string;
  isHost: boolean;
  color: { bg: string; text: string; border: string };
}

export interface GroupSession {
  groupId: string;
  groupName: string;
  guests: Guest[];
  cart: CartItem[];
  isCartLocked: boolean;
  lockedBy?: string;
}

// ─── SSE event shapes ─────────────────────────────────────────────────────────
export interface SSEItemUpdate {
  type: 'ITEM_UPDATE' | 'ORDER_UPDATE' | 'GROUP_UPDATE' | 'CONNECTED' | 'HEARTBEAT';
  orderId?: string;
  orderItemId?: string;
  itemStatus?: ItemStatus;
  orderStatus?: OrderStatus;
  itemName?: string;
  vendorName?: string;
  station?: string | null;
  readyCount?: number;
  totalItems?: number;
  allReady?: boolean;
  progress?: number;
  orders?: Partial<Order>[];
}

// ─── Concierge types ──────────────────────────────────────────────────────────
export interface ConciergeResponse {
  text: string;
  menuItems: MenuItem[];
  suggestions: string[];
  upsells: MenuItem[];
  isGroupContext: boolean;
  dietaryFiltersApplied: string[];
  allergenFiltersApplied: string[];
}
