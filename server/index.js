const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const { createConciergeRoutes } = require('./concierge');

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

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production everything is served same-origin, so CORS is only needed for dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin requests (no Origin header) and listed origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  credentials: true,
}));

// Security headers for production
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: false }));

// In-memory storage (replace with actual database in production)
const database = {
  vendors: new Map(),
  menus: new Map(),
  orders: new Map(),
  sessions: new Map(),
  deliveries: new Map()
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

// Initialize Food Hall Concierge routes
createConciergeRoutes(app, prisma, database);

// WebSocket connection handling
const vendorConnections = new Map();
const centralConnections = new Set();

// SSE connections for live order updates (orderId -> Set of response objects)
const orderSSEConnections = new Map();
// SSE connections for customer order tracking (customerPhone -> Set of response objects)
const customerSSEConnections = new Map();
// SSE connections for group order tracking (groupId -> Set of response objects)
const groupSSEConnections = new Map();

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

// Utility function to send SSE update to order subscribers
const notifyOrderSSE = (orderId, data) => {
  const connections = orderSSEConnections.get(orderId);
  if (connections) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    connections.forEach(res => {
      try {
        res.write(payload);
      } catch (e) {
        // Connection closed, will be cleaned up
      }
    });
  }
};

// Utility function to send SSE update to customer subscribers
const notifyCustomerSSE = (customerPhone, data) => {
  if (!customerPhone) return;
  const connections = customerSSEConnections.get(customerPhone);
  if (connections) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    connections.forEach(res => {
      try {
        res.write(payload);
      } catch (e) {
        // Connection closed, will be cleaned up
      }
    });
  }
};

// Utility function to send SSE update to group subscribers
const notifyGroupSSE = (groupId, data) => {
  if (!groupId) return;
  const connections = groupSSEConnections.get(groupId);
  if (connections) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    connections.forEach(res => {
      try {
        res.write(payload);
      } catch (e) {
        // Connection closed, will be cleaned up
      }
    });
  }
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

// QR code image endpoint — accepts ?url= param, falls back to PUBLIC_URL env or request host
app.get('/api/qr', (req, res) => {
  try {
    const QRCode = require('qrcode');
    // Priority: explicit ?url param → PUBLIC_URL env → request host
    let targetUrl = req.query.url;
    if (!targetUrl) {
      const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      targetUrl = baseUrl.replace(/\/$/, '') + '/';
    }
    QRCode.toBuffer(targetUrl, {
      width: 512,
      margin: 2,
      type: 'png',
      errorCorrectionLevel: 'M',
      color: { dark: '#0f0f0f', light: '#ffffff' },
    }, (err, buf) => {
      if (err) {
        res.status(500).json({ error: 'Failed to generate QR code' });
        return;
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="food-hall-qr.png"');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buf);
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'QR failed' });
  }
});

// Get vendor by ID
app.get('/api/vendors/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  
  try {
    // Try Prisma first for full data including collectionPoint
    if (prisma) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId }
      });
      
      if (vendor) {
        return res.json(vendor);
      }
    }
    
    // Fallback to in-memory database
    const vendor = database.vendors.get(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    // Fallback to in-memory
    const vendor = database.vendors.get(vendorId);
    if (vendor) {
      return res.json(vendor);
    }
    res.status(404).json({ error: 'Vendor not found' });
  }
});

// Get all vendors
app.get('/api/vendors', async (req, res) => {
  try {
    // Use Prisma if available for full vendor data including collectionPoint
    if (prisma) {
      const vendors = await prisma.vendor.findMany({
        orderBy: { name: 'asc' }
      });
      return res.json(vendors);
    }
    // Fallback to in-memory database
    const vendors = Array.from(database.vendors.values());
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    // Fallback to in-memory on error
    const vendors = Array.from(database.vendors.values());
    res.json(vendors);
  }
});

// Get menu for vendor
app.get('/api/menu/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  
  try {
    // Use Prisma if available
    if (prisma) {
      const menuItems = await prisma.menuItem.findMany({
        where: { 
          vendorId,
          available: true 
        },
        include: { vendor: true }
      });
      
      if (menuItems.length === 0) {
        // Check if vendor exists
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
          return res.status(404).json({ error: 'Vendor not found' });
        }
      }
      
      // Format items to match expected structure
      const formattedItems = menuItems.map(item => ({
        id: item.id,
        vendorId: item.vendorId,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        allergens: item.allergens,
        dietary: item.dietary,
        available: item.available,
        isVegan: item.isVegan,
        vendorName: item.vendor?.name,
        collectionPoint: item.vendor?.collectionPoint
      }));
      
      return res.json(formattedItems);
    }
    
    // Fallback to in-memory database
    const menu = database.menus.get(vendorId);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    console.error('Error fetching menu:', error);
    // Fallback to in-memory on error
    const menu = database.menus.get(vendorId);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json(menu);
  }
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

