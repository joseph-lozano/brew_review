import { Link } from "@tanstack/react-router";
import { Coffee, MessageSquare, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="bg-amber-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Coffee size={32} className="text-amber-200" />
          <span className="text-2xl font-bold">Brew Review</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="hover:text-amber-200 transition-colors font-medium"
            activeProps={{ className: "text-amber-200 font-medium" }}
          >
            Products
          </Link>
          <Link
            to="/reviews"
            className="flex items-center gap-2 hover:text-amber-200 transition-colors font-medium"
            activeProps={{ className: "text-amber-200 font-medium" }}
          >
            <MessageSquare size={20} />
            Reviews
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-2 hover:text-amber-200 transition-colors font-medium"
            activeProps={{ className: "text-amber-200 font-medium" }}
          >
            <ShoppingBag size={20} />
            Orders
          </Link>
          <Link
            to="/cart"
            className="relative flex items-center gap-2 hover:text-amber-200 transition-colors font-medium"
            activeProps={{ className: "text-amber-200 font-medium" }}
          >
            <ShoppingCart size={20} />
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
