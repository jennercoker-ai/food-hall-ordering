# Food Hall Event Ordering System — Deployment & Demo Guide

---

## 🚀 Quick Start (local, same device only)

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:3001  
- **Demo hub:** http://localhost:3000/?view=demo

> ⚠️ Local mode means QR codes only work on **this machine**. Follow the "Go Live" section below to share with real guests.

---

## 🌍 Go Live — Deploy to the Internet (free in < 10 min)

Guests need a **public URL** to scan QR codes from their phones. The easiest option is Railway.

### Option A — Railway (recommended, free hobby plan)

1. **Push to GitHub**
   ```bash
   cd "event-ordering-system 2"
   git init && git add -A && git commit -m "initial commit"
   gh repo create food-hall --public --push   # or push manually
   ```

2. **Create a Railway project**
   - Go to https://railway.app → **New Project** → **Deploy from GitHub Repo**
   - Select your repo — Railway auto-detects `railway.toml`

3. **Add environment variables** (Railway dashboard → Variables tab)

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon/Supabase PostgreSQL URL |
   | `PUBLIC_URL` | The Railway URL Railway assigns (e.g. `https://food-hall-abc123.railway.app`) |
   | `NODE_ENV` | `production` |
   | `KDS_SECRET` | Any secret string for kitchen staff |

4. **Railway builds and deploys automatically.** You'll get a URL like:  
   `https://food-hall-abc123.railway.app`

5. **Seed the database** (first deploy only):
   ```bash
   DATABASE_URL="<your-url>" npx tsx prisma/seed.ts
   ```

---

### Option B — Render (free tier, 512 MB)

1. Push to GitHub (same as above)
2. Go to https://render.com → **New → Web Service** → Connect repo
3. Render auto-detects `render.yaml`
4. Add `DATABASE_URL` and `PUBLIC_URL` in Environment Variables
5. Your URL: `https://food-hall-ordering.onrender.com`

> **Note:** Render's free tier spins down after 15 min inactivity (cold start ~30s). Upgrade to "Starter" ($7/mo) to keep it always-on for events.

---

### Option C — Run a production build locally (same-network only)

Good for events where your laptop acts as the server and all guests are on the same Wi-Fi:

```bash
npm run build             # compile the frontend
npm run start:prod        # serve everything on port 3000
```

Find your local IP:
```bash
ipconfig getifaddr en0    # macOS Wi-Fi IP
```

Your URL is `http://192.168.x.x:3000` — paste that into the QR code page.

---

## 📲 Fix QR Codes (the important bit)

After deploying, open **`/qr`** on your live app:

```
https://your-app.railway.app/?view=qr
```

You'll see a **"App Public URL"** field — paste your live URL there, click **Apply**.  
The QR code instantly regenerates pointing to your real domain.  
Hit **⬇️ Download PNG** to save and print it.

That QR code will work from any phone, anywhere.

---

## 🗂️ URL map (replace the domain with your live URL)

| Role | URL |
|---|---|
| **Customer ordering** | `https://your-app.com/` |
| **AI Concierge (FAB)** | `https://your-app.com/` ← floating button bottom-right |
| **Group / Family order** | `https://your-app.com/?view=family` |
| **QR code generator** | `https://your-app.com/?view=qr` |
| **Central order board** | `https://your-app.com/?view=central` |
| **Kitchen Display (KDS)** | `https://your-app.com/?view=kds` |
| **Demo hub** | `https://your-app.com/?view=demo` |
| **Health check** | `https://your-app.com/api/health` |

---

## 🎬 Demo script (2–3 minutes)

1. **Customer flow**
   - Open the root URL — or hand a guest their phone and let them scan the QR.
   - In chat: _"Show me the menu"_ or _"Vegan options"_.
   - Or use **Browse Vendors** → pick a vendor → add items.
   - Add items from **two different vendors** (e.g. pizza + tacos).
   - Open **Cart** → enter a phone number → **Place order**.
   - Redirected to live order confirmation.

2. **Group order demo**
   - Open `/?view=family` → **Start group session** (Host role).
   - Share the group link with another browser/device → they join as a guest.
   - Both users add items — the shared cart updates live.
   - Host locks the cart and pays as one combined order.

3. **Kitchen Display System**
   - Open `/?view=kds` → select a vendor.
   - Accept the incoming order → **Start Preparing** → **Mark Ready**.
   - The customer tab updates in real time via SSE.

4. **Central board**
   - Open `/?view=central` in a new tab.
   - Orders appear in real time; filter by Active / Ready / Completed.

---

## 🔧 Troubleshooting

| Symptom | Fix |
|---|---|
| QR code opens `localhost` | Enter your public URL in the QR page and click Apply |
| Blank page after deploy | Check `dist/` was built: `npm run build` logs |
| Orders disappear on restart | Backend is in-memory by default — connect `DATABASE_URL` for persistence |
| Prisma errors on start | Run `npx prisma generate` then `npx prisma db push` |
| Port already in use | `lsof -ti:3000,3001 \| xargs kill -9` |
| SSE not updating | Some proxies buffer SSE — add `X-Accel-Buffering: no` header (Nginx users) |

---

## 🗣️ One-liner for your audience

> "Guests scan one QR code, chat with our AI concierge or browse all vendors, add items to one cart, and pay by card or cash on collection. Orders are split per vendor; each stall sees its own kitchen queue in real time, and there's one central board for the whole event."