// Handoff: create order(s) in DB from cart (Prisma) – uses relational schema
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
      specialInstructions,
      paymentId,
      groupId
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

      const orderItemsData = [];
      for (const i of items) {
        let menuItemId = i.menuItemId;
        let itemVendorId = vendorId;
        
        if (!menuItemId && i.name) {
          const menuItem = await prisma.menuItem.findFirst({
            where: {
              name: i.name,
              ...(itemVendorId ? { vendorId: itemVendorId } : {})
            }
          });
          if (menuItem) {
            menuItemId = menuItem.id;
            itemVendorId = menuItem.vendorId;
          }
        }
        
        if (menuItemId && itemVendorId) {
          orderItemsData.push({
            menuItemId,
            vendorId: itemVendorId,
            quantity: i.quantity ?? 1,
            price: i.price,
            guestName: i.guestName ?? defaultGuestName ?? null,
            status: 'RECEIVED'
          });
        }
      }

      if (orderItemsData.length === 0) {
        continue;
      }

      const orderNumber = Math.floor(100 + Math.random() * 900);
      const order = await prisma.order.create({
        data: {
          orderNumber,
          orderType,
          status: 'PENDING',
          totalAmount,
          paymentId: paymentId ?? null,
          groupId: groupId ?? null,
          deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress ?? null : null,
          deliveryFee: addFee ? 4.99 : 0,
          customerPhone: customerPhone ?? null,
          specialInstructions: specialInstructions ?? null,
          vendorId,
          items: {
            create: orderItemsData
          }
        },
        include: { 
          items: {
            include: {
              menuItem: true,
              vendor: true
            }
          }
        }
      });

      orders.push({
        id: order.id,
        orderNumber: order.orderNumber ?? orderNumber,
        vendorId,
        totalAmount: order.totalAmount,
        items: order.items
      });
    }

    if (orders.length === 0) {
      return res.status(400).json({ error: 'No valid items found in cart' });
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

// Create order (session-based or session-less for group/family orders)
app.post('/api/orders', async (req, res) => {
  const {
    sessionId,
    items,
    customerPhone,
    specialInstructions,
    destination,
    guestName,
    orderType = 'DINE_IN',
    tableNumber,
    deliveryFee = 0,
    groupId: bodyGroupId
  } = req.body;

  const session = sessionId ? database.sessions.get(sessionId) : null;
  const isGroupOrder = Boolean(bodyGroupId);

  // Allow creation without session when items + (customerPhone or groupId) are present (e.g. family/group checkout)
  if (!session && (!items || !Array.isArray(items) || items.length === 0)) {
    return res.status(400).json({ error: 'Items required' });
  }
  if (!session && !customerPhone && !bodyGroupId) {
    return res.status(400).json({ error: 'Session not found or provide customerPhone/groupId' });
  }

  // Group items by vendor
  const itemsByVendor = {};
  (items || []).forEach(item => {
    const vendorId = item.vendorId || (session && session.vendorId);
    if (!vendorId) return;
    if (!itemsByVendor[vendorId]) itemsByVendor[vendorId] = [];
    itemsByVendor[vendorId].push(item);
  });

  const vendorIds = Object.keys(itemsByVendor);
  if (vendorIds.length === 0) {
    return res.status(400).json({ error: 'No valid items with vendor' });
  }

  const isMultiVendor = vendorIds.length > 1;
  const needsDeliveryTicket = isMultiVendor || orderType === 'DELIVERY';
  const deliveryId = needsDeliveryTicket ? 'DH-' + (1000 + Math.floor(Math.random() * 9000)) : null;

  if (deliveryId) {
    database.deliveries.set(deliveryId, {
      deliveryId,
      orderIds: [],
      destination: destination || '',
      guestName: guestName || '',
      orderType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  const orders = [];
  for (let i = 0; i < vendorIds.length; i++) {
    const vendorId = vendorIds[i];
    const rawItems = itemsByVendor[vendorId];
    let menu = database.menus.get(vendorId) || [];
    if (menu.length === 0 && prisma) {
      try {
        const prismaMenu = await prisma.menuItem.findMany({
          where: { vendorId, available: true },
          select: { id: true, name: true, price: true, allergens: true, dietary: true }
        });
        menu = prismaMenu;
      } catch (_) {}
    }
    const menuById = new Map(menu.map(m => [m.id, m]));
    const vendorItems = rawItems.map(item => {
      const menuItem = menuById.get(item.id) || {};
      return {
        ...item,
        name: item.name || menuItem.name,
        allergens: menuItem.allergens || item.allergens || [],
        dietary: menuItem.dietary || item.dietary || []
      };
    });

    const orderNumber = Math.floor(100 + Math.random() * 900);
    const itemsTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isFirstOrder = orders.length === 0;
    const total = itemsTotal + (isFirstOrder && orderType === 'DELIVERY' ? Number(deliveryFee) || 0 : 0);
    let vendorName = vendorId;
    try {
      if (prisma) {
        const v = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (v) vendorName = v.name;
      } else {
        const v = database.vendors.get(vendorId);
        if (v) vendorName = v.name;
      }
    } catch (_) {}

    // Persist to Prisma so KDS and vendor screens see the order
    let createdOrderId = uuidv4();
    if (prisma) {
      try {
        const orderItemsData = [];
        for (const it of vendorItems) {
          const menuItemId = it.id;
          if (!menuItemId || !vendorId) continue;
          const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
          const price = Number(it.price);
          if (!Number.isFinite(price)) continue;
          orderItemsData.push({
            menuItemId,
            vendorId,
            quantity: qty,
            price,
            guestName: it.guestName || guestName || null,
            status: 'RECEIVED'
          });
        }
        if (orderItemsData.length > 0) {
          const prismaOrder = await prisma.order.create({
            data: {
              orderNumber,
              orderType: orderType === 'DINE_IN' ? 'DINE_IN' : orderType === 'DELIVERY' ? 'DELIVERY' : 'COLLECTION',
              status: 'PENDING',
              totalAmount: total,
              groupId: bodyGroupId || null,
              tableNumber: tableNumber || null,
              deliveryAddress: orderType === 'DELIVERY' ? (destination || null) : null,
              deliveryFee: isFirstOrder ? (Number(deliveryFee) || 0) : 0,
              customerPhone: customerPhone || null,
              customerName: guestName || null,
              specialInstructions: specialInstructions || null,
              vendorId,
              items: { create: orderItemsData }
            },
            include: {
              items: {
                include: {
                  menuItem: true,
                  vendor: true
                }
              }
            }
          });
          createdOrderId = prismaOrder.id;
        }
      } catch (e) {
        console.error('Prisma order create error:', e);
      }
    }

    const order = {
      id: createdOrderId,
      orderNumber,
      vendorId,
      vendorName,
      deliveryId,
      items: vendorItems.map(it => ({ ...it, status: it.status || 'RECEIVED' })),
      total,
      itemsTotal,
      deliveryFee: isFirstOrder ? (Number(deliveryFee) || 0) : 0,
      customerPhone: customerPhone || null,
      specialInstructions: specialInstructions || null,
      destination: destination || null,
      guestName: guestName || null,
      orderType,
      tableNumber: tableNumber || null,
      groupId: bodyGroupId || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    database.orders.set(createdOrderId, order);
    orders.push(order);

    if (deliveryId) {
      const d = database.deliveries.get(deliveryId);
      d.orderIds.push(createdOrderId);
      if (customerPhone && !d.customerPhone) d.customerPhone = customerPhone;
      if (destination && !d.destination) d.destination = destination;
    }

    notifyVendor(vendorId, order);
    notifyCentral(order, 'NEW_ORDER');

    if (customerPhone) {
      const message = getStatusMessage(order, 'pending');
      sendSMS(customerPhone, message);
    }
  }

  if (orders.length === 1) {
    res.json(orders[0]);
  } else {
    res.json({
      orders,
      deliveryId,
      message: `Created ${orders.length} orders from different vendors`
    });
  }
});

// Get order (Prisma first so KDS-created orders are found, then in-memory)
app.get('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;

  if (prisma) {
    try {
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { menuItem: true, vendor: true } },
          vendor: true
        }
      });
      if (dbOrder) {
        const formatted = {
          id: dbOrder.id,
          orderNumber: dbOrder.orderNumber,
          vendorId: dbOrder.vendorId,
          vendorName: dbOrder.vendor?.name || dbOrder.vendorId,
          items: dbOrder.items.map(it => ({
            id: it.id,
            name: it.menuItem?.name || it.name,
            quantity: it.quantity,
            price: it.price,
            status: it.status,
            guestName: it.guestName,
            vendorId: it.vendorId
          })),
          total: dbOrder.totalAmount,
          itemsTotal: dbOrder.totalAmount - (dbOrder.deliveryFee || 0),
          deliveryFee: dbOrder.deliveryFee || 0,
          customerPhone: dbOrder.customerPhone,
          specialInstructions: dbOrder.specialInstructions,
          destination: dbOrder.deliveryAddress,
          guestName: dbOrder.customerName,
          orderType: dbOrder.orderType,
          tableNumber: dbOrder.tableNumber,
          groupId: dbOrder.groupId,
          status: dbOrder.status.toLowerCase(),
          createdAt: dbOrder.createdAt?.toISOString?.(),
          updatedAt: dbOrder.updatedAt?.toISOString?.()
        };
        return res.json(formatted);
      }
    } catch (e) {
      console.error('Error fetching order from Prisma:', e);
    }
  }

  const order = database.orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// SSE: Live order updates stream
app.get('/api/orders/:orderId/live', (req, res) => {
  const { orderId } = req.params;
  const order = database.orders.get(orderId);
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();
  
  // Send initial connection message
  const initialData = {
    status: 'LISTENING',
    message: 'Live updates active',
    orderId,
    currentStatus: order?.status || 'unknown',
    timestamp: new Date().toISOString()
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);
  
  // If order exists, send current state
  if (order) {
    res.write(`data: ${JSON.stringify({
      type: 'ORDER_STATE',
      order: {
        ...order,
        vendorName: database.vendors.get(order.vendorId)?.name
      }
    })}\n\n`);
  }
  
  // Register this connection
  if (!orderSSEConnections.has(orderId)) {
    orderSSEConnections.set(orderId, new Set());
  }
  orderSSEConnections.get(orderId).add(res);
  
  // Heartbeat to keep connection alive (every 20 seconds)
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 20000);
  
  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(heartbeat);
    const connections = orderSSEConnections.get(orderId);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        orderSSEConnections.delete(orderId);
      }
    }
    console.log(`SSE connection closed for order ${orderId}`);
  });
});

