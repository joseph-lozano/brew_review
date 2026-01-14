import type { ReviewAnalysisData } from "@/db/schema";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { Coffee, MessageSquare, ShoppingCart, Star, ThumbsUp } from "lucide-react";
import { db } from "../db";
import { orders, products, reviews } from "../db/schema";

interface ReviewWithDetails {
  id: number;
  orderId: number;
  productId: number;
  callId: string | null;
  transcript: string | null;
  summary: string | null;
  analysisData: ReviewAnalysisData | null;
  createdAt: Date | null;
  customerName: string;
  productName: string;
  productCategory: string;
}

const getAllReviews = createServerFn({ method: "GET" }).handler(async () => {
  const allReviews = await db
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
      productName: products.name,
      productCategory: products.category,
    })
    .from(reviews)
    .innerJoin(orders, eq(reviews.orderId, orders.id))
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt))
    .all();

  return allReviews as ReviewWithDetails[];
});

export const Route = createFileRoute("/reviews")({
  component: ReviewsPage,
  loader: () => getAllReviews(),
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

function ReviewsPage() {
  const allReviews = Route.useLoaderData();

  // Calculate stats
  const totalReviews = allReviews.length;
  const reviewsWithRating = allReviews.filter(
    (r) => r.analysisData && (r.analysisData as ReviewAnalysisData).overall_rating
  );
  const avgRating =
    reviewsWithRating.length > 0
      ? reviewsWithRating.reduce(
          (sum, r) => sum + ((r.analysisData as ReviewAnalysisData).overall_rating || 0),
          0
        ) / reviewsWithRating.length
      : null;

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Customer Reviews</h1>
          <p className="text-amber-700">See what our customers are saying about our products</p>
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-900">{totalReviews}</p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </div>
            {avgRating !== null && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-3xl font-bold text-amber-900">{avgRating.toFixed(1)}</p>
                  <Star size={24} className="fill-amber-400 text-amber-400" />
                </div>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-900">
                {
                  reviewsWithRating.filter(
                    (r) => (r.analysisData as ReviewAnalysisData).would_recommend
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600">Would Recommend</p>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {allReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No reviews yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Reviews will appear here after customers leave voice feedback.
              </p>
            </div>
          ) : (
            allReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewWithDetails }) {
  const analysis = review.analysisData as ReviewAnalysisData | null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Coffee size={24} className="text-amber-400" />
          </div>
          <div>
            <Link
              to="/product/$productId"
              params={{ productId: review.productId.toString() }}
              className="font-semibold text-gray-900 hover:text-amber-700 transition-colors"
            >
              {review.productName}
            </Link>
            <p className="text-sm text-gray-500">
              Reviewed by {review.customerName} on {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        {analysis?.overall_rating && <StarRating rating={analysis.overall_rating} />}
      </div>

      {/* Summary */}
      {review.summary && <p className="text-gray-700 mb-4">{review.summary}</p>}

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
