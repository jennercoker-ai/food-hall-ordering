# 🎪 Event Food Ordering System

A full-stack QR-code based food ordering system for events with chatbot interface, real-time updates, and vendor management.

## 🌟 Features

### For Customers
- 📱 **QR Code Scanning** - Scan QR codes at vendor stalls to instantly start ordering
- 💬 **AI Chatbot Interface** - Natural language ordering with smart menu recommendations
- 🔍 **Smart Menu Search** - Filter by dietary preferences (vegan, vegetarian) and allergens
- 🛒 **Real-time Cart** - Add items, modify quantities, and checkout seamlessly
- 📲 **Order Tracking** - Real-time order status updates with SMS notifications
- 💳 **Flexible Payment** - Support for multiple payment providers (Stripe, Square)

### For Vendors
- 📊 **Live Dashboard** - Real-time order queue with WebSocket updates
- ✅ **Order Management** - Accept, prepare, and complete orders with status tracking
- 🖨️ **Printer Integration** - Auto-print order tickets to kitchen printers
- 📈 **Analytics** - Track sales, popular items, and performance metrics
- 🔔 **Push Notifications** - Instant alerts for new orders

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     QR Code Entry                        │
│              (Vendor ID + Location Context)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               React Frontend (Vite)                      │
│  - ChatInterface  - Cart  - OrderConfirmation           │
│  - VendorDashboard  - MenuCards                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Express.js Backend API                        │
│  - Session Management  - Order Processing               │
│  - Chatbot Logic  - Payment Integration                 │
│  - WebSocket for Real-time Updates                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              In-Memory Database                          │
│  (Replace with PostgreSQL/MongoDB in production)        │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- (Optional) PostgreSQL for production database
- (Optional) Redis for caching and session storage

### Installation

1. **Clone and install dependencies**
```bash
cd event-ordering-system
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the development servers**
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3001

### Testing the Application

#### Customer Flow:
1. Open `http://localhost:3000/?vendor=vendor-001&location=Table%205`
2. Chat with the bot: "Show me the menu"
3. Add items to cart
4. Enter phone number and place order
5. View order confirmation with real-time status

#### Vendor Dashboard:
1. Open `http://localhost:3000/?view=vendor&vendor=vendor-001`
2. See incoming orders in real-time
3. Accept and update order status
4. Track active and completed orders

## 📁 Project Structure

```
event-ordering-system/
├── server/
│   └── index.js              # Express backend with WebSocket
├── src/
│   ├── components/
│   │   ├── ChatInterface.jsx  # Main chat UI
│   │   ├── Cart.jsx           # Shopping cart modal
│   │   ├── MenuCard.jsx       # Menu item display
│   │   ├── OrderConfirmation.jsx
│   │   └── VendorDashboard.jsx
│   ├── App.jsx                # Main app component
│   ├── store.js               # Zustand state management
│   ├── main.jsx               # React entry point
│   └── index.css              # Tailwind styles
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Configuration

### QR Code URLs

Generate QR codes with these URL formats:

**Customer ordering:**
```
https://your-domain.com/?vendor=vendor-001&location=Table%205
```

**Vendor dashboard:**
```
https://your-domain.com/?view=vendor&vendor=vendor-001
```

**Order tracking:**
```
https://your-domain.com/?view=order&orderId=uuid-here
```

### Adding Vendors and Menu Items

Edit `server/index.js` in the `initializeData()` function:

```javascript
const vendorId = 'vendor-004';
database.vendors.set(vendorId, {
  id: vendorId,
  name: 'Your Vendor Name',
  description: 'Your description',
  active: true
});

database.menus.set(vendorId, [
  {
    id: 'item-xxx',
    vendorId: vendorId,
    name: 'Item Name',
    description: 'Item description',
    price: 12.99,
    category: 'Category',
    allergens: ['dairy', 'gluten'],
    dietary: ['vegetarian'],
    available: true
  }
]);
```

## 🔌 API Endpoints

### Session & Vendor
- `POST /api/session/create` - Create new session
- `GET /api/session/:sessionId` - Get session
- `GET /api/vendors/:vendorId` - Get vendor info
- `GET /api/menu/:vendorId` - Get vendor menu

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:orderId` - Get order details
- `PATCH /api/orders/:orderId/status` - Update order status
- `GET /api/vendors/:vendorId/orders` - Get vendor orders

### Chat
- `POST /api/chat` - Send message to chatbot

### Menu Search
- `POST /api/menu/search` - Search menu items with filters

## 🎨 Customization

### Branding
Update colors in `tailwind.config.js` and component styles:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color'
    }
  }
}
```

### Chatbot Responses
Modify chatbot logic in `server/index.js` at the `/api/chat` endpoint.

For advanced NLP, integrate:
- OpenAI GPT API
- Claude API (Anthropic)
- Google Dialogflow
- Rasa

## 🚀 Production Deployment

### Database Setup
Replace in-memory storage with PostgreSQL:

```javascript
// Install pg
npm install pg

// Example connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### Environment Variables
Set in production:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
STRIPE_SECRET_KEY=sk_live_xxx
TWILIO_ACCOUNT_SID=xxx
```

### Hosting Options

**Backend:**
- Railway
- Render
- Heroku
- AWS EC2/ECS
- Google Cloud Run

**Frontend:**
- Vercel
- Netlify
- Cloudflare Pages

**Full-stack:**
- Railway (recommended for this stack)
- Render

### Example Railway Deployment

1. Push code to GitHub
2. Connect to Railway
3. Add environment variables
4. Deploy automatically

## 🔐 Security Checklist

- ✅ Use HTTPS in production
- ✅ Validate all user inputs
- ✅ Implement rate limiting
- ✅ Use environment variables for secrets
- ✅ Enable CORS properly
- ✅ Sanitize database queries
- ✅ Use PCI-compliant payment providers
- ✅ Encrypt sensitive data at rest

## 📱 Payment Integration

### Stripe Example

```javascript
// Install Stripe
npm install stripe

// Backend
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // cents
    currency: 'usd',
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

### SMS Notifications with Twilio

SMS notifications are **already implemented** and will send real-time updates for all order status changes:
- 📱 Order received (pending)
- ✅ Order confirmed
- 👨‍🍳 Order being prepared
- 🎉 Order ready for pickup
- ✨ Order completed

**Setup (Optional):**
1. Sign up at https://www.twilio.com/
2. Get your Account SID, Auth Token, and Phone Number
3. Create a `.env` file in the project root:
```bash
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** If Twilio is not configured, SMS messages will be logged to the console for testing. The app works perfectly without Twilio credentials - you'll see SMS messages in the server logs.

## 🐛 Troubleshooting

**WebSocket not connecting:**
- Check that backend is running on port 3001
- Verify firewall settings
- Check browser console for errors

**Orders not appearing:**
- Verify vendor IDs match
- Check backend logs
- Ensure database is initialized

**Chat not responding:**
- Check API endpoint is accessible
- Verify session is created
- Look at network tab in dev tools

## 📊 Performance Optimization

- Use Redis for session caching
- Implement database indexing
- Enable CDN for static assets
- Use connection pooling
- Implement lazy loading for images
- Compress API responses with gzip

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙋 Support

For issues or questions:
- Open a GitHub issue
- Check documentation
- Review API endpoints

## 🎯 Future Enhancements

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Loyalty rewards program
- [ ] Table reservation system
- [ ] Split payment functionality
- [ ] Native mobile apps (React Native)
- [ ] Push notifications (Firebase)
- [ ] Advanced recommendation engine
- [ ] Integration with POS systems
- [ ] Offline mode support

---

Built with ❤️ for amazing event experiences!
