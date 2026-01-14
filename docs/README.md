# Brew Review - Demo Application

A demo application for testing the Retell AI voice AI product. This application simulates a product review collection system for a coffee business.

## Overview

**Brew Review** is a fictional coffee company that sells:
- Coffee beans (various origins, roasts, and blends)
- Coffee accessories (grinders, brewing equipment, etc.)

This demo application demonstrates how Retell AI's voice AI can be used to collect product reviews from customers via browser-based web calls.

## How It Works

1. **Customer makes a purchase** - A customer buys coffee beans or accessories
2. **Review prompt** - Customer clicks "Leave a Review" on their order (manually triggered in this demo)
3. **Web call initiated** - Backend calls Retell AI's `POST /v2/create-web-call` API to get an access token
4. **Voice conversation** - Customer speaks with the AI agent directly in their browser (no phone needed)
5. **Webhooks received** - Retell sends `call_ended` and `call_analyzed` events with transcript and extracted data
6. **Review captured** - The AI agent gathers feedback including:
   - Overall satisfaction rating
   - Product quality feedback
   - Specific comments about taste, aroma, freshness (for coffee)
   - Likelihood to recommend
   - Any issues or suggestions

## Why Web Calls?

This demo uses **web calls** instead of phone calls because:
- No phone number purchase required
- No KYC verification needed
- Simpler setup for demonstrations
- Works directly in the browser

## Prerequisites

To run this demo, you need:
1. **Retell AI API Key** - Get from the [Retell dashboard](https://dashboard.retellai.com)
2. **Voice Agent** - Create in dashboard with your review collection prompt
3. **Webhook Endpoint** (optional) - To receive call results server-side

## Demo Purpose

This is a **demonstration application** designed to showcase Retell AI's voice AI capabilities in a retail context. The trigger for initiating calls is manual rather than automated, allowing for controlled testing and demonstrations.

## Documentation

- [Product Catalog](./product-catalog.md) - List of products available in the demo
- [Voice AI Integration](./voice-ai-integration.md) - How the Retell AI integration works (API reference, Web SDK, webhooks)
