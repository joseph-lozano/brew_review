import { Link } from '@tanstack/react-router'
import { Coffee, ShoppingBag } from 'lucide-react'

export default function Header() {
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
            activeProps={{ className: 'text-amber-200 font-medium' }}
          >
            Products
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-2 hover:text-amber-200 transition-colors font-medium"
            activeProps={{ className: 'text-amber-200 font-medium' }}
          >
            <ShoppingBag size={20} />
            Orders
          </Link>
        </nav>
      </div>
    </header>
  )
}
