# Redeploy

**Latest fixes:** Vendor dashboard, KDS, and central order board now resolve demo vendor ids (e.g. `vendor-001`) to Prisma vendor ids so orders show when using demo hub links. KDS order-items uses the same resolution. Build verified with `npm run build`.

## Option A: Push to GitHub (if connected to Railway)

1. Commit and push your changes:
   ```bash
   git add -A
   git commit -m "Fix vendor dashboard, SMS, production release"
   git push origin main
   ```
2. Railway will auto-deploy from the new commit. Check the **Deployments** tab for status.

## Option B: Redeploy from Railway dashboard

1. Open [Railway](https://railway.app) → your project → the **event-ordering-system** service.
2. Go to **Deployments**.
3. Click **Redeploy** on the latest deployment (or trigger a new deploy from the **Settings** → **Source** connection).

## Option C: Deploy from this folder with Railway CLI

1. Install CLI: `npm i -g @railway/cli`
2. Log in: `railway login`
3. Link and deploy:
   ```bash
   cd "/Users/jenner.coker/Downloads/event-ordering-system 2"
   railway link   # pick your project/service if needed
   railway up
   ```

## After deploy

- **Health:** Open `https://your-app.up.railway.app/api/health` — should return `{"status":"ok"}`.
- **Vendor dashboard:** Place a test order (dine-in, family, or pickup), then open the vendor dashboard for that vendor — orders should appear.
- **KDS:** Open `/?view=kds`, select the same vendor — order items should appear.

If the app was already connected to GitHub, **Option A** is usually enough: push and wait for Railway to build and deploy.
