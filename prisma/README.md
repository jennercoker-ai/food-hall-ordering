# Prisma Schema

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

- **OrderStatus:** `PENDING` | `PAID` | `COMPLETED` | `CANCELLED`
- **OrderType:** `DINE_IN` | `DELIVERY`
- **ItemStatus:** `RECEIVED` | `PREPARING` | `READY` | `COLLECTED`

## Models

### Vendor
- `id` (cuid) – Primary key
- `name` – Vendor name
- `cuisine` – Type of cuisine
- `imageUrl` – Optional image
- Relations: `menuItems`, `orderItems`, `orders`

### MenuItem
- `id` (cuid) – Primary key
- `name`, `price`, `category`, `description`
- `region` – Optional regional classification
- `allergens` – Array of allergen strings
- `dietary` – Array of dietary tags (vegan, vegetarian, etc.)
- `isVegan`, `available` – Boolean flags
- `vendorId` – FK to Vendor
- Relations: `vendor`, `orderItems`

### Session
- `id` (cuid) – Primary key
- `vendorId`, `location` – Optional context
- `cart` (JSON) – In-progress cart items
- `createdAt`

### Order
- `id` (cuid) – Primary key
- `orderNumber` – Display number (e.g., 101-999)
- `orderType` – DINE_IN or DELIVERY
- `status` – OrderStatus enum
- `totalAmount`, `deliveryFee`
- `paymentId` – Stripe/Apple Pay reference
- `groupId` – For collaborative ordering sessions
- `deliveryAddress`, `customerPhone`, `specialInstructions`
- `vendorId` – FK to Vendor (for single-vendor orders)
- `createdAt`, `updatedAt`
- Relations: `vendor`, `items`

### OrderItem
- `id` (cuid) – Primary key
- `orderId` – FK to Order (cascade delete)
- `menuItemId` – FK to MenuItem
- `vendorId` – FK to Vendor
- `quantity`, `price`
- `guestName` – For collaborative orders
- `status` – ItemStatus enum (tracks individual item progress)
- Relations: `order`, `menuItem`, `vendor`

## Key Features

- **Multi-vendor support:** Orders can span multiple vendors; each OrderItem links to its specific vendor
- **Collaborative ordering:** `groupId` on Order and `guestName` on OrderItem track who ordered what
- **Individual item tracking:** Each OrderItem has its own status (e.g., pizza ready, tacos still cooking)
- **Payment integration:** `paymentId` stores Stripe/Apple Pay references
