# Voice AI Integration

How Brew Review integrates with Retell AI's voice AI product to collect product reviews.

## Overview

Retell AI provides an automated voice agent that conducts natural conversations to gather feedback about purchased products. This demo uses **web calls** (browser-based) instead of phone calls, which simplifies setup by eliminating the need for phone numbers and KYC verification.

## Integration Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Brew Review   │     │    Retell AI    │     │    Customer     │
│    Backend      │     │                 │     │    Browser      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. POST /v2/create-  │                       │
         │     web-call          │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │  2. Return access_token                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  3. Pass token to frontend                    │
         │─────────────────────────────────────────────->│
         │                       │                       │
         │                       │  4. startCall()       │
         │                       │<──────────────────────│
         │                       │                       │
         │                       │  5. Voice conversation│
         │                       │<─────────────────────>│
         │                       │                       │
         │  6. Webhook: call_ended                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  7. Webhook: call_analyzed                    │
         │<──────────────────────│                       │
         │                       │                       │
```

## Prerequisites

To use Retell AI web calls, you need:

1. **Retell AI API Key** - Get from the Retell dashboard
2. **Voice Agent** - Create in dashboard with a Response Engine (prompt)
3. **Webhook Endpoint** (optional) - To receive call results

No phone number or KYC verification required for web calls.

---

## Retell AI API Reference

Base URL: `https://api.retellai.com`

Authentication: Bearer token in Authorization header
```
Authorization: Bearer YOUR_API_KEY
```

### Create Web Call

Initiates a web call session. Returns an access token to start the call in the browser.

**Endpoint:** `POST /v2/create-web-call`

**Request Body:**

```json
{
  "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
  "metadata": {
    "order_id": "ORD-12345",
    "customer_id": "CUST-789"
  },
  "retell_llm_dynamic_variables": {
    "customer_name": "John Doe",
    "product_name": "Ethiopian Yirgacheffe",
    "order_date": "January 7, 2026"
  }
}
```

**Key Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `agent_id` | Yes | ID of the voice agent to use |
| `metadata` | No | Custom data stored with the call (e.g., order_id) |
| `retell_llm_dynamic_variables` | No | Variables injected into agent prompt |

**Response (201 Created):**

```json
{
  "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
  "call_type": "web_call",
  "call_status": "registered",
  "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
  "access_token": "eyJhbGciOiJIUzI1NiJ9.eyJ2aWRlbyI6eyJyb29tSm9p..."
}
```

**Important:** The `access_token` must be used within 30 seconds or it expires.

---

## Frontend Web SDK

Install the Retell Web SDK to connect to calls from the browser.

### Installation

```bash
npm install retell-client-js-sdk
```

### Basic Usage

```javascript
import { RetellWebClient } from "retell-client-js-sdk";

const retellWebClient = new RetellWebClient();

// Start a call (after getting access_token from your backend)
async function startReviewCall(accessToken) {
  await retellWebClient.startCall({
    accessToken: accessToken,
    sampleRate: 24000, // Optional: audio sample rate
  });
}

// Stop the call
function endCall() {
  retellWebClient.stopCall();
}
```

### Event Listeners

```javascript
// Call lifecycle events
retellWebClient.on("call_started", () => {
  console.log("Call started");
});

retellWebClient.on("call_ended", () => {
  console.log("Call ended");
});

// Agent speaking state (useful for UI animations)
retellWebClient.on("agent_start_talking", () => {
  console.log("Agent is speaking");
});

retellWebClient.on("agent_stop_talking", () => {
  console.log("Agent stopped speaking");
});

// Real-time transcript updates
retellWebClient.on("update", (update) => {
  console.log("Transcript:", update.transcript);
});

// Error handling
retellWebClient.on("error", (error) => {
  console.error("Call error:", error);
  retellWebClient.stopCall();
});
```

---

## Agent Configuration

The voice agent should be pre-configured in the Retell dashboard with:

**Voice Settings:**
- `voice_id`: Select a friendly, professional voice (e.g., `11labs-Adrian`)
- `voice_speed`: 1.0 (normal speed)
- `language`: `en-US`

**Behavior Settings:**
- `enable_backchannel`: true (natural "uh-huh", "yeah" responses)
- `interruption_sensitivity`: 0.7 (allow customer to interject)
- `responsiveness`: 0.8 (balanced response timing)

**Call Settings:**
- `max_call_duration_ms`: 300000 (5 minute max)
- `end_call_after_silence_ms`: 30000 (end after 30s silence)

---

## Webhooks

Configure webhooks to receive call events. Retell will POST to your endpoint.