// SSE: Live updates for group orders
app.get('/api/group/:groupId/live', async (req, res) => {
  const { groupId } = req.params;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    status: 'LISTENING',
    message: 'Live group updates active',
    groupId,
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  // Get current group orders from Prisma if available
  if (prisma) {
    try {
      const orders = await prisma.order.findMany({
        where: { groupId },
        include: {
          items: {
            include: {
              menuItem: true,
              vendor: true
            }
          }
        }
      });
      
      // Calculate group progress
      const allItems = orders.flatMap(o => o.items);
      const readyCount = allItems.filter(i => i.status === 'READY' || i.status === 'COLLECTED').length;
      const totalItems = allItems.length;
      const progressPercent = totalItems > 0 ? Math.round((readyCount / totalItems) * 100) : 0;
      
      res.write(`data: ${JSON.stringify({
        type: 'GROUP_STATE',
        orders,
        progress: {
          readyCount,
          totalItems,
          percent: progressPercent
        }
      })}\n\n`);
    } catch (e) {
      console.error('Error fetching group orders:', e);
    }
  }
  
  // Register this connection
  if (!groupSSEConnections.has(groupId)) {
    groupSSEConnections.set(groupId, new Set());
  }
  groupSSEConnections.get(groupId).add(res);
  
  // Heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 20000);
  
  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(heartbeat);
    const connections = groupSSEConnections.get(groupId);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        groupSSEConnections.delete(groupId);
      }
    }
    console.log(`SSE connection closed for group ${groupId}`);
  });
});

