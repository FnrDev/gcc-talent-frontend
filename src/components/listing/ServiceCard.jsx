import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, StarIcon } from '@hugeicons/core-free-icons'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import UserLink from '@/components/UserLink'
import { formatCurrency } from '@/lib/format'
import { serviceArtwork } from '@/lib/serviceArtwork'

function cheapestPackage(packages = []) {
  return packages.reduce(
    (cheapest, current) => (!cheapest || current.price < cheapest.price ? current : cheapest),
    null,
  )
}

function ServiceCard({ service }) {
  const seller = service.freelancer
  const artwork = serviceArtwork(service)
  const startingPackage = cheapestPackage(service.packages)
  const rating = Number(service.ratingAvg || 0)
  const ratingCount = Number(service.ratingCount || 0)

  return (
    <Card className="group/service relative gap-0 overflow-hidden py-0">
      <div className="relative aspect-16/9 overflow-hidden bg-muted">
        <img
          src={artwork.url}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover/service:scale-105"
        />
      </div>

      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <UserLink
            user={seller}
            showAvatar
            raised
            nameClassName="text-sm font-medium text-foreground"
          />
          <span className="ml-auto flex shrink-0 items-center gap-1 text-sm">
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-3.5 text-primary" />
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({ratingCount})</span>
          </span>
        </div>

        <Link
          to={`/services/${service._id}`}
          className="line-clamp-2 text-sm font-medium text-foreground after:absolute after:inset-0 hover:text-primary focus-visible:outline-none group-focus-within/service:underline"
        >
          {service.name}
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" />
          <span>
            From {service.fastestDelivery} {service.fastestDelivery === 1 ? 'day' : 'days'}
          </span>
          <Badge variant="outline" className="ml-auto">
            {service.packages.length} {service.packages.length === 1 ? 'package' : 'packages'}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">Starting at</span>
        <span className="text-base font-semibold text-foreground">
          {startingPackage ? formatCurrency(startingPackage.price, startingPackage.currency) : '—'}
        </span>
      </CardFooter>
    </Card>
  )
}

export default ServiceCard
