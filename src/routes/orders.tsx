import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-6">Your Orders</h1>
        <p className="text-gray-600">No orders yet. Start shopping!</p>
      </div>
    </div>
  )
}