// SSE: Live updates for customer (by phone number)
app.get('/api/customer/live', (req, res) => {
  const { phone } = req.query;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    status: 'LISTENING',
    message: 'Live updates active for your orders',
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  // Send current orders for this customer
  const customerOrders = Array.from(database.orders.values())
    .filter(o => o.customerPhone === phone)
    .map(o => ({
      ...o,
      vendorName: database.vendors.get(o.vendorId)?.name
    }));
  
  if (customerOrders.length > 0) {
    res.write(`data: ${JSON.stringify({
      type: 'CURRENT_ORDERS',
      orders: customerOrders
    })}\n\n`);
  }
  
  // Register this connection
  if (!customerSSEConnections.has(phone)) {
    customerSSEConnections.set(phone, new Set());
  }
  customerSSEConnections.get(phone).add(res);
  
  // Heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 20000);
  
  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(heartbeat);
    const connections = customerSSEConnections.get(phone);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        customerSSEConnections.delete(phone);
      }
    }
    console.log(`SSE connection closed for customer ${phone}`);
  });
});

// Get aggregated delivery (multi-vendor ticket)
app.get('/api/delivery/:deliveryId', (req, res) => {
  const { deliveryId } = req.params;
  const delivery = database.deliveries.get(deliveryId);
  
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }
  
  const vendors = [];
  let totalItems = 0;
  
  delivery.orderIds.forEach(orderId => {
    const order = database.orders.get(orderId);
    if (!order) return;
    totalItems += order.items.reduce((s, i) => s + (i.quantity || 1), 0);
    vendors.push({
      vendorId: order.vendorId,
      vendorName: order.vendorName || order.vendorId,
      items: order.items.map(i => ({
        name: i.name,
        quantity: i.quantity || 1,
        allergens: i.allergens || []
      }))
    });
  });
  
  res.json({
    deliveryId,
    orderNumber: deliveryId,
    date: delivery.createdAt,
    destination: delivery.destination || 'Collection at venue',
    guestName: delivery.guestName || 'Guest',
    status: delivery.status || 'pending',
    vendors,
    totalItems,
    vendorCount: vendors.length
  });
});

