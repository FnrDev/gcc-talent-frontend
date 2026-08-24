import { HugeiconsIcon } from '@hugeicons/react'
import { Card } from '@/components/ui/card'
import { categories } from './categories'

function PopularServices() {
  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Popular services</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {categories.map((category) => (
          <Card
            key={category.name}
            className="items-center gap-2 p-4 text-center transition-colors hover:border-primary/50"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={category.icon} strokeWidth={2} className="size-5" />
            </span>
            <span className="text-sm font-medium text-foreground">{category.name}</span>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default PopularServices
