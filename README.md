# Brew Review

A demo application for testing Retell AI's voice AI product. Simulates a product review collection system for a coffee business.

## Overview

**Brew Review** is a fictional coffee company that sells:
- Coffee beans (various origins, roasts, and blends)
- Coffee accessories (grinders, brewing equipment, etc.)

This demo demonstrates how Retell AI's voice AI can collect product reviews from customers via browser-based web calls.

## How It Works

1. **Customer makes a purchase** - Buys coffee beans or accessories
2. **Review prompt** - Customer clicks "Leave a Review" on their order
3. **Web call initiated** - Backend calls Retell AI's `POST /v2/create-web-call` API
4. **Voice conversation** - Customer speaks with the AI agent in their browser (no phone needed)
5. **Webhooks received** - Retell sends `call_ended` and `call_analyzed` events
6. **Review captured** - AI gathers feedback: ratings, quality, taste notes, recommendations, issues

## Why Web Calls?

- No phone number purchase required
- No KYC verification needed
- Simpler setup for demonstrations
- Works directly in the browser

## Getting Started

### Prerequisites

1. **Retell AI API Key** - Get from the [Retell dashboard](https://dashboard.retellai.com)
2. **Voice Agent** - Create in dashboard with your review collection prompt

### Setup

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and RETELL_API_KEY

# Initialize database
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

The app will be available at http://localhost:3000

### Scripts

```bash
bun run dev          # Start dev server
bun run build        # Production build
bun run check        # Run all checks (typecheck + lint + format)
bun run test         # Run tests
```

## Tech Stack

- **Runtime:** Bun
- **Framework:** TanStack Start (React + Vite)
- **Database:** SQLite + Drizzle ORM
- **Styling:** Tailwind CSS v4
- **Voice AI:** Retell AI (web calls)

## Documentation

- [Voice AI Integration](./docs/voice-ai-integration.md) - API reference, Web SDK, webhooks
- [Product Catalog](./docs/product-catalog.md) - Products available in the demo
- [Roadmap](./ROADMAP.md) - Implementation progress