// QR code for delivery ticket (live tracking URL)
app.get('/api/delivery/:deliveryId/qr', (req, res) => {
  const { deliveryId } = req.params;
  const delivery = database.deliveries.get(deliveryId);
  
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }
  
  try {
    const QRCode = require('qrcode');
    const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const trackingUrl = `${baseUrl.replace(/\/$/, '')}/?view=delivery&deliveryId=${encodeURIComponent(deliveryId)}`;
    QRCode.toBuffer(trackingUrl, { width: 280, margin: 2, type: 'png' }, (err, buf) => {
      if (err) {
        res.status(500).json({ error: 'Failed to generate QR code' });
        return;
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="delivery-tracking-qr.png"');
      res.send(buf);
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'QR failed' });
  }
});

const VALID_ITEM_STATUSES = ['RECEIVED', 'PREPARING', 'READY', 'COLLECTED'];

// Update individual order item status (for vendors marking items ready)
app.patch('/api/order-items/:orderItemId/status', async (req, res) => {
  const { orderItemId } = req.params;
  const { status, vendorId } = req.body;
  const newStatus = (status && VALID_ITEM_STATUSES.includes(String(status).toUpperCase()))
    ? String(status).toUpperCase()
    : 'READY';

  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const updatedItem = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: newStatus },
      include: { 
        order: true, 
        vendor: true,
        menuItem: true
      }
    });
    
    // Check if all items in the order are ready
    const allOrderItems = await prisma.orderItem.findMany({
      where: { orderId: updatedItem.orderId }
    });
    
    const allReady = allOrderItems.every(item => item.status === 'READY');
    const readyCount = allOrderItems.filter(item => item.status === 'READY').length;
    
    // Prepare notification payload
    const notificationPayload = {
      type: 'ITEM_STATUS',
      orderItemId,
      orderId: updatedItem.orderId,
      orderNumber: updatedItem.order.orderNumber,
      itemName: updatedItem.menuItem?.name || 'Item',
      itemStatus: updatedItem.status,
      vendorId: updatedItem.vendorId,
      vendorName: updatedItem.vendor?.name || 'Vendor',
      station: updatedItem.vendor?.collectionPoint || null, // e.g., "Station 3"
      readyCount,
      totalItems: allOrderItems.length,
      allReady,
      timestamp: new Date().toISOString()
    };
    
    // Notify SSE subscribers for this order
    notifyOrderSSE(updatedItem.orderId, notificationPayload);
    
    // Notify group if this order is part of a group
    if (updatedItem.order.groupId) {
      notifyGroupSSE(updatedItem.order.groupId, {
        ...notificationPayload,
        type: 'GROUP_ITEM_STATUS'
      });
    }
    
    // Notify customer if they have phone number
    if (updatedItem.order.customerPhone) {
      notifyCustomerSSE(updatedItem.order.customerPhone, notificationPayload);
      
      // Send SMS when item is ready
      if (updatedItem.status === 'READY') {
        const station = updatedItem.vendor?.collectionPoint;
        const stationInfo = station ? ` Collect at ${station}.` : '';
        const message = `🍽️ Your ${updatedItem.menuItem?.name || 'item'} from ${updatedItem.vendor?.name} is ready!${stationInfo} (${readyCount}/${allOrderItems.length} items ready)`;
        sendSMS(updatedItem.order.customerPhone, message);
      }
      
      // Send SMS when all items are ready
      if (allReady) {
        const message = `🎉 All ${allOrderItems.length} items from Order #${updatedItem.order.orderNumber} are ready! Please collect from the vendors.`;
        sendSMS(updatedItem.order.customerPhone, message);
      }
    }
    
    // Notify central order board
    const centralPayload = {
      type: 'ITEM_STATUS',
      ...notificationPayload
    };
    centralConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(centralPayload));
      }
    });
    
    // If all items ready, update overall order status
    if (allReady) {
      await prisma.order.update({
        where: { id: updatedItem.orderId },
        data: { status: 'COMPLETED' }
      });
    }
    
    console.log(`Order item ${orderItemId} status updated to: ${updatedItem.status} (${readyCount}/${allOrderItems.length} ready)`);
    
    res.json({ 
      success: true,
      item: updatedItem,
      readyCount,
      totalItems: allOrderItems.length,
      allReady
    });
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ error: error.message || 'Failed to update item status' });
  }
});

