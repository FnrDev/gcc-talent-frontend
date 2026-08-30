import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'

import { Card } from '@/components/ui/card'
import useCategories from '@/components/listing/useCategories'
import { categoryIcon } from './categories'

function PopularServices() {
  const categories = useCategories()

  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Popular services</h2>
        <Link to="/services" className="text-sm font-medium text-primary hover:underline">
          Browse all services
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {categories.map((category) => (
          <Card
            key={category._id}
            className="relative items-center gap-2 p-4 text-center transition-colors hover:border-primary/50"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={categoryIcon(category.slug)} strokeWidth={2} className="size-5" />
            </span>
            <Link
              to={`/services?category=${category._id}`}
              className="text-sm font-medium text-foreground after:absolute after:inset-0 hover:text-primary"
            >
              {category.name}
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default PopularServices
