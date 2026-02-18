# 🚀 Quick Start Guide

## Installation & Running

1. **Install dependencies:**
```bash
npm install
```

2. **Start the application:**
```bash
npm run dev
```

This will start:
- ✅ Backend API on http://localhost:3001
- ✅ Frontend on http://localhost:3000
- ✅ WebSocket server for real-time updates

## Test URLs

### Customer Experience – One URL for All Vendors (recommended)
```
http://localhost:3000/
```
Single chatbot for the whole event: browse all vendors, chat, add items from any vendor to one cart. Orders are split and sent to each vendor automatically.

### Customer Experience (single-vendor QR code)
```
http://localhost:3000/?vendor=vendor-001&location=Table%205
```
This simulates scanning a QR code at Tony's Pizza stand.

Try these other vendors: `vendor-002` (El Camino Tacos), `vendor-003` (Burger Boulevard), `vendor-004`–`vendor-008`.

### Central Order Board (all vendors)
```
http://localhost:3000/?view=central
```
Live board showing every order from every vendor. Updates in real time when orders are placed or status changes. Filter by Active, Ready, Completed, or All.

### Vendor Dashboard (per-vendor)
```
http://localhost:3000/?view=vendor&vendor=vendor-001
```
This shows one vendor's order management dashboard.

### Order Tracking
After placing an order, you'll automatically be redirected to the order confirmation page.

## Sample Chat Commands

Try these in the chatbot:
- "Show me the menu"
- "What vegan options do you have?"
- "What's popular?"
- "Do you have anything without gluten?"
- "Show me vegetarian items"

## Project Structure

```
event-ordering-system/
├── server/
│   └── index.js              # Backend API + WebSocket server
├── src/
│   ├── components/           # React components
│   ├── App.jsx              # Main routing logic
│   ├── store.js             # State management
│   └── main.jsx             # Entry point
├── package.json             # Dependencies
└── README.md               # Full documentation
```

## Next Steps

1. **Customize vendors** - Edit `server/index.js` → `initializeData()`
2. **Add payment** - Set up Stripe/Square in `.env`
3. **Enable SMS** - Configure Twilio credentials
4. **Deploy** - Use Railway, Render, or Vercel

## Need Help?

Check the full README.md for:
- Complete API documentation
- Payment integration guide
- Production deployment steps
- Security best practices

---

Enjoy building your event ordering system! 🎉
