import type { Product, ReviewAnalysisData } from "@/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { Coffee } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { db } from "../db";
import { products, reviews } from "../db/schema";

export interface ProductWithRating extends Product {
  averageRating: number | null;
  reviewCount: number;
}

const getProductsWithRatings = createServerFn({ method: "GET" }).handler(async () => {
  const allProducts = await db.select().from(products).all();

  // Get review stats for each product
  const productsWithRatings: ProductWithRating[] = await Promise.all(
    allProducts.map(async (product) => {
      const productReviews = await db
        .select({
          analysisData: reviews.analysisData,
        })
        .from(reviews)
        .where(eq(reviews.productId, product.id))
        .all();

      const reviewsWithRating = productReviews.filter(
        (r) => r.analysisData && (r.analysisData as ReviewAnalysisData).overall_rating
      );

      const avgRating =
        reviewsWithRating.length > 0
          ? reviewsWithRating.reduce(
              (sum, r) => sum + ((r.analysisData as ReviewAnalysisData).overall_rating || 0),
              0
            ) / reviewsWithRating.length
          : null;

      return {
        ...product,
        averageRating: avgRating,
        reviewCount: productReviews.length,
      };
    })
  );

  return productsWithRatings;
});

export const Route = createFileRoute("/")({
  component: ProductCatalog,
  loader: () => getProductsWithRatings(),
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
              <ProductCard
                key={product.id}
                product={product}
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
              />
            ))}
          </div>
        </section>

        {/* Equipment Section */}
        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Equipment & Accessories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
