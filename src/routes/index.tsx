import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Coffee } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { db } from "../db";
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