### Webhook Events

| Event | Description |
|-------|-------------|
| `call_started` | Call connected with customer |
| `call_ended` | Call completed (includes transcript) |
| `call_analyzed` | Post-call analysis complete (includes extracted data) |

### Webhook Payload Example

**call_ended event:**

```json
{
  "event": "call_ended",
  "call": {
    "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
    "call_type": "web_call",
    "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
    "call_status": "ended",
    "start_timestamp": 1704812400000,
    "end_timestamp": 1704812580000,
    "duration_ms": 180000,
    "disconnection_reason": "agent_hangup",
    "transcript": "Agent: Hi, this is Sarah from Brew Review...",
    "transcript_object": [...],
    "metadata": {
      "order_id": "ORD-12345",
      "customer_id": "CUST-789"
    },
    "retell_llm_dynamic_variables": {
      "customer_name": "John Doe",
      "product_name": "Ethiopian Yirgacheffe"
    }
  }
}
```

**call_analyzed event:**

```json
{
  "event": "call_analyzed",
  "call": {
    "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
    "call_analysis": {
      "call_successful": true,
      "call_summary": "Customer provided positive feedback on Ethiopian Yirgacheffe...",
      "custom_analysis_data": {
        "overall_rating": 5,
        "would_recommend": true,
        "taste_notes": "Bright, fruity with blueberry notes",
        "freshness_rating": 5,
        "issues_reported": null
      }
    }
  }
}
```

### Disconnection Reasons

| Reason | Description |
|--------|-------------|
| `user_hangup` | Customer ended the call |
| `agent_hangup` | Agent completed the call naturally |
| `inactivity` | No activity timeout |
| `max_duration_reached` | Call hit time limit |
| `error_user_not_joined` | User didn't connect within 30s |

---

## Post-Call Analysis Configuration

Configure these fields in the Retell dashboard to extract review data:

### Custom Analysis Fields

| Name | Type | Description |
|------|------|-------------|
| `overall_rating` | Number | Overall satisfaction score (1-5) |
| `product_quality_rating` | Number | Quality rating (1-5) |
| `freshness_rating` | Number | Perceived freshness on arrival (1-5) |
| `taste_notes` | String | Customer's flavor impressions and tasting notes |
| `would_recommend` | Boolean | Whether customer would recommend to others |
| `would_repurchase` | Boolean | Whether customer intends to buy again |
| `issues_reported` | String | Any problems or complaints mentioned |
| `suggestions` | String | Customer suggestions for improvement |

### Analysis Field Configuration Examples

**Number field (overall_rating):**
```json
{
  "type": "number",
  "name": "overall_rating",
  "description": "Extract the customer's overall satisfaction rating on a scale of 1-5, where 1 is very dissatisfied and 5 is very satisfied."
}
```

**Boolean field (would_recommend):**
```json
{
  "type": "boolean",
  "name": "would_recommend",
  "description": "Did the customer indicate they would recommend this product to friends or family? True if yes, false if no or not mentioned."
}
```

**String field (taste_notes):**
```json
{
  "type": "string",
  "name": "taste_notes",
  "description": "Extract any flavor descriptions, tasting notes, or sensory impressions the customer mentioned about the coffee.",
  "examples": [
    "Bright and fruity with blueberry notes",
    "Rich and chocolatey with low acidity",
    "Smooth with hints of caramel"
  ]
}
```

**Enum/Selector field (issue_category):**
```json
{
  "type": "enum",
  "name": "issue_category",
  "description": "Categorize the main issue reported by the customer, if any. Select 'none' if no issues were reported.",
  "choices": ["none", "shipping_damage", "taste_quality", "freshness", "packaging", "wrong_item", "other"]
}
```

---

## Demo Flow

For this demo application:

1. User clicks "Leave a Review" button on an order
2. Frontend requests access token from backend
3. Backend calls `POST /v2/create-web-call` with order context
4. Frontend starts call with `retellWebClient.startCall()`
5. Voice agent conducts review conversation
6. User or agent ends call
7. Webhooks deliver transcript and analyzed review data
8. Review is stored and displayed

---

## Response Handling

After the call completes, Brew Review receives structured review data via webhooks that can be used for:
- Product improvement insights
- Customer satisfaction tracking
- Display on product pages (with permission)
- Quality assurance monitoring

### Suggested Webhook Handler Flow

1. **On `call_ended`**: Store transcript and basic call metadata
2. **On `call_analyzed`**: Extract and store review data from `custom_analysis_data`
3. Link review to original order using `metadata.order_id`
4. Update product ratings and review counts
