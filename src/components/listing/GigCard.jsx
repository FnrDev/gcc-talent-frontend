import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon, Clock01Icon } from '@hugeicons/core-free-icons'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_CURRENCY, formatCurrency } from '@/lib/format'
import UserLink from '@/components/UserLink'

// The image-led preview from the reference layout. The title link is stretched
// over the whole card with after:inset-0, so clicking anywhere opens the
// service while the card still exposes exactly one link to assistive tech.
function GigCard({ gig }) {
  const cover = gig.gallery?.[0]
  const currency = gig.packages?.[0]?.currency ?? DEFAULT_CURRENCY

  return (
    <Card className="group/gig relative gap-0 overflow-hidden py-0">
      <div className="relative aspect-16/9 overflow-hidden bg-muted">
        {cover && (
          <img
            src={cover.url}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover/gig:scale-105"
          />
        )}
        {gig.isFeatured && <Badge className="absolute top-2 left-2 shadow-sm">Featured</Badge>}
      </div>

      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center gap-2">
          <UserLink
            user={gig.seller}
            showAvatar
            raised
            nameClassName="text-sm font-medium text-foreground"
          />
          <span className="ml-auto flex shrink-0 items-center gap-1 text-sm">
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-3.5 text-primary" />
            <span className="font-medium text-foreground">{gig.ratingAvg.toFixed(1)}</span>
            <span className="text-muted-foreground">({gig.ratingCount})</span>
          </span>
        </div>

        <Link
          to={`/services/${gig._id}`}
          className="line-clamp-2 text-sm font-medium text-foreground after:absolute after:inset-0 hover:text-primary focus-visible:outline-none group-focus-within/gig:underline"
        >
          {gig.title}
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" />
          <span>From {gig.fastestDelivery} {gig.fastestDelivery === 1 ? 'day' : 'days'}</span>
          <Badge variant="outline" className="ml-auto">{gig.category?.name}</Badge>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">Starting at</span>
        <span className="text-base font-semibold text-foreground">
          {formatCurrency(gig.startingPrice, currency)}
        </span>
      </CardFooter>
    </Card>
  )
}

export default GigCard
