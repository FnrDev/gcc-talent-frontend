import { HugeiconsIcon } from '@hugeicons/react'
import { SearchRemoveIcon, Alert02Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

function CardSkeleton({ withMedia }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      {withMedia && <Skeleton className="aspect-16/9 w-full rounded-lg" />}
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-4 w-14" />
      </div>
    </div>
  )
}

/**
 * Owns the four states a result grid can be in — loading, error, empty, and
 * populated — so neither browse page has to repeat them.
 */
function ListingGrid({ items, loading, error, renderItem, withMedia = false, count = 6, onClear, emptyTitle, emptyDescription }) {
  if (loading) {
    return (
      <div className={GRID} aria-busy="true" aria-live="polite">
        {Array.from({ length: count }, (_, index) => (
          <CardSkeleton key={index} withMedia={withMedia} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load results</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (!items.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        {onClear && (
          <EmptyContent>
            <Button variant="outline" onClick={onClear}>
              Clear all filters
            </Button>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return <div className={GRID}>{items.map(renderItem)}</div>
}

export default ListingGrid
