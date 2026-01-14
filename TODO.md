# TODO - Human Setup Tasks

## Retell AI Webhook Setup

### 1. Register Webhook URL

**Option A: Account-level webhook (Recommended)**

1. Go to **Retell Dashboard** → **Webhooks tab**
2. Enter your webhook URL: `https://your-domain.com/api/webhooks/retell`

**Option B: Agent-level webhook**

1. When creating/updating your agent via API, set the `webhook_url` field
2. Agent-level webhooks override account-level webhooks for that specific agent

### 2. Configure Post-Call Analysis

Go to **Retell Dashboard** → **Post-Call Analysis** tab and create these custom analysis fields:

| Name                     | Type    | Description                                                            |
| ------------------------ | ------- | ---------------------------------------------------------------------- |
| `overall_rating`         | Number  | "Extract the customer's overall satisfaction rating on a scale of 1-5" |
| `product_quality_rating` | Number  | "Quality rating from 1-5"                                              |
| `freshness_rating`       | Number  | "Freshness rating from 1-5"                                            |
| `taste_notes`            | Text    | "Extract flavor descriptions and tasting notes mentioned"              |
| `would_recommend`        | Boolean | "Would the customer recommend this product?"                           |
| `would_repurchase`       | Boolean | "Would the customer buy again?"                                        |
| `issues_reported`        | Text    | "Any problems or complaints mentioned"                                 |
| `suggestions`            | Text    | "Customer suggestions for improvement"                                 |

### 3. Local Development with tunnelto

```bash
# Install tunnelto (one-time)
curl -sL https://tunnelto.dev/install.sh | sh
# Or: brew install agrinman/tap/tunnelto

# Terminal 1: Start your app
bun run dev

# Terminal 2: Expose localhost via tunnelto
tunnelto --port 3000
```

Copy the tunnelto URL (e.g., `https://abc123.tunnelto.dev`) and add `/api/webhooks/retell` to it, then paste into Retell Dashboard webhooks tab.

You can also use a custom subdomain:

```bash
tunnelto --port 3000 --subdomain brewreview
# => https://brewreview.tunnelto.dev
```

---

## Webhook Events Reference

The app handles these webhook events automatically:

- **`call_started`** - When call begins
- **`call_ended`** - When call ends (includes transcript, timestamps, metadata)
- **`call_analyzed`** - When post-call analysis is complete (includes ratings, notes, etc.)

### Payload Examples

**`call_ended` event:**

```json
{
  "event": "call_ended",
  "call": {
    "call_id": "...",
    "transcript": "Agent: Hi...\nUser: ...",
    "metadata": { "order_id": "123" },
    "disconnection_reason": "agent_hangup"
  }
}
```

**`call_analyzed` event:**

```json
{
  "event": "call_analyzed",
  "call": {
    "call_id": "...",
    "call_analysis": {
      "call_summary": "...",
      "call_successful": true,
      "custom_analysis_data": {
        "overall_rating": 5,
        "taste_notes": "Bright and fruity",
        "would_recommend": true
      }
    }
  }
}
```

---

## Optional: Production Hardening

### Verify Webhook Signature

Retell sends an `x-retell-signature` header. Verify with:

```typescript
import { Retell } from "retell-sdk";

Retell.verify(
  JSON.stringify(req.body),
  process.env.RETELL_API_KEY,
  req.headers["x-retell-signature"]
);
```

### Allowlist Retell IP

For additional security, allowlist Retell's IP: `100.20.5.228`
