import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/context/CategoryContext'
import { resolveCategoryIcon, selectLandingCategories } from './categories'

function PopularServices() {
  const { categories, loading, error, refreshCategories } = useCategories()
  const visibleCategories = selectLandingCategories(categories)

  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Popular services</h2>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/services" />}>
          Browse all services
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }, (_, index) => (
            <Card key={index} className="items-center gap-3 p-4">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))
        ) : error ? (
          <Card className="col-span-full items-center gap-2 p-6 text-center">
            <p className="text-sm text-muted-foreground">Popular services are unavailable right now.</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshCategories}>
              Try again
            </Button>
          </Card>
        ) : visibleCategories.length === 0 ? (
          <Card className="col-span-full p-6 text-center text-sm text-muted-foreground">
            No categories are available yet.
          </Card>
        ) : visibleCategories.map((category) => (
          <Link
            key={category._id || category.slug || category.name}
            to={`/jobs?category=${encodeURIComponent(category._id)}`}
            className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full items-center gap-2 p-4 text-center transition-colors hover:ring-primary/50">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={resolveCategoryIcon(category)} strokeWidth={2} className="size-5" />
              </span>
              <span className="text-sm font-medium text-foreground">{category.name}</span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default PopularServices
