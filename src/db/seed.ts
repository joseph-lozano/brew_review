import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { products } from './schema'

const sqlite = new Database(process.env.DATABASE_URL!)
const db = drizzle(sqlite)

const seedProducts = [
  // Coffee Beans
  {
    name: 'Ethiopian Yirgacheffe',
    description: 'Bright and fruity with blueberry and citrus notes. A light roast that showcases the bean\'s natural complexity.',
    category: 'coffee',
    roast: 'light',
    origin: 'Ethiopia',
    price: 18.99,
  },
  {
    name: 'Colombian Supremo',
    description: 'Well-balanced with caramel sweetness and a nutty finish. A crowd-pleasing medium roast.',
    category: 'coffee',
    roast: 'medium',
    origin: 'Colombia',
    price: 16.99,
  },
  {
    name: 'Sumatra Mandheling',
    description: 'Earthy and full-bodied with notes of dark chocolate and cedar. Bold dark roast.',
    category: 'coffee',
    roast: 'dark',
    origin: 'Indonesia',
    price: 17.99,
  },
  {
    name: 'Morning Kickstart',
    description: 'Our boldest blend designed to jumpstart your day. Rich, smoky, and intense.',
    category: 'coffee',
    roast: 'dark',
    origin: 'Blend',
    price: 14.99,
  },
  {
    name: 'Smooth Operator',
    description: 'A mellow everyday blend with low acidity and hints of milk chocolate.',
    category: 'coffee',
    roast: 'medium',
    origin: 'Blend',
    price: 13.99,
  },
  {
    name: 'Espresso Classico',
    description: 'Traditional Italian-style espresso blend. Creamy, sweet, with a long finish.',
    category: 'coffee',
    roast: 'dark',
    origin: 'Blend',
    price: 15.99,
  },
  // Equipment
  {
    name: 'Burr Master Pro',
    description: 'Electric burr grinder with 40 grind settings. Consistent grounds for any brewing method.',
    category: 'equipment',
    price: 89.99,
  },
  {
    name: 'French Press Classic',
    description: '34 oz glass French press with stainless steel plunger. Makes 8 cups of rich, full-bodied coffee.',
    category: 'equipment',
    price: 32.99,
  },
  {
    name: 'Gooseneck Kettle',
    description: 'Electric kettle with temperature control and precision pour spout. Perfect for pour-over brewing.',
    category: 'equipment',
    price: 54.99,
  },
]

async function seed() {
  console.log('Seeding products...')
  
  // Clear existing products
  db.delete(products).run()
  
  // Insert new products
  for (const product of seedProducts) {
    db.insert(products).values(product).run()
    console.log(`  Added: ${product.name}`)
  }
  
  console.log(`\nSeeded ${seedProducts.length} products`)
}

seed()
