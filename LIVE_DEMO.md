# Live Demo – Event Ordering System

Use this as your runbook for a live demo. Start the app, then open the **demo hub** and follow the script.

---

## 1. Start the app

**Development (two processes):**
```bash
npm install
npm run dev
```
- **Frontend:** http://localhost:3000 · **Backend:** http://localhost:3001

**Production (single process, for live demo / testing):**
```bash
npm install
npm run prod
```
- **App + API + WebSocket:** http://localhost:3000  

---

## 2. Demo hub (single entry point)

Open this in your browser first:

**http://localhost:3000/?view=demo**

This page has:
- One-click links to open **Customer**, **Central board**, and **Vendor** dashboards (in new tabs)
- A short **demo script** you can follow live

---

## 3. Direct URLs (for slides or bookmarks)

| Role | URL |
|------|-----|
| **Demo hub** | http://localhost:3000/?view=demo |
| **QR code (unified chatbot)** | http://localhost:3000/?view=qr |
| **Customer (unified chatbot)** | http://localhost:3000/ |
| **Central order board** | http://localhost:3000/?view=central |
| **Tony's Pizza (vendor)** | http://localhost:3000/?view=vendor&vendor=vendor-001 |
| **El Camino Tacos (vendor)** | http://localhost:3000/?view=vendor&vendor=vendor-002 |
| **Sweet Treats (vendor)** | http://localhost:3000/?view=vendor&vendor=vendor-008 |

---

## 4. Demo script (2–3 minutes)

1. **Customer flow**
   - Open **Customer ordering** (or go to http://localhost:3000/).
   - In chat: *“Show me the menu”* or *“Vegan options”*.
   - Or use the **Browse Vendors** tab → pick a vendor → add items.
   - Add items from **two different vendors** (e.g. pizza + tacos).
   - Open **Cart** → enter a phone number → **Place order**.
   - You’re redirected to **order confirmation** (live status).

2. **Central board**
   - Open **Central order board** (new tab).
   - Show that the new order(s) appear in real time.
   - Filter by **Active** / **Ready** / **Completed** if you like.

3. **Vendor flow**
   - Open **Tony's Pizza** (or another vendor) dashboard in a new tab.
   - Show the new order; click **Accept** → **Start Preparing** → **Mark Ready**.
   - Optional: open a second vendor tab and update that order too.

4. **Back to customer**
   - Switch to the **customer** tab (order confirmation).
   - Mention that status updates in real time and that payment is **cash on collection** (£).

---

## 5. One-liner for the audience

> “Guests scan one URL or QR code, chat or browse all vendors, add items to one cart, and pay by cash on collection. Orders are split per vendor; each stall sees its own queue, and we have one central board for the whole event.”

---

## 6. Troubleshooting

- **Blank or loading:** Ensure both frontend (3000) and backend (3001) are running (`npm run dev`).
- **Orders not updating:** Refresh the Central or Vendor tab; WebSocket may need a reload.
- **No vendors/menus:** Backend uses in-memory data; restart the server if it was stopped.

---

**Quick link for live demo:**  
**http://localhost:3000/?view=demo**
