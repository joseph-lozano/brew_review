import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { Calendar, Coffee, MessageSquare, Package, ShoppingBag } from "lucide-react";
import { db } from "../db";
import { orderItems, orders, products } from "../db/schema";

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

const getOrders = createServerFn({ method: "GET" }).handler(async () => {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).all();

  const ordersWithItems: OrderWithItems[] = await Promise.all(
    allOrders.map(async (order) => {
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

      return { ...order, items };
    })
  );

  return ordersWithItems;
});

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  loader: () => getOrders(),
});

function formatDate(date: Date | null): string {
  if (!date) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const isCompleted = order.status === "completed";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Order Header */}
      <div className="bg-amber-100 px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={18} className="text-amber-700" />
              <span className="text-sm text-amber-700">Order</span>
              <span className="font-bold text-amber-900">#{order.id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Calendar size={14} />
              {formatDate(order.createdAt)}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                isCompleted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {isCompleted ? "Completed" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-6">
        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className="h-10 w-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded flex items-center justify-center flex-shrink-0">
                <Coffee size={20} className="text-amber-400" />
              </div>
              <div className="flex-grow">
                <p className="font-medium text-gray-900">{item.product.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="font-medium text-gray-700">
                ${(item.priceAtPurchase * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Order Total */}
        <div className="border-t pt-4 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-amber-700">${order.totalAmount.toFixed(2)}</span>
        </div>

        {/* Leave Review Button */}
        {isCompleted && (
          <div className="mt-4 pt-4 border-t">
            <Link
              to="/review/$orderId"
              params={{ orderId: String(order.id) }}
              className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <MessageSquare size={18} />
              Leave a Voice Review
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersPage() {
  const orders = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag size={32} className="text-amber-700" />
          <h1 className="text-3xl font-bold text-amber-900">Your Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <Package size={32} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              Start shopping to place your first order and earn the chance to leave a voice review!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              <Coffee size={18} />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
