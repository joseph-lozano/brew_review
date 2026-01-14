import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { orderItems, reviews } from "../../../db/schema";

// Retell webhook event types
interface RetellCallEndedEvent {
  event: "call_ended";
  call: {
    call_id: string;
    call_type: string;
    agent_id: string;
    call_status: string;
    start_timestamp: number;
    end_timestamp: number;
    duration_ms: number;
    disconnection_reason: string;
    transcript: string;
    transcript_object: Array<{
      role: "agent" | "user";
      content: string;
      words: Array<{ word: string; start: number; end: number }>;
    }>;
    metadata: {
      order_id?: string;
    };
    retell_llm_dynamic_variables: {
      customer_name?: string;
      product_names?: string;
      order_date?: string;
    };
  };
}

interface RetellCallAnalyzedEvent {
  event: "call_analyzed";
  call: {
    call_id: string;
    call_analysis: {
      call_successful: boolean;
      call_summary: string;
      custom_analysis_data: {
        overall_rating?: number;
        product_quality_rating?: number;
        freshness_rating?: number;
        taste_notes?: string;
        would_recommend?: boolean;
        would_repurchase?: boolean;
        issues_reported?: string;
        suggestions?: string;
      };
    };
  };
}

type RetellWebhookEvent = RetellCallEndedEvent | RetellCallAnalyzedEvent;

export const Route = createFileRoute("/api/webhooks/retell")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = (await request.json()) as RetellWebhookEvent;

          if (payload.event === "call_ended") {
            await handleCallEnded(payload);
          } else if (payload.event === "call_analyzed") {
            await handleCallAnalyzed(payload);
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Webhook error:", error);
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});

async function handleCallEnded(payload: RetellCallEndedEvent) {
  const { call } = payload;
  const orderId = call.metadata?.order_id;

  if (!orderId) {
    console.warn("call_ended webhook received without order_id in metadata");
    return;
  }

  const orderIdNum = parseInt(orderId, 10);
  if (isNaN(orderIdNum)) {
    console.warn("Invalid order_id in metadata:", orderId);
    return;
  }

  // Get all products from this order
  const items = await db
    .select({ productId: orderItems.productId })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderIdNum))
    .all();

  // Create a review for each product in the order
  for (const item of items) {
    // Check if review already exists for this call + product
    const existingReview = await db
      .select()
      .from(reviews)
      .where(eq(reviews.callId, call.call_id))
      .get();

    if (existingReview) {
      // Update existing review with transcript
      await db
        .update(reviews)
        .set({ transcript: call.transcript })
        .where(eq(reviews.callId, call.call_id));
    } else {
      // Create new review
      await db.insert(reviews).values({
        orderId: orderIdNum,
        productId: item.productId,
        callId: call.call_id,
        transcript: call.transcript,
      });
    }
  }
}

async function handleCallAnalyzed(payload: RetellCallAnalyzedEvent) {
  const { call } = payload;
  const analysis = call.call_analysis;

  // Find reviews with this call_id and update them
  const existingReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.callId, call.call_id))
    .all();

  if (existingReviews.length === 0) {
    console.warn("call_analyzed received but no reviews found for call_id:", call.call_id);
    return;
  }

  // Update all reviews with the analysis data
  await db
    .update(reviews)
    .set({
      summary: analysis.call_summary,
      analysisData: analysis.custom_analysis_data,
    })
    .where(eq(reviews.callId, call.call_id));
}
