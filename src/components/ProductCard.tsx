import type { Product } from "@/db/schema";
import { Coffee, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { items, addToCart, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
        <Coffee size={64} className="text-amber-400" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <span className="text-lg font-bold text-amber-700">${product.price.toFixed(2)}</span>
        </div>

        {product.category === "coffee" && (
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
              {product.roast}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {product.origin}
            </span>
          </div>
        )}

        <p className="text-gray-600 text-sm mb-4">{product.description}</p>

        {quantity > 0 ? (
          <div className="flex items-center justify-between bg-amber-100 rounded-lg p-1">
            <button
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="p-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors"
            >
              <Minus size={18} />
            </button>
            <span className="text-lg font-semibold text-amber-900">{quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="p-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addToCart(product)}
            className="w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors bg-amber-700 hover:bg-amber-800 text-white"
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
