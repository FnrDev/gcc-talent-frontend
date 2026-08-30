import { Button } from '@/components/ui/button'
import { Link } from 'react-router'

// The "more like this" row beneath a detail page.
function SimilarGrid({ title, items, renderItem, moreTo, moreLabel = 'See more' }) {
  if (!items?.length) return null

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        {moreTo && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={moreTo} />}>
            {moreLabel}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(renderItem)}</div>
    </section>
  )
}

export default SimilarGrid
