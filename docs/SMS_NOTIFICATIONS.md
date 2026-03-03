# Text (SMS) notifications

Customers get SMS when orders are ready for collection or when a delivery is dispatched/delivered. The app uses **Twilio** to send messages.

---

## When SMS is sent

| Event | Message |
|--------|--------|
| **Order received** | Order #X received at [Vendor]. We're processing your order… |
| **Single item ready (KDS)** | Your [item] from [Vendor] is ready! Collect at [Station]. (1/3 items ready) |
| **All items ready (KDS)** | All X items from Order #Y are ready! Please collect from the vendors. |
| **Vendor marks order ready** | Your items from [Vendor] are ready! Collect at [Station]. |
| **Delivery dispatched** | Your order (DH-XXXX) is on its way! Delivery to [address]. |
| **Delivery delivered** | Your order (DH-XXXX) has been delivered. Thank you! |

SMS is only sent when the order has a **customer phone number** (collected at checkout).

---

## Setup (Twilio)

1. **Sign up:** [twilio.com/try-twilio](https://www.twilio.com/try-twilio)  
   - Free trial includes a small SMS balance.

2. **Get credentials (Dashboard):**
   - **Account SID** and **Auth Token** (Account → API keys).
   - **Phone number:** Phone Numbers → Buy a number (required as sender; trial can use a Twilio number).

3. **Set environment variables:**

   | Variable | Example | Description |
   |----------|---------|-------------|
   | `TWILIO_ACCOUNT_SID` | `ACxxxxxxxx...` | From Twilio Console |
   | `TWILIO_AUTH_TOKEN` | `xxxxxxxx...` | From Twilio Console |
   | `TWILIO_PHONE_NUMBER` | `+441234567890` | Your Twilio number (E.164) |

   - **Local:** add to `.env` (copy from `.env.example`).
   - **Production (e.g. Railway):** Project → your service → Variables → add the three above.

4. **Restart the server** so it picks up the new env vars.  
   On startup you should see: `✅ Twilio SMS enabled`.  
   If not set: `ℹ️  Twilio not configured - SMS will be logged to console` (messages are only logged, not sent).

---

## Phone number format

- The server normalises UK numbers: if the customer enters `07xxx` or `7xxx`, it sends as `+44 7xxx...`.
- For other countries, customers should enter numbers with country code (e.g. `+1...`, `+44...`) if you need international delivery.

---

## Trial / verification (Twilio trial accounts)

- Trial accounts can only send SMS to **verified** numbers (Twilio Console → Phone Numbers → Manage → Verified Caller IDs).
- To send to any number, upgrade the Twilio account or remove trial restrictions.

---

## Troubleshooting

- **No SMS received:** Check server logs for `✅ SMS sent` or `❌ Failed to send`. If Twilio returns an error, the log shows it.
- **"Twilio not configured":** Ensure all three env vars are set and the server was restarted.
- **Customer didn’t get “ready” SMS:** Orders must have `customerPhone` at checkout; KDS/vendor must mark items as READY (or mark order ready) so the server sends the “ready” and “all ready” messages.
