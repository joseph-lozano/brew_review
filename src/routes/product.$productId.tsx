import type { Product, ReviewAnalysisData } from "@/db/schema";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { avg, count, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Coffee,
  MessageSquare,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  ThumbsUp,
} from "lucide-react";
import { z } from "zod";
import { useCart } from "../components/CartContext";
import { db } from "../db";
import { orders, products, reviews } from "../db/schema";

interface ReviewWithOrder {
  id: number;
  orderId: number;
  productId: number;
  callId: string | null;
  transcript: string | null;
  summary: string | null;
  analysisData: ReviewAnalysisData | null;
  createdAt: Date | null;
  customerName: string;
}

interface ProductWithReviews {
  product: Product;
  reviews: ReviewWithOrder[];
  averageRating: number | null;
  reviewCount: number;
}

const productIdSchema = z.string().min(1);

const getProductWithReviews = createServerFn({ method: "GET" })
  .inputValidator(productIdSchema)
  .handler(async ({ data: productId }) => {
    const productIdNum = parseInt(productId, 10);

    const product = await db.select().from(products).where(eq(products.id, productIdNum)).get();

    if (!product) {
      throw new Error("Product not found");
    }

    // Get reviews for this product with customer names
    const productReviews = await db
      .select({
        id: reviews.id,
        orderId: reviews.orderId,
        productId: reviews.productId,
        callId: reviews.callId,
        transcript: reviews.transcript,
        summary: reviews.summary,
        analysisData: reviews.analysisData,
        createdAt: reviews.createdAt,
        customerName: orders.customerName,
      })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .where(eq(reviews.productId, productIdNum))
      .all();

    // Calculate average rating
    const ratingStats = await db
      .select({
        avgRating: avg(reviews.id), // Placeholder - we need to get avg from analysisData
        count: count(),
      })
      .from(reviews)
      .where(eq(reviews.productId, productIdNum))
      .get();

    // Calculate average rating from analysisData
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
      product,
      reviews: productReviews as ReviewWithOrder[],
      averageRating: avgRating,
      reviewCount: ratingStats?.count ?? 0,
    } as ProductWithReviews;
  });

export const Route = createFileRoute("/product/$productId")({
  component: ProductDetailPage,
  loader: ({ params }) => getProductWithReviews({ data: params.productId }),
});

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </div>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function ProductDetailPage() {
  const { product, reviews: productReviews, averageRating, reviewCount } = Route.useLoaderData();
  const { items, addToCart, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            {/* Product Image */}
            <div className="md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <Coffee size={96} className="text-amber-400" />
            </div>

            {/* Product Info */}
            <div className="md:w-1/2 p-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <span className="text-2xl font-bold text-amber-700">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              {/* Rating Summary */}
              {averageRating !== null && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={Math.round(averageRating)} />
                  <span className="text-gray-600 text-sm">
                    {averageRating.toFixed(1)} ({reviewCount}{" "}
                    {reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}

              {/* Tags */}
              {product.category === "coffee" && (
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
                    {product.roast}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {product.origin}
                  </span>
                </div>
              )}

              <p className="text-gray-600 mb-6">{product.description}</p>

              {/* Add to Cart */}
              {quantity > 0 ? (
                <div className="flex items-center justify-between bg-amber-100 rounded-lg p-2">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="p-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-xl font-semibold text-amber-900">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="p-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  className="w-full py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors bg-amber-700 hover:bg-amber-800 text-white text-lg font-medium"
                >
                  <ShoppingCart size={22} />
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="text-amber-700" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
            {reviewCount > 0 && <span className="text-gray-500">({reviewCount})</span>}
          </div>

          {productReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No reviews yet for this product.</p>
              <p className="text-sm mt-1">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {productReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewWithOrder }) {
  const analysis = review.analysisData as ReviewAnalysisData | null;

  return (
    <div className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900">{review.customerName}</p>
          <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
        </div>
        {analysis?.overall_rating && <StarRating rating={analysis.overall_rating} />}
      </div>

      {/* Review Summary */}
      {review.summary && <p className="text-gray-700 mb-3">{review.summary}</p>}

      {/* Analysis Data */}
      {analysis && (
        <div className="bg-amber-50 rounded-lg p-4 space-y-3">
          {/* Ratings Row */}
          <div className="flex flex-wrap gap-4 text-sm">
            {analysis.product_quality_rating && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Quality:</span>
                <StarRating rating={analysis.product_quality_rating} size={14} />
              </div>
            )}
            {analysis.freshness_rating && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Freshness:</span>
                <StarRating rating={analysis.freshness_rating} size={14} />
              </div>
            )}
          </div>

          {/* Taste Notes */}
          {analysis.taste_notes && (
            <div>
              <span className="text-sm font-medium text-gray-700">Taste Notes: </span>
              <span className="text-sm text-gray-600">{analysis.taste_notes}</span>
            </div>
          )}

          {/* Recommendations */}
          <div className="flex flex-wrap gap-4 text-sm">
            {analysis.would_recommend !== undefined && (
              <div className="flex items-center gap-1">
                <ThumbsUp
                  size={14}
                  className={analysis.would_recommend ? "text-green-600" : "text-gray-400"}
                />
                <span className={analysis.would_recommend ? "text-green-600" : "text-gray-500"}>
                  {analysis.would_recommend ? "Would recommend" : "Would not recommend"}
                </span>
              </div>
            )}
            {analysis.would_repurchase !== undefined && (
              <div className="flex items-center gap-1">
                <ShoppingCart
                  size={14}
                  className={analysis.would_repurchase ? "text-green-600" : "text-gray-400"}
                />
                <span className={analysis.would_repurchase ? "text-green-600" : "text-gray-500"}>
                  {analysis.would_repurchase ? "Would buy again" : "Would not buy again"}
                </span>
              </div>
            )}
          </div>

          {/* Issues */}
          {analysis.issues_reported && (
            <div className="text-sm">
              <span className="font-medium text-red-700">Issues: </span>
              <span className="text-red-600">{analysis.issues_reported}</span>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Suggestions: </span>
              <span className="text-gray-600">{analysis.suggestions}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