// Bulk update: Mark all items from a vendor as ready
app.patch('/api/orders/:orderId/vendor/:vendorId/ready', async (req, res) => {
  const { orderId, vendorId } = req.params;
  
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // Update all items from this vendor in this order
    const result = await prisma.orderItem.updateMany({
      where: { 
        orderId,
        vendorId
      },
      data: { status: 'READY' }
    });
    
    // Get updated order with all items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            vendor: true,
            menuItem: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    const allReady = order.items.every(item => item.status === 'READY');
    const readyCount = order.items.filter(item => item.status === 'READY').length;
    
    // Notification payload
    const notificationPayload = {
      type: 'VENDOR_ITEMS_READY',
      orderId,
      orderNumber: order.orderNumber,
      vendorId,
      vendorName: vendor?.name || 'Vendor',
      station: vendor?.collectionPoint || null,
      itemsMarkedReady: result.count,
      readyCount,
      totalItems: order.items.length,
      allReady,
      timestamp: new Date().toISOString()
    };
    
    // Notify SSE subscribers
    notifyOrderSSE(orderId, notificationPayload);
    
    // Notify group if this order is part of a group
    if (order.groupId) {
      notifyGroupSSE(order.groupId, {
        ...notificationPayload,
        type: 'GROUP_VENDOR_READY'
      });
    }
    
    if (order.customerPhone) {
      notifyCustomerSSE(order.customerPhone, notificationPayload);
      
      // SMS notification with collection point
      const station = vendor?.collectionPoint;
      const stationInfo = station ? ` Collect at ${station}.` : '';
      const message = allReady
        ? `🎉 All items from Order #${order.orderNumber} are ready for collection!`
        : `✅ Your items from ${vendor?.name} are ready!${stationInfo} (${readyCount}/${order.items.length} items ready)`;
      sendSMS(order.customerPhone, message);
    }
    
    // Update overall order status if all ready
    if (allReady) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' }
      });
    }
    
    console.log(`Vendor ${vendorId} marked ${result.count} items ready for order ${orderId}`);
    
    res.json({
      success: true,
      itemsUpdated: result.count,
      readyCount,
      totalItems: order.items.length,
      allReady
    });
  } catch (error) {
    console.error('Error bulk updating items:', error);
    res.status(500).json({ error: error.message || 'Failed to update items' });
  }
});

// Update order status (for vendors)
app.patch('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  const order = database.orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const previousStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  database.orders.set(orderId, order);

  // Prepare update payload
  const updatePayload = {
    type: 'ORDER_STATUS',
    orderId,
    orderNumber: order.orderNumber,
    previousStatus,
    status,
    vendorName: database.vendors.get(order.vendorId)?.name,
    updatedAt: order.updatedAt,
    order: { ...order, vendorName: database.vendors.get(order.vendorId)?.name }
  };

  // Notify central order board of status change
  notifyCentral(order, 'ORDER_STATUS');
  
  // Notify SSE subscribers for this specific order
  notifyOrderSSE(orderId, updatePayload);
  
  // Notify SSE subscribers for this customer
  if (order.customerPhone) {
    notifyCustomerSSE(order.customerPhone, updatePayload);
  }

  // Send SMS notification for status update
  if (order.customerPhone) {
    const message = getStatusMessage(order, status);
    sendSMS(order.customerPhone, message);
  }

  console.log(`Order ${order.orderNumber} status updated to: ${status}`);

  res.json(order);
});

// Resolve vendor id: map in-memory ids (vendor-001, etc.) to Prisma vendor id by name so dashboard shows orders
const resolveVendorIdForOrders = async (vendorId) => {
  if (!prisma) return vendorId;
  const memVendor = database.vendors.get(vendorId);
  if (memVendor && memVendor.name) {
    const prismaVendor = await prisma.vendor.findFirst({
      where: { name: memVendor.name },
      select: { id: true }
    });
    if (prismaVendor) return prismaVendor.id;
  }
  return vendorId;
};

