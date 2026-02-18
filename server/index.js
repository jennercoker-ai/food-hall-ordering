const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Prisma client for handoff (persisted orders)
let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('✅ Prisma connected (handoff available at POST /api/handoff)');
} catch (e) {
  console.log('ℹ️  Prisma not available - POST /api/handoff will be disabled');
}

// Initialize Twilio client (optional - works without credentials for development)
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio SMS enabled');
  } else {
    console.log('ℹ️  Twilio not configured - SMS will be logged to console');
  }
} catch (error) {
  console.log('ℹ️  Twilio not available - SMS will be logged to console');
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (replace with actual database in production)
const database = {
  vendors: new Map(),
  menus: new Map(),
  orders: new Map(),
  sessions: new Map()
};

// Initialize sample vendors and menu data
const initializeData = () => {
  // Vendor 1: Pizza Stand
  const vendor1Id = 'vendor-001';
  database.vendors.set(vendor1Id, {
    id: vendor1Id,
    name: 'Tony\'s Pizza',
    description: 'Authentic Italian wood-fired pizzas',
    active: true
  });
  
  database.menus.set(vendor1Id, [
    {
      id: 'item-001',
      vendorId: vendor1Id,
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, basil, and tomato sauce',
      price: 9.99,
      category: 'Pizza',
      allergens: ['dairy', 'gluten'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/margherita.jpg'
    },
    {
      id: 'item-002',
      vendorId: vendor1Id,
      name: 'Pepperoni Pizza',
      description: 'Classic pepperoni with mozzarella',
      price: 11.99,
      category: 'Pizza',
      allergens: ['dairy', 'gluten'],
      dietary: [],
      available: true,
      imageUrl: '/images/pepperoni.jpg'
    },
    {
      id: 'item-003',
      vendorId: vendor1Id,
      name: 'Vegan Garden Pizza',
      description: 'Seasonal vegetables with vegan cheese',
      price: 10.99,
      category: 'Pizza',
      allergens: ['gluten'],
      dietary: ['vegan', 'vegetarian'],
      available: true,
      imageUrl: '/images/vegan-pizza.jpg'
    }
  ]);

  // Vendor 2: Taco Truck
  const vendor2Id = 'vendor-002';
  database.vendors.set(vendor2Id, {
    id: vendor2Id,
    name: 'El Camino Tacos',
    description: 'Fresh Mexican street food',
    active: true
  });
  
  database.menus.set(vendor2Id, [
    {
      id: 'item-004',
      vendorId: vendor2Id,
      name: 'Carne Asada Tacos',
      description: 'Grilled steak with onions and cilantro',
      price: 8.99,
      category: 'Tacos',
      allergens: [],
      dietary: [],
      available: true,
      imageUrl: '/images/carne-asada.jpg'
    },
    {
      id: 'item-005',
      vendorId: vendor2Id,
      name: 'Fish Tacos',
      description: 'Battered fish with cabbage slaw',
      price: 9.99,
      category: 'Tacos',
      allergens: ['fish', 'gluten'],
      dietary: [],
      available: true,
      imageUrl: '/images/fish-tacos.jpg'
    },
    {
      id: 'item-006',
      vendorId: vendor2Id,
      name: 'Black Bean Tacos',
      description: 'Seasoned black beans with avocado',
      price: 7.99,
      category: 'Tacos',
      allergens: [],
      dietary: ['vegan', 'vegetarian'],
      available: true,
      imageUrl: '/images/bean-tacos.jpg'
    }
  ]);

  // Vendor 3: Burger Station
  const vendor3Id = 'vendor-003';
  database.vendors.set(vendor3Id, {
    id: vendor3Id,
    name: 'Burger Boulevard',
    description: 'Gourmet burgers and sides',
    active: true
  });
  
  database.menus.set(vendor3Id, [
    {
      id: 'item-007',
      vendorId: vendor3Id,
      name: 'Classic Cheeseburger',
      description: 'Beef patty with cheddar, lettuce, tomato',
      price: 9.99,
      category: 'Burgers',
      allergens: ['dairy', 'gluten'],
      dietary: [],
      available: true,
      imageUrl: '/images/cheeseburger.jpg'
    },
    {
      id: 'item-008',
      vendorId: vendor3Id,
      name: 'Veggie Burger',
      description: 'House-made veggie patty',
      price: 8.99,
      category: 'Burgers',
      allergens: ['gluten'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/veggie-burger.jpg'
    }
  ]);

  // Vendor 4: Fish & Chips
  const vendor4Id = 'vendor-004';
  database.vendors.set(vendor4Id, {
    id: vendor4Id,
    name: 'The Codfather',
    description: 'Traditional British fish & chips',
    active: true
  });
  
  database.menus.set(vendor4Id, [
    {
      id: 'item-009',
      vendorId: vendor4Id,
      name: 'Classic Fish & Chips',
      description: 'Beer-battered cod with chunky chips',
      price: 10.99,
      category: 'Fish & Chips',
      allergens: ['fish', 'gluten'],
      dietary: [],
      available: true,
      imageUrl: '/images/fish-chips.jpg'
    },
    {
      id: 'item-010',
      vendorId: vendor4Id,
      name: 'Haddock & Chips',
      description: 'Golden haddock with mushy peas',
      price: 11.99,
      category: 'Fish & Chips',
      allergens: ['fish', 'gluten'],
      dietary: [],
      available: true,
      imageUrl: '/images/haddock-chips.jpg'
    },
    {
      id: 'item-011',
      vendorId: vendor4Id,
      name: 'Sausage & Chips',
      description: 'Battered sausage with chips and curry sauce',
      price: 7.99,
      category: 'Fish & Chips',
      allergens: ['gluten'],
      dietary: [],
      available: true,
      imageUrl: '/images/sausage-chips.jpg'
    },
    {
      id: 'item-012',
      vendorId: vendor4Id,
      name: 'Halloumi & Chips',
      description: 'Crispy halloumi with chips and salad',
      price: 8.99,
      category: 'Fish & Chips',
      allergens: ['dairy', 'gluten'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/halloumi-chips.jpg'
    }
  ]);

  // Vendor 5: Indian Curry
  const vendor5Id = 'vendor-005';
  database.vendors.set(vendor5Id, {
    id: vendor5Id,
    name: 'Spice Garden',
    description: 'Authentic Indian curries and naan',
    active: true
  });
  
  database.menus.set(vendor5Id, [
    {
      id: 'item-013',
      vendorId: vendor5Id,
      name: 'Chicken Tikka Masala',
      description: 'Creamy tomato curry with basmati rice',
      price: 12.99,
      category: 'Curry',
      allergens: ['dairy'],
      dietary: [],
      available: true,
      imageUrl: '/images/chicken-tikka.jpg'
    },
    {
      id: 'item-014',
      vendorId: vendor5Id,
      name: 'Lamb Rogan Josh',
      description: 'Aromatic lamb curry with naan bread',
      price: 13.99,
      category: 'Curry',
      allergens: [],
      dietary: [],
      available: true,
      imageUrl: '/images/lamb-rogan.jpg'
    },
    {
      id: 'item-015',
      vendorId: vendor5Id,
      name: 'Vegetable Biryani',
      description: 'Fragrant rice with mixed vegetables',
      price: 10.99,
      category: 'Curry',
      allergens: [],
      dietary: ['vegetarian', 'vegan'],
      available: true,
      imageUrl: '/images/veg-biryani.jpg'
    },
    {
      id: 'item-016',
      vendorId: vendor5Id,
      name: 'Paneer Tikka',
      description: 'Grilled paneer with mint chutney',
      price: 11.99,
      category: 'Curry',
      allergens: ['dairy'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/paneer-tikka.jpg'
    },
    {
      id: 'item-017',
      vendorId: vendor5Id,
      name: 'Garlic Naan',
      description: 'Fresh baked naan with garlic butter',
      price: 3.99,
      category: 'Sides',
      allergens: ['dairy', 'gluten'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/garlic-naan.jpg'
    }
  ]);

  // Vendor 6: Coffee & Pastries
  const vendor6Id = 'vendor-006';
  database.vendors.set(vendor6Id, {
    id: vendor6Id,
    name: 'Brew & Bites',
    description: 'Specialty coffee and fresh pastries',
    active: true
  });
  
  database.menus.set(vendor6Id, [
    {
      id: 'item-018',
      vendorId: vendor6Id,
      name: 'Flat White',
      description: 'Double espresso with steamed milk',
      price: 3.50,
      category: 'Coffee',
      allergens: ['dairy'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/flat-white.jpg'
    },
    {
      id: 'item-019',
      vendorId: vendor6Id,
      name: 'Cappuccino',
      description: 'Espresso with foamed milk',
      price: 3.50,
      category: 'Coffee',
      allergens: ['dairy'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/cappuccino.jpg'
    },
    {
      id: 'item-020',
      vendorId: vendor6Id,
      name: 'Oat Milk Latte',
      description: 'Espresso with oat milk',
      price: 4.00,
      category: 'Coffee',
      allergens: [],
      dietary: ['vegetarian', 'vegan'],
      available: true,
      imageUrl: '/images/oat-latte.jpg'
    },
    {
      id: 'item-021',
      vendorId: vendor6Id,
      name: 'Pain au Chocolat',
      description: 'Buttery croissant with chocolate',
      price: 3.50,
      category: 'Pastries',
      allergens: ['dairy', 'gluten'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/pain-chocolat.jpg'
    },
    {
      id: 'item-022',
      vendorId: vendor6Id,
      name: 'Blueberry Muffin',
      description: 'Fresh baked with blueberries',
      price: 2.99,
      category: 'Pastries',
      allergens: ['dairy', 'gluten', 'eggs'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/blueberry-muffin.jpg'
    },
    {
      id: 'item-023',
      vendorId: vendor6Id,
      name: 'Vegan Brownie',
      description: 'Rich chocolate brownie',
      price: 3.99,
      category: 'Pastries',
      allergens: ['gluten'],
      dietary: ['vegetarian', 'vegan'],
      available: true,
      imageUrl: '/images/vegan-brownie.jpg'
    }
  ]);

  // Vendor 7: BBQ
  const vendor7Id = 'vendor-007';
  database.vendors.set(vendor7Id, {
    id: vendor7Id,
    name: 'Smokehouse Grill',
    description: 'Slow-smoked BBQ meats and sides',
    active: true
  });
  
  database.menus.set(vendor7Id, [
    {
      id: 'item-024',
      vendorId: vendor7Id,
      name: 'Pulled Pork Sandwich',
      description: 'Slow-cooked pork with BBQ sauce',
      price: 10.99,
      category: 'BBQ',
      allergens: ['gluten'],
      dietary: [],
      available: true,
      imageUrl: '/images/pulled-pork.jpg'
    },
    {
      id: 'item-025',
      vendorId: vendor7Id,
      name: 'Beef Brisket',
      description: 'Tender smoked brisket with coleslaw',
      price: 13.99,
      category: 'BBQ',
      allergens: [],
      dietary: [],
      available: true,
      imageUrl: '/images/beef-brisket.jpg'
    },
    {
      id: 'item-026',
      vendorId: vendor7Id,
      name: 'BBQ Chicken Wings',
      description: '6 wings with ranch dip',
      price: 8.99,
      category: 'BBQ',
      allergens: ['dairy'],
      dietary: [],
      available: true,
      imageUrl: '/images/chicken-wings.jpg'
    },
    {
      id: 'item-027',
      vendorId: vendor7Id,
      name: 'Mac & Cheese',
      description: 'Creamy macaroni with cheddar',
      price: 6.99,
      category: 'Sides',
      allergens: ['dairy', 'gluten'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/mac-cheese.jpg'
    },
    {
      id: 'item-028',
      vendorId: vendor7Id,
      name: 'Corn on the Cob',
      description: 'Grilled corn with butter',
      price: 4.99,
      category: 'Sides',
      allergens: ['dairy'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/corn-cob.jpg'
    }
  ]);

  // Vendor 8: Desserts
  const vendor8Id = 'vendor-008';
  database.vendors.set(vendor8Id, {
    id: vendor8Id,
    name: 'Sweet Treats',
    description: 'Artisan ice cream and desserts',
    active: true
  });
  
  database.menus.set(vendor8Id, [
    {
      id: 'item-029',
      vendorId: vendor8Id,
      name: 'Vanilla Ice Cream',
      description: 'Two scoops of premium vanilla',
      price: 4.99,
      category: 'Ice Cream',
      allergens: ['dairy', 'eggs'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/vanilla-ice.jpg'
    },
    {
      id: 'item-030',
      vendorId: vendor8Id,
      name: 'Chocolate Fudge Sundae',
      description: 'Ice cream with hot fudge and whipped cream',
      price: 6.99,
      category: 'Ice Cream',
      allergens: ['dairy', 'eggs'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/chocolate-sundae.jpg'
    },
    {
      id: 'item-031',
      vendorId: vendor8Id,
      name: 'Strawberry Cheesecake',
      description: 'New York style with fresh strawberries',
      price: 5.99,
      category: 'Desserts',
      allergens: ['dairy', 'gluten', 'eggs'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/strawberry-cheesecake.jpg'
    },
    {
      id: 'item-032',
      vendorId: vendor8Id,
      name: 'Vegan Chocolate Cake',
      description: 'Rich chocolate cake slice',
      price: 5.99,
      category: 'Desserts',
      allergens: ['gluten'],
      dietary: ['vegetarian', 'vegan'],
      available: true,
      imageUrl: '/images/vegan-chocolate-cake.jpg'
    },
    {
      id: 'item-033',
      vendorId: vendor8Id,
      name: 'Apple Crumble',
      description: 'Warm apple with cinnamon crumble',
      price: 5.99,
      category: 'Desserts',
      allergens: ['dairy', 'gluten'],
      dietary: ['vegetarian'],
      available: true,
      imageUrl: '/images/apple-crumble.jpg'
    }
  ]);
};

initializeData();

// WebSocket connection handling
const vendorConnections = new Map();
const centralConnections = new Set();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const vendorId = url.searchParams.get('vendorId');
  const board = url.searchParams.get('board');

  if (board === 'central') {
    centralConnections.add(ws);
    console.log('Central order board connected');
    ws.on('close', () => {
      centralConnections.delete(ws);
      console.log('Central order board disconnected');
    });
    return;
  }

  if (vendorId) {
    vendorConnections.set(vendorId, ws);
    console.log(`Vendor ${vendorId} connected to WebSocket`);

    ws.on('close', () => {
      vendorConnections.delete(vendorId);
      console.log(`Vendor ${vendorId} disconnected`);
    });
  }
});

// Utility function to broadcast order to vendor
const notifyVendor = (vendorId, order) => {
  const vendorWs = vendorConnections.get(vendorId);
  if (vendorWs && vendorWs.readyState === WebSocket.OPEN) {
    vendorWs.send(JSON.stringify({
      type: 'NEW_ORDER',
      order
    }));
  }
};

// Utility function to broadcast to central order board
const notifyCentral = (order, eventType) => {
  const payload = JSON.stringify({
    type: eventType,
    order: { ...order, vendorName: database.vendors.get(order.vendorId)?.name }
  });
  centralConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
};

// Utility function to send SMS notifications
const sendSMS = async (phone, message) => {
  if (!phone) {
    console.log('⚠️  No phone number provided for SMS');
    return;
  }

  // Format UK phone numbers (add +44 if needed)
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+44' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+44' + formattedPhone;
  }

  // Log SMS for development/testing
  console.log(`📱 SMS to ${formattedPhone}: ${message}`);

  // Send via Twilio if configured
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({
        body: message,
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
    } catch (error) {
      console.error(`❌ Failed to send SMS to ${formattedPhone}:`, error.message);
    }
  }
};

// Get status-specific SMS message
const getStatusMessage = (order, status) => {
  const vendor = database.vendors.get(order.vendorId);
  const vendorName = vendor?.name || 'Your vendor';
  const orderNumber = order.orderNumber;
  const total = `£${order.total.toFixed(2)}`;

  const messages = {
    pending: `🍕 Order #${orderNumber} received at ${vendorName}! We're processing your order. Total: ${total}. You'll receive updates as we prepare your food.`,
    confirmed: `✅ Order #${orderNumber} confirmed! ${vendorName} has accepted your order and will start preparing it shortly. Total: ${total}.`,
    preparing: `👨‍🍳 Order #${orderNumber} is being prepared! Your food is being freshly made at ${vendorName}. We'll let you know when it's ready!`,
    ready: `🎉 Order #${orderNumber} is ready for collection! Please come to ${vendorName} to pick up your order. Total: ${total}. Cash payment on collection.`,
    completed: `✨ Thank you! Order #${orderNumber} completed. We hope you enjoyed your meal from ${vendorName}!`,
    cancelled: `❌ Order #${orderNumber} has been cancelled. If you have any questions, please contact ${vendorName}.`
  };

  return messages[status] || `Order #${orderNumber} status updated to: ${status}`;
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// QR code for customers (unified chatbot URL) – share or print
app.get('/api/qr', (req, res) => {
  try {
    const QRCode = require('qrcode');
    const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const chatbotUrl = baseUrl.replace(/\/$/, '') + '/';
    QRCode.toBuffer(chatbotUrl, { width: 400, margin: 2, type: 'png' }, (err, buf) => {
      if (err) {
        res.status(500).json({ error: 'Failed to generate QR code' });
        return;
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="order-from-all-vendors.png"');
      res.send(buf);
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'QR failed' });
  }
});

// Get vendor by ID
app.get('/api/vendors/:vendorId', (req, res) => {
  const { vendorId } = req.params;
  const vendor = database.vendors.get(vendorId);
  
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  
  res.json(vendor);
});

// Get all vendors
app.get('/api/vendors', (req, res) => {
  const vendors = Array.from(database.vendors.values());
  res.json(vendors);
});

// Get menu for vendor
app.get('/api/menu/:vendorId', (req, res) => {
  const { vendorId } = req.params;
  const menu = database.menus.get(vendorId);
  
  if (!menu) {
    return res.status(404).json({ error: 'Menu not found' });
  }
  
  res.json(menu);
});

// Search menu items
app.post('/api/menu/search', (req, res) => {
  const { query, vendorId, dietary, allergens } = req.body;
  
  let items = [];
  
  if (vendorId) {
    items = database.menus.get(vendorId) || [];
  } else {
    // Search across all vendors
    database.menus.forEach(menu => {
      items = items.concat(menu);
    });
  }
  
  // Filter by search query
  if (query) {
    const lowerQuery = query.toLowerCase();
    items = items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Filter by dietary preferences
  if (dietary && dietary.length > 0) {
    items = items.filter(item =>
      dietary.some(diet => item.dietary.includes(diet))
    );
  }
  
  // Filter out allergens
  if (allergens && allergens.length > 0) {
    items = items.filter(item =>
      !allergens.some(allergen => item.allergens.includes(allergen))
    );
  }
  
  res.json(items);
});

// Create session
app.post('/api/session/create', (req, res) => {
  const { vendorId, locationContext } = req.body;
  
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    vendorId,
    locationContext,
    createdAt: new Date().toISOString(),
    cart: []
  };
  
  database.sessions.set(sessionId, session);
  
  res.json(session);
});

// Get session
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = database.sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

// Update cart
app.post('/api/session/:sessionId/cart', (req, res) => {
  const { sessionId } = req.params;
  const { cart } = req.body;
  
  const session = database.sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.cart = cart;
  database.sessions.set(sessionId, session);
  
  res.json(session);
});

// Handoff: create order(s) in DB from cart (Prisma) – same logic as app/api/handoff/route.ts
app.post('/api/handoff', async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Handoff requires DATABASE_URL and Prisma' });
  }
  try {
    const {
      cart,
      orderType = 'DINE_IN',
      deliveryAddress,
      guestName: defaultGuestName,
      customerPhone,
      specialInstructions
    } = req.body;

    if (!cart?.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const deliveryFee = orderType === 'DELIVERY' ? 4.99 : 0;
    const byVendor = new Map();
    for (const item of cart) {
      const qty = Math.max(1, item.quantity ?? 1);
      const key = item.vendorId ?? item.vendorName ?? null;
      const entry = byVendor.get(key) ?? [];
      entry.push({ ...item, quantity: qty });
      byVendor.set(key, entry);
    }

    const orders = [];
    let deliveryFeeApplied = false;

    for (const [vendorKey, items] of byVendor.entries()) {
      const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
      const addFee = orderType === 'DELIVERY' && !deliveryFeeApplied;
      if (addFee) deliveryFeeApplied = true;
      const totalAmount = subtotal + (addFee ? deliveryFee : 0);

      let vendorId = null;
      if (vendorKey) {
        const looksLikeCuid = typeof vendorKey === 'string' && vendorKey.length === 25 && !vendorKey.startsWith('vendor-');
        if (looksLikeCuid) {
          vendorId = vendorKey;
        } else {
          const nameToFind = vendorKey.startsWith('vendor-') ? database.vendors.get(vendorKey)?.name : vendorKey;
          if (nameToFind) {
            const vendor = await prisma.vendor.findFirst({ where: { name: nameToFind } });
            vendorId = vendor?.id ?? null;
          }
        }
      }

      const orderNumber = Math.floor(100 + Math.random() * 900);
      const order = await prisma.order.create({
        data: {
          orderNumber,
          orderType,
          status: 'PENDING',
          totalAmount,
          deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress ?? null : null,
          deliveryFee: addFee ? 4.99 : 0,
          customerPhone: customerPhone ?? null,
          specialInstructions: specialInstructions ?? null,
          vendorId,
          items: {
            create: items.map((i) => ({
              name: i.name,
              price: i.price,
              quantity: i.quantity ?? 1,
              vendorName: i.vendorName ?? 'Vendor',
              vendorId: vendorId ?? undefined,
              guestName: i.guestName ?? defaultGuestName ?? null
            }))
          }
        },
        include: { items: true }
      });

      orders.push({
        id: order.id,
        orderNumber: order.orderNumber ?? orderNumber,
        vendorId,
        totalAmount: order.totalAmount
      });
    }

    return res.json({
      success: true,
      orders,
      message: orders.length > 1 ? `${orders.length} orders created (multi-vendor)` : 'Order created'
    });
  } catch (e) {
    console.error('Handoff error:', e);
    return res.status(500).json({
      error: e?.message ?? 'Order handoff failed'
    });
  }
});

// Create order
app.post('/api/orders', (req, res) => {
  const { sessionId, items, customerPhone, specialInstructions } = req.body;
  
  const session = database.sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Group items by vendor for multi-vendor orders
  const itemsByVendor = {};
  items.forEach(item => {
    const vendorId = item.vendorId || session.vendorId;
    if (!itemsByVendor[vendorId]) {
      itemsByVendor[vendorId] = [];
    }
    itemsByVendor[vendorId].push(item);
  });
  
  // Create separate orders for each vendor
  const orders = [];
  Object.keys(itemsByVendor).forEach(vendorId => {
    const vendorItems = itemsByVendor[vendorId];
    const orderId = uuidv4();
    const orderNumber = Math.floor(100 + Math.random() * 900);
    const total = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
      id: orderId,
      orderNumber,
      vendorId: vendorId,
      items: vendorItems,
      total,
      customerPhone,
      specialInstructions,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    database.orders.set(orderId, order);
    orders.push(order);
    
    // Notify vendor via WebSocket
    notifyVendor(vendorId, order);
    // Notify central order board
    notifyCentral(order, 'NEW_ORDER');

    // Send SMS notification for order received
    if (customerPhone) {
      const message = getStatusMessage(order, 'pending');
      sendSMS(customerPhone, message);
    }
  });
  
  // Return the first order (or all orders if multiple)
  if (orders.length === 1) {
    res.json(orders[0]);
  } else {
    res.json({
      orders: orders,
      message: `Created ${orders.length} orders from different vendors`
    });
  }
});

// Get order
app.get('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = database.orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

// Update order status (for vendors)
app.patch('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  const order = database.orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.status = status;
  order.updatedAt = new Date().toISOString();
  database.orders.set(orderId, order);

  // Notify central order board of status change
  notifyCentral(order, 'ORDER_STATUS');

  // Send SMS notification for status update
  if (order.customerPhone) {
    const message = getStatusMessage(order, status);
    sendSMS(order.customerPhone, message);
  }

  console.log(`Order ${order.orderNumber} status updated to: ${status}`);

  res.json(order);
});

// Get orders for vendor
app.get('/api/vendors/:vendorId/orders', (req, res) => {
  const { vendorId } = req.params;
  const { status } = req.query;
  
  let orders = Array.from(database.orders.values())
    .filter(order => order.vendorId === vendorId);
  
  if (status) {
    orders = orders.filter(order => order.status === status);
  }
  
  // Sort by creation date (newest first)
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(orders);
});

// Get all orders (for central dashboard)
app.get('/api/orders', (req, res) => {
  const { status } = req.query;

  let orders = Array.from(database.orders.values()).map(order => ({
    ...order,
    vendorName: database.vendors.get(order.vendorId)?.name || order.vendorId
  }));

  if (status) {
    orders = orders.filter(order => order.status === status);
  }

  // Sort by creation date (newest first)
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(orders);
});

// Helper function to get all menu items with vendor info
const getAllMenuItems = () => {
  let allItems = [];
  database.menus.forEach((menu, vendorId) => {
    const vendor = database.vendors.get(vendorId);
    menu.forEach(item => {
      allItems.push({
        ...item,
        vendorName: vendor?.name || 'Unknown Vendor',
        vendorId: vendorId
      });
    });
  });
  return allItems;
};

// Chatbot conversation endpoint (simple NLP simulation)
app.post('/api/chat', (req, res) => {
  const { message, sessionId, vendorId } = req.body;
  
  const lowerMessage = message.toLowerCase();
  
  // Simple intent detection
  let response = {
    text: '',
    suggestions: [],
    menuItems: []
  };
  
  // Get all items from all vendors
  const allItems = getAllMenuItems();
  
  // Greeting
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
    response.text = `Hey there! Welcome to the event! 🎉 I can help you find delicious food from all our vendors. What are you in the mood for?`;
    response.suggestions = ['Show me all menus', 'What\'s popular?', 'Vegan options', 'Show all vendors'];
  }
  // Show all menus
  else if (lowerMessage.includes('menu') || lowerMessage.includes('show') || lowerMessage.includes('what do you have')) {
    response.text = 'Here\'s what all our vendors have available:';
    response.menuItems = allItems;
    response.suggestions = ['Vegan options', 'What\'s popular?', 'Show by vendor'];
  }
  // Show vendors
  else if (lowerMessage.includes('vendor') || lowerMessage.includes('stand') || lowerMessage.includes('restaurant')) {
    const vendors = Array.from(database.vendors.values());
    response.text = `We have ${vendors.length} vendors: ${vendors.map(v => v.name).join(', ')}. What would you like to see?`;
    response.suggestions = ['Show all menus', 'Pizza', 'Curry', 'Desserts'];
  }
  // Popular items
  else if (lowerMessage.includes('popular') || lowerMessage.includes('recommend')) {
    // Get a mix from different vendors
    const popularItems = allItems.filter((_, idx) => idx % 3 === 0).slice(0, 6);
    response.text = 'Here are some popular items from our vendors:';
    response.menuItems = popularItems;
    response.suggestions = ['Add to cart', 'See full menu'];
  }
  // Dietary filters
  else if (lowerMessage.includes('vegan')) {
    const veganItems = allItems.filter(item => item.dietary.includes('vegan'));
    response.menuItems = veganItems;
    response.text = veganItems.length > 0 
      ? `Here are ${veganItems.length} vegan options from our vendors:` 
      : 'Sorry, we don\'t have vegan options right now.';
    response.suggestions = ['Add to cart', 'Vegetarian options'];
  }
  else if (lowerMessage.includes('vegetarian')) {
    const vegItems = allItems.filter(item => item.dietary.includes('vegetarian'));
    response.menuItems = vegItems;
    response.text = vegItems.length > 0 
      ? `Here are ${vegItems.length} vegetarian options from our vendors:` 
      : 'Sorry, we don\'t have vegetarian options right now.';
    response.suggestions = ['Add to cart', 'Show menu'];
  }
  // Allergen queries
  else if (lowerMessage.includes('gluten') || lowerMessage.includes('dairy') || lowerMessage.includes('nut')) {
    let allergen = '';
    if (lowerMessage.includes('gluten')) allergen = 'gluten';
    if (lowerMessage.includes('dairy')) allergen = 'dairy';
    if (lowerMessage.includes('nut')) allergen = 'nuts';
    
    const filteredItems = allItems.filter(item => !item.allergens.includes(allergen));
    response.menuItems = filteredItems;
    response.text = `Here are items without ${allergen} from all vendors:`;
    response.suggestions = ['Add to cart', 'Other allergens'];
  }
  // Search by category or vendor name
  else if (lowerMessage.includes('pizza') || lowerMessage.includes('burger') || lowerMessage.includes('taco') || 
           lowerMessage.includes('curry') || lowerMessage.includes('coffee') || lowerMessage.includes('dessert') ||
           lowerMessage.includes('bbq') || lowerMessage.includes('fish')) {
    const searchTerm = lowerMessage;
    const filteredItems = allItems.filter(item => 
      item.category.toLowerCase().includes(searchTerm) ||
      item.name.toLowerCase().includes(searchTerm) ||
      item.vendorName.toLowerCase().includes(searchTerm)
    );
    response.menuItems = filteredItems;
    response.text = `Here's what I found:`;
    response.suggestions = ['Add to cart', 'Show all menus'];
  }
  // Default
  else {
    response.text = 'I can help you browse menus from all our vendors, find items by dietary preferences, or place an order. What would you like?';
    response.suggestions = ['Show all menus', 'Vegan options', 'What\'s popular?', 'Show all vendors'];
  }
  
  res.json(response);
});

// Production: serve built frontend and WebSocket on same port
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || (isProduction ? 3000 : 3001);
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}${isProduction ? ' (production)' : ''}`);
  console.log(`📡 WebSocket server ready`);
  if (isProduction) {
    console.log(`🌐 App: http://localhost:${PORT}`);
    console.log(`📋 Demo: http://localhost:${PORT}/?view=demo`);
  }
});
