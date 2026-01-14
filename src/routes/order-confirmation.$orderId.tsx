import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { CheckCircle, Coffee, Package, ShoppingBag } from "lucide-react";
import { z } from "zod";
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

const orderIdSchema = z.string().min(1);

const getOrderDetails = createServerFn({ method: "GET" })
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

    return { order, items };
  });

export const Route = createFileRoute("/order-confirmation/$orderId")({
  component: OrderConfirmationPage,
  loader: ({ params }) => getOrderDetails({ data: params.orderId }),
});

function OrderConfirmationPage() {
  const { order, items } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Order Confirmed!</h1>
          <p className="text-amber-700">Thank you for your purchase, {order.customerName}!</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-amber-100 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-amber-700">Order Number</p>
                <p className="text-xl font-bold text-amber-900">#{order.id}</p>
              </div>
              <Package size={32} className="text-amber-600" />
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0"
                >
                  <div className="h-10 w-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded flex items-center justify-center flex-shrink-0">
                    <Coffee size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-gray-900">
                    ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-amber-700">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Email Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-amber-800 text-sm">
            A confirmation email has been sent to{" "}
            <span className="font-medium">{order.customerEmail}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            <ShoppingBag size={20} />
            View Orders
          </Link>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 border border-amber-700 text-amber-700 hover:bg-amber-50 py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