// Get orders for vendor (Prisma first so KDS-persisted orders appear)
app.get('/api/vendors/:vendorId/orders', async (req, res) => {
  const { vendorId } = req.params;
  const { status } = req.query;
  const resolvedVendorId = await resolveVendorIdForOrders(vendorId);

  const formatOrder = (o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    vendorId: o.vendorId,
    vendorName: o.vendor?.name || o.vendorId,
    items: o.items?.map(it => ({
      id: it.id,
      name: it.menuItem?.name || it.name,
      quantity: it.quantity,
      price: it.price,
      status: it.status,
      guestName: it.guestName,
      vendorId: it.vendorId
    })) || [],
    total: o.totalAmount,
    itemsTotal: o.totalAmount - (o.deliveryFee || 0),
    deliveryFee: o.deliveryFee || 0,
    customerPhone: o.customerPhone,
    specialInstructions: o.specialInstructions,
    destination: o.deliveryAddress,
    guestName: o.customerName,
    orderType: o.orderType,
    tableNumber: o.tableNumber,
    groupId: o.groupId,
    status: (o.status || 'PENDING').toLowerCase(),
    createdAt: o.createdAt?.toISOString?.() || o.createdAt,
    updatedAt: o.updatedAt?.toISOString?.() || o.updatedAt
  });

  let orders = [];
  if (prisma) {
    try {
      const where = { vendorId: resolvedVendorId };
      if (status) where.status = status.toUpperCase();
      const dbOrders = await prisma.order.findMany({
        where,
        include: {
          items: { include: { menuItem: true, vendor: true } },
          vendor: true
        },
        orderBy: { createdAt: 'desc' }
      });
      orders = dbOrders.map(formatOrder);
    } catch (e) {
      console.error('Error fetching vendor orders from Prisma:', e);
    }
  }

  let memOrders = Array.from(database.orders.values())
    .filter(order => (order.vendorId === vendorId || order.vendorId === resolvedVendorId) && !orders.some(o => o.id === order.id));
  if (status) {
    memOrders = memOrders.filter(order => order.status === status);
  }
  orders = orders.concat(memOrders);
  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(orders);
});

