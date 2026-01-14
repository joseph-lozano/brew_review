import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Coffee, ShoppingCart } from "lucide-react";
import { db } from "../db";
import type { Product } from "../db/schema";
import { products } from "../db/schema";

const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(products).all();
});

export const Route = createFileRoute("/")({
  component: ProductCatalog,
  loader: () => getProducts(),
});

function ProductCatalog() {
  const allProducts = Route.useLoaderData();

  const coffeeProducts = allProducts.filter((p) => p.category === "coffee");
  const equipmentProducts = allProducts.filter((p) => p.category === "equipment");

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-900 mb-4">Premium Coffee & Equipment</h1>
          <p className="text-lg text-amber-700">Carefully sourced beans and quality brewing gear</p>
        </div>

        {/* Coffee Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-2">
            <Coffee className="text-amber-700" />
            Coffee Beans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coffeeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Equipment Section */}
        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Equipment & Accessories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
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

        <button className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
