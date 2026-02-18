# Prisma schema

PostgreSQL is used for vendors, menu items, sessions, and orders.

## Setup

1. Set `DATABASE_URL` in `.env` (see `.env.example`), e.g.  
   `DATABASE_URL="postgresql://user:password@localhost:5432/event_ordering?schema=public"`
2. Install dependencies: `npm install` (runs `prisma generate`).
3. Create/sync the database:
   - **Development:** `npm run db:push` (no migration history)
   - **Production:** `npm run db:migrate` (creates migration files)
4. Seed vendors and menu items: `npx prisma db seed` (requires `DATABASE_URL` and step 3 done first).

## Scripts

- `npm run db:generate` – generate Prisma Client
- `npm run db:push` – push schema to DB (dev)
- `npm run db:migrate` – create and run migrations

## Enums

- **OrderType:** `DINE_IN` | `DELIVERY`
- **ItemStatus:** `RECEIVED` | `PREPARING` | `IN_TRANSIT` | `READY_AT_HUB` | `COLLECTED`

## Models

- **Vendor** – id, name, cuisine, imageUrl, menu items
- **MenuItem** – id, name, price, category, region, allergens, isVegan, vendorId
- **Session** – id, vendorId?, location?, cart (JSON), for in-progress carts
- **Order** – id, orderNumber, orderType, status, totalAmount, deliveryAddress, deliveryFee, customerPhone, specialInstructions, vendorId, items, createdAt, updatedAt
- **OrderItem** – id, orderId, name, price, quantity, vendorName, vendorId, guestName, status (ItemStatus)