// Get order items for vendor KDS (Kitchen Display System)
app.get('/api/vendors/:vendorId/order-items', async (req, res) => {
  const { vendorId } = req.params;
  const { status } = req.query;

  // Try Prisma first when available; on any error fall back to in-memory so KDS never 500s
  if (prisma) {
    try {
      const whereClause = { vendorId };
      if (status) {
        whereClause.status = status;
      } else {
        whereClause.status = { not: 'COLLECTED' };
      }
      const orderItems = await prisma.orderItem.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerPhone: true,
              specialInstructions: true,
              groupId: true,
              createdAt: true
            }
          },
          menuItem: {
            select: {
              id: true,
              name: true,
              price: true,
              category: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { order: { createdAt: 'asc' } }
        ]
      });
      const formattedItems = orderItems.map(item => ({
        ...item,
        orderId: item.orderId,
        orderNumber: String(item.order?.orderNumber ?? item.orderId?.slice(-4) ?? '').toUpperCase(),
        name: item.menuItem?.name || item.name,
        guestName: item.guestName
      }));
      return res.json(formattedItems);
    } catch (e) {
      console.error('KDS order-items Prisma error (falling back to in-memory):', e.message || e);
    }
  }

  // In-memory fallback (or when Prisma unavailable)
  try {
    let items = [];
    database.orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (item.vendorId === vendorId || order.vendorId === vendorId) {
            items.push({
              ...item,
              name: item.name || 'Item',
              orderId: order.id,
              orderNumber: (order.orderNumber != null ? String(order.orderNumber) : order.id.slice(-4)).toUpperCase(),
              order: {
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.guestName || order.customerName,
                customerPhone: order.customerPhone,
                specialInstructions: order.specialInstructions,
                groupId: order.groupId,
                createdAt: order.createdAt
              },
              status: (item.status || 'RECEIVED').toUpperCase()
            });
          }
        });
      }
    });
    
    // Filter by status
    if (status) {
      items = items.filter(item => item.status === status);
    } else {
      items = items.filter(item => item.status !== 'COLLECTED');
    }
    
    // Sort: RECEIVED first, then PREPARING, then oldest first
    const statusOrder = { 'RECEIVED': 0, 'PREPARING': 1, 'READY': 2 };
    items.sort((a, b) => {
      const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      if (statusDiff !== 0) return statusDiff;
      const aTime = (a.order && a.order.createdAt) || a.createdAt || 0;
      const bTime = (b.order && b.order.createdAt) || b.createdAt || 0;
      return new Date(aTime) - new Date(bTime);
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching vendor order items:', error);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

// Get all orders (for central dashboard); optional ?customerPhone= ?groupId= ?status=
app.get('/api/orders', async (req, res) => {
  const { status, customerPhone, groupId } = req.query;

  const formatOrder = (o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    vendorId: o.vendorId,
    vendorName: o.vendor?.name || o.vendorId,
    items: o.items?.map(it => ({
      id: it.id,
      name: it.menuItem?.name || it.name,
      quantity: it.quantity,
      price: it.price,
      status: it.status,
      guestName: it.guestName,
      vendorId: it.vendorId
    })) || [],
    total: o.totalAmount,
    itemsTotal: o.totalAmount - (o.deliveryFee || 0),
    deliveryFee: o.deliveryFee || 0,
    customerPhone: o.customerPhone,
    specialInstructions: o.specialInstructions,
    destination: o.deliveryAddress,
    guestName: o.customerName,
    orderType: o.orderType,
    tableNumber: o.tableNumber,
    groupId: o.groupId,
    status: (o.status || 'PENDING').toLowerCase(),
    createdAt: o.createdAt?.toISOString?.() || o.createdAt,
    updatedAt: o.updatedAt?.toISOString?.() || o.updatedAt
  });

  let orders = [];

  if (prisma) {
    try {
      const where = {};
      if (status) where.status = status.toUpperCase();
      if (customerPhone && customerPhone.trim()) {
        where.customerPhone = { equals: customerPhone.trim(), mode: 'insensitive' };
      }
      if (groupId && groupId.trim()) where.groupId = groupId.trim();

      const dbOrders = await prisma.order.findMany({
        where: Object.keys(where).length ? where : undefined,
        include: {
          items: { include: { menuItem: true, vendor: true } },
          vendor: true
        },
        orderBy: { createdAt: 'desc' }
      });
      orders = dbOrders.map(formatOrder);
    } catch (e) {
      console.error('Error fetching orders from Prisma:', e);
    }
  }

  // Merge in-memory orders not already in list (e.g. from before Prisma)
  const orderIds = new Set(orders.map(o => o.id));
  Array.from(database.orders.values()).forEach(order => {
    if (orderIds.has(order.id)) return;
    if (status && order.status !== status) return;
    if (customerPhone && customerPhone.trim()) {
      if (!order.customerPhone || order.customerPhone.trim() !== customerPhone.trim()) return;
    }
    if (groupId && groupId.trim()) {
      if (!order.groupId || order.groupId !== groupId.trim()) return;
    }
    orders.push({
      ...order,
      vendorName: database.vendors.get(order.vendorId)?.name || order.vendorId
    });
    orderIds.add(order.id);
  });

  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(orders);
});

// Get all deliveries (for delivery dashboard)
app.get('/api/deliveries', (req, res) => {
  const { status } = req.query;
  let list = Array.from(database.deliveries.values()).map(d => ({
    ...d,
    orderIds: d.orderIds || []
  }));
  if (status) {
    list = list.filter(d => d.status === status);
  }
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// Update delivery status (dispatched / delivered)
app.patch('/api/delivery/:deliveryId/status', (req, res) => {
  const { deliveryId } = req.params;
  const { status } = req.body;
  const delivery = database.deliveries.get(deliveryId);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }
  if (!['pending', 'dispatched', 'delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const previousStatus = delivery.status;
  delivery.status = status;
  delivery.updatedAt = new Date().toISOString();

  // SMS for delivery updates (phone from first order in this delivery)
  const firstOrderId = delivery.orderIds && delivery.orderIds[0];
  const firstOrder = firstOrderId ? database.orders.get(firstOrderId) : null;
  const customerPhone = firstOrder?.customerPhone || delivery.customerPhone;
  if (customerPhone) {
    if (status === 'dispatched') {
      sendSMS(customerPhone, `🚚 Your order (${deliveryId}) is on its way! Delivery to ${delivery.destination || 'your address'}.`);
    } else if (status === 'delivered') {
      sendSMS(customerPhone, `✅ Your order (${deliveryId}) has been delivered. Thank you!`);
    }
  }

  res.json(delivery);
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

// Serve static files from public folder (logos, images, sounds, etc.)
const publicPath = path.join(__dirname, '..', 'public');
if (require('fs').existsSync(publicPath)) {
  app.use(express.static(publicPath, { maxAge: isProduction ? '7d' : 0 }));
}

// Production: serve built Vite frontend from dist/
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  if (require('fs').existsSync(distPath)) {
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
      // Don't cache index.html so deploys propagate immediately
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
    // SPA fallback – serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  dist/ not found — run "npm run build" before starting in production');
  }
}

// ─── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || (isProduction ? 3000 : 3001);
server.listen(PORT, '0.0.0.0', () => {
  const publicUrl = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
  console.log(`🚀 Server running on port ${PORT}${isProduction ? ' (production)' : ''}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 App: ${publicUrl}`);
  if (isProduction) {
    console.log(`📋 Demo hub: ${publicUrl}/?view=demo`);
    console.log(`📲 QR codes: ${publicUrl}/?view=qr`);
    console.log(`🍳 KDS:      ${publicUrl}/?view=kds`);
  }
});
