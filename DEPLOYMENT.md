# Deploy your app and get a QR code for customers

You’ll do three things: **get a domain**, **deploy the app**, then **use the built-in QR page** (or generate a PNG) so customers can scan and use the app.

---

## 1. Get a domain (you do this)

You need a **domain name** (e.g. `order.myevent.com` or `myevent-order.com`).

- **Free subdomain (easiest):** Don’t buy a domain yet. Deploy first; you’ll get a URL like `https://event-ordering.onrender.com` or `https://yourapp.up.railway.app`. You can use that for the QR and add a custom domain later.
- **Custom domain:** Register at [Cloudflare](https://www.cloudflare.com/products/registrar/), [Namecheap](https://www.namecheap.com/), [Google Domains](https://domains.google/), or similar. Then point it at your deployed app (see step 4).

---

## 2. Deploy the app (pick one)

### Option A: Render.com (free tier)

1. Push your code to **GitHub** (create a repo and push).
2. Go to [render.com](https://render.com) → Sign up / Log in.
3. **New** → **Web Service**.
4. Connect your GitHub repo.
5. Settings:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm run start:prod`
   - **Environment:** Add variable `NODE_ENV` = `production`.
6. Deploy. Your app will be at **https://&lt;your-service-name&gt;.onrender.com**.
7. In **Environment**, add **`PUBLIC_URL`** = `https://<your-service-name>.onrender.com` (your real URL). This makes the **QR code** and links use the correct domain.

You can use the included **render.yaml** (in the repo) so Render picks these settings automatically when you connect the repo.

### Option B: Railway

1. Push your code to **GitHub**.
2. Go to [railway.app](https://railway.app) → **Start a New Project** → **Deploy from GitHub**.
3. Select your repo. Railway will detect the Dockerfile or Node app.
4. If no Dockerfile: set **Build Command** = `npm install && npm run build`, **Start Command** = `npm run start:prod`, **Root Directory** = `/`.
5. Deploy. You’ll get a URL like **https://&lt;project&gt;.up.railway.app**.
6. In **Variables**, add **`PUBLIC_URL`** = that URL (e.g. `https://event-ordering.up.railway.app`).

### Option C: Fly.io, Heroku, or any Node host

- Use the **Dockerfile** in the repo, or set:
  - **Build:** `npm install && npm run build`
  - **Start:** `NODE_ENV=production node server/index.js`
- Set **`PORT`** to what the host provides (e.g. `8080`).
- Set **`PUBLIC_URL`** to your final app URL (e.g. `https://your-domain.com`).

---

## 3. Attach your custom domain (optional)

- **Render:** Dashboard → your service → **Settings** → **Custom Domains** → add your domain and follow the CNAME/A record instructions.
- **Railway:** **Settings** → **Domains** → **Custom Domain** → add your domain and point DNS as shown.
- After DNS propagates, set **`PUBLIC_URL`** to your custom URL (e.g. `https://order.myevent.com`).

---

## 4. QR code for customers to scan

Your app already has a **QR code page** and an **image endpoint**. After the app is live at a URL (e.g. `https://event-order.onrender.com` or `https://order.myevent.com`):

### Option 1: Use the in-app page (easiest)

1. Open **https://YOUR_DOMAIN/?view=qr** in a browser.
2. The page shows the QR that points to **https://YOUR_DOMAIN/** (unified chatbot).
3. Click **“Download QR code”** to save `order-from-all-vendors.png` and print or share it.
4. Or share the link **https://YOUR_DOMAIN/api/qr** – it opens the same QR as an image (e.g. for social or email).

### Option 2: Generate a PNG file locally

After you know your live URL:

```bash
npm run qr -- https://your-domain.com
# or: node scripts/generate-qr.js https://your-domain.com
```

This creates **qr-order.png** in the project root. Upload it to your site, print it, or share it. The QR encodes **https://your-domain.com/** so scanning opens the unified chatbot.

---

## 5. Summary

| Step | What you do |
|------|-------------|
| 1 | Get a domain (or use the free URL from Render/Railway). |
| 2 | Deploy the app (e.g. Render or Railway) and set `PUBLIC_URL` to your live URL. |
| 3 | (Optional) Attach a custom domain and set `PUBLIC_URL` to that URL. |
| 4 | Open **https://YOUR_DOMAIN/?view=qr** → download or share the QR, or run `node scripts/generate-qr.js https://YOUR_DOMAIN` to get **qr-order.png**. |

Customers scan the QR → they open your app → unified chatbot (all vendors, one cart, pay on collection).

---

**I can’t create the domain or push the app for you** (that needs your accounts and sometimes payment). Use this guide to deploy, then use the app’s QR page or the script to get the QR for users to scan.
