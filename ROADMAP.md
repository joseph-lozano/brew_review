# Brew Review - Implementation Roadmap

## Tech Stack

- **Frontend:** React + TypeScript + TanStack Start
- **Backend:** TanStack Start (server functions)
- **Database:** SQLite + Drizzle ORM
- **Voice AI:** Retell AI (web calls)

---

## Progress

### Completed

- [x] **Database Schema**
  - Products table (coffee beans & equipment)
  - Orders table
  - Order items (join table)
  - Reviews table (flexible JSON for Retell analysis data)

- [x] **Seed Script**
  - 6 coffee products (Ethiopian, Colombian, Sumatra, blends)
  - 3 equipment items (grinder, French press, kettle)
  - Run with `npm run db:seed`

- [x] **Product Catalog Page**
  - Server-side data loading
  - Coffee beans section with roast/origin tags
  - Equipment section
  - Product cards with pricing

- [x] **App Shell**
  - Header with Brew Review branding
  - Navigation (Products, Orders)
  - Amber/coffee themed styling

- [x] **Mock Order System**
  - "Add to Cart" functionality
  - Cart state management
  - Checkout flow (creates fake order)
  - Order confirmation

- [x] **Orders Page**
  - List past orders
  - Order details (items, total, date)
  - "Leave Review" button links to review page

- [x] **Retell Integration**
  - Server function to create web calls (`src/integrations/retell/create-web-call.ts`)
  - Installed `retell-client-js-sdk`
  - Voice agent configured in Retell dashboard (see `docs/retell-agent-setup.md`)

- [x] **Review Collection UI**
  - `/review/$orderId` page
  - Start/end call buttons
  - Call status display (idle, connecting, connected, ended, error)
  - Agent speaking indicator
  - Real-time transcript display with chat-style UI

---

### To Do

- [ ] **Webhook Handler**
  - `POST /api/webhooks/retell` endpoint
  - Handle `call_ended` event (store transcript)
  - Handle `call_analyzed` event (store review data)
  - Link review to order

- [ ] **Reviews Display**
  - Show reviews on product pages
  - Display extracted data (ratings, comments, etc.)
  - Average ratings per product
