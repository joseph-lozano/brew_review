import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle,
  Coffee,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";
import { z } from "zod";
import { db } from "../db";
import { orderItems, orders, products } from "../db/schema";
import { createWebCall } from "../integrations/retell/create-web-call";

interface OrderItemWithProduct {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: number;
    name: string;
    category: string;
  };
}

interface OrderWithItems {
  id: number;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  createdAt: Date | null;
  items: OrderItemWithProduct[];
}

const orderIdSchema = z.string().min(1);

const getOrderForReview = createServerFn({ method: "GET" })
  .inputValidator(orderIdSchema)
  .handler(async ({ data: orderId }) => {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .get();

    if (!order) {
      throw new Error("Order not found");
    }

    const items: OrderItemWithProduct[] = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        product: {
          id: products.id,
          name: products.name,
          category: products.category,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id))
      .all();

    return { ...order, items } as OrderWithItems;
  });

export const Route = createFileRoute("/review/$orderId")({
  component: ReviewPage,
  loader: ({ params }) => getOrderForReview({ data: params.orderId }),
});

type CallStatus = "idle" | "connecting" | "connected" | "ended" | "error";

interface TranscriptEntry {
  role: "agent" | "user";
  content: string;
}

function formatDate(date: Date | null): string {
  if (!date) return "your recent order";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function ReviewPage() {
  const order = Route.useLoaderData();
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isAgentTalking, setIsAgentTalking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
    };
  }, []);

  const startCall = useCallback(async () => {
    setError(null);
    setCallStatus("connecting");
    setTranscript([]);

    try {
      // Get access token from server
      const { accessToken } = await createWebCall({
        data: {
          orderId: order.id,
          customerName: order.customerName,
          productNames: order.items.map((item) => item.product.name),
          orderDate: formatDate(order.createdAt),
        },
      });

      // Initialize Retell client
      const retellClient = new RetellWebClient();
      retellClientRef.current = retellClient;

      // Set up event listeners
      retellClient.on("call_started", () => {
        setCallStatus("connected");
      });

      retellClient.on("call_ended", () => {
        setCallStatus("ended");
        retellClientRef.current = null;
      });

      retellClient.on("agent_start_talking", () => {
        setIsAgentTalking(true);
      });

      retellClient.on("agent_stop_talking", () => {
        setIsAgentTalking(false);
      });

      retellClient.on("update", (update) => {
        if (update.transcript) {
          // Parse transcript from Retell format
          const entries: TranscriptEntry[] = [];
          for (const item of update.transcript) {
            entries.push({
              role: item.role === "agent" ? "agent" : "user",
              content: item.content,
            });
          }
          setTranscript(entries);
        }
      });

      retellClient.on("error", (err) => {
        console.error("Retell error:", err);
        setError("Call error occurred. Please try again.");
        setCallStatus("error");
        retellClientRef.current = null;
      });

      // Start the call
      await retellClient.startCall({
        accessToken,
        sampleRate: 24000,
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      setCallStatus("error");
    }
  }, [order]);

  const endCall = useCallback(() => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
      setCallStatus("ended");
      retellClientRef.current = null;
    }
  }, []);

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Leave a Voice Review</h1>
          <p className="text-amber-700">
            Share your feedback about Order #{order.id} with our voice assistant
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded flex items-center justify-center flex-shrink-0">
                  <Coffee size={16} className="text-amber-400" />
                </div>
                <span className="text-gray-700">
                  {item.product.name} x {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Call Interface */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Status Header */}
          <div
            className={`px-6 py-4 ${
              callStatus === "connected"
                ? "bg-green-100"
                : callStatus === "ended"
                  ? "bg-gray-100"
                  : callStatus === "error"
                    ? "bg-red-100"
                    : "bg-amber-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {callStatus === "idle" && (
                  <>
                    <Phone className="text-amber-600" size={24} />
                    <span className="font-medium text-amber-900">Ready to start</span>
                  </>
                )}
                {callStatus === "connecting" && (
                  <>
                    <Loader2 className="text-amber-600 animate-spin" size={24} />
                    <span className="font-medium text-amber-900">Connecting...</span>
                  </>
                )}
                {callStatus === "connected" && (
                  <>
                    {isAgentTalking ? (
                      <Mic className="text-green-600" size={24} />
                    ) : (
                      <MicOff className="text-green-600" size={24} />
                    )}
                    <span className="font-medium text-green-900">
                      {isAgentTalking ? "Maya is speaking..." : "Listening..."}
                    </span>
                  </>
                )}
                {callStatus === "ended" && (
                  <>
                    <CheckCircle className="text-gray-600" size={24} />
                    <span className="font-medium text-gray-900">Call ended</span>
                  </>
                )}
                {callStatus === "error" && (
                  <>
                    <PhoneOff className="text-red-600" size={24} />
                    <span className="font-medium text-red-900">Call failed</span>
                  </>
                )}
              </div>

              {/* Call Duration Indicator */}
              {callStatus === "connected" && (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-700">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div className="h-64 overflow-y-auto p-6 bg-gray-50">
            {transcript.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                {callStatus === "idle" && "Click 'Start Call' to begin your voice review"}
                {callStatus === "connecting" && "Connecting to Maya..."}
                {callStatus === "connected" && "Waiting for conversation..."}
                {callStatus === "ended" && "No transcript available"}
                {callStatus === "error" && "Call could not be completed"}
              </div>
            ) : (
              <div className="space-y-4">
                {transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        entry.role === "user"
                          ? "bg-amber-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {entry.role === "user" ? "You" : "Maya"}
                      </p>
                      <p>{entry.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-100">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Call Controls */}
          <div className="p-6 border-t">
            {callStatus === "idle" || callStatus === "error" ? (
              <button
                onClick={startCall}
                className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                <Phone size={20} />
                Start Call
              </button>
            ) : callStatus === "connecting" ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 bg-amber-400 text-white py-3 px-6 rounded-lg font-medium cursor-not-allowed"
              >
                <Loader2 size={20} className="animate-spin" />
                Connecting...
              </button>
            ) : callStatus === "connected" ? (
              <button
                onClick={endCall}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                <PhoneOff size={20} />
                End Call
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-gray-600">Thank you for your feedback!</div>
                <Link
                  to="/orders"
                  className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Back to Orders
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
