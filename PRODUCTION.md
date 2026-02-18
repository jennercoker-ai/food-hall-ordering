# Production build and test

Single-server production setup: one port serves the React app, API, and WebSocket.

---

## Quick: build and run locally (production mode)

```bash
npm install
npm run prod
```

Then open:

- **App:** http://localhost:3000  
- **Demo hub:** http://localhost:3000/?view=demo  
- **API health:** http://localhost:3000/api/health  

Port defaults to **3000** in production. Override with `PORT=8080 npm run start:prod`.

---

## Step-by-step

### 1. Build the frontend

```bash
npm run build
```

Uses `.env.production` so the app talks to the same origin (`/api`, no separate API URL). Output is in `dist/`.

### 2. Run the server in production mode

```bash
NODE_ENV=production node server/index.js
```

Or:

```bash
npm run start:prod
```

The server:

- Serves static files from `dist/`
- Serves the API under `/api`
- Serves WebSocket on the same host (ws:// or wss://)
- Listens on `PORT` (default **3000**)

### 3. Test the live app

1. Open **http://localhost:3000** (or your `PORT`).
2. Open **http://localhost:3000/?view=demo** and use the demo links.
3. Place an order (customer) → check Central board and a vendor dashboard.
4. Optional: `curl http://localhost:3000/api/health` → `{"status":"ok",...}`.

---

## Environment variables (production)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Set to `production` | Enables static serving and default port 3000 |
| `PORT` | No (default 3000) | Server port |
| `DATABASE_URL` | Optional | For Prisma / `POST /api/handoff` |
| `TWILIO_*` | Optional | For SMS notifications |
| `VITE_API_URL` | No | Set in `.env.production` to empty for same-origin |

---

## Deploying (e.g. Railway, Render, Fly.io)

1. Set **NODE_ENV=production**.
2. Set **PORT** to the platform’s port (often from `process.env.PORT`).
3. Build: run **npm run build** in the build step.
4. Start: run **npm run start:prod** (or `node server/index.js` with `NODE_ENV=production`).
5. Ensure the platform allows **WebSocket** on the same host/port.

Example (Railway/Render):

- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`

---

## Production vs development

| | Development | Production |
|--|-------------|------------|
| Command | `npm run dev` | `npm run prod` (or build + start:prod) |
| Frontend | Vite dev server (port 3000) | Served from Express (`dist/`) |
| Backend | Express (port 3001) | Same server (port 3000) |
| API base | http://localhost:3001 | Same origin (relative `/api`) |
| WebSocket | ws://localhost:3001 | Same origin (ws:// or wss://) |

---

## Test checklist

- [ ] `npm run prod` starts without errors.
- [ ] http://localhost:3000 loads the app.
- [ ] http://localhost:3000/?view=demo shows the demo hub.
- [ ] Chat and Browse Vendors work; add to cart and place order.
- [ ] http://localhost:3000/?view=central shows the central board and updates.
- [ ] http://localhost:3000/?view=vendor&vendor=vendor-001 shows vendor orders; status updates work.
- [ ] Order confirmation page shows and updates status.
- [ ] `GET /api/health` returns 200 and `{"status":"ok"}`.
