import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Coffee, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useCart } from "../components/CartContext";
import { db } from "../db";
import { orderItems, orders } from "../db/schema";

const cartItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1),
  price: z.number().min(0),
});

const checkoutSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  items: z.array(cartItemSchema).min(1),
  totalAmount: z.number().min(0),
});

const createOrder = createServerFn({ method: "POST" })
  .inputValidator(checkoutSchema)
  .handler(({ data }) => {
    const { customerName, customerEmail, items, totalAmount } = data;

    // Use synchronous transaction for better-sqlite3
    const order = db.transaction((tx) => {
      // Create the order
      const newOrder = tx
        .insert(orders)
        .values({
          customerName,
          customerEmail,
          totalAmount,
          status: "completed",
        })
        .returning()
        .get();

      // Create order items
      tx.insert(orderItems)
        .values(
          items.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
          }))
        )
        .run();

      return newOrder;
    });

    return { orderId: order.id };
  });

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        data: {
          customerName,
          customerEmail,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          totalAmount,
        },
      });

      clearCart();
      navigate({ to: "/order-confirmation/$orderId", params: { orderId: String(result.orderId) } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isCheckingOut) {
    return (
      <div className="min-h-screen bg-amber-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingCart size={64} className="mx-auto text-amber-300 mb-4" />
            <h1 className="text-2xl font-bold text-amber-900 mb-2">Your cart is empty</h1>
            <p className="text-amber-700 mb-6">Add some delicious coffee to get started!</p>
            <a
              href="/"
              className="inline-block bg-amber-700 hover:bg-amber-800 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Browse Products
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-8">
          {isCheckingOut ? "Checkout" : "Your Cart"}
        </h1>

        {!isCheckingOut ? (
          <>
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0"
                >
                  <div className="h-16 w-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Coffee size={32} className="text-amber-400" />
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-amber-700 font-medium">${item.product.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={18} className="text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={18} className="text-gray-600" />
                    </button>
                  </div>

                  <div className="w-24 text-right">
                    <span className="font-bold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg text-gray-700">Subtotal</span>
                <span className="text-lg font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <span className="text-lg text-gray-700">Shipping</span>
                <span className="text-lg text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-amber-700">${totalAmount.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleCheckout} className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-amber-700">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsCheckingOut(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Cart
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-400 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? "Processing..." : "Place Order"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
