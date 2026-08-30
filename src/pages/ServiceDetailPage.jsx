import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  InformationCircleIcon,
  Location01Icon,
  RefreshIcon,
  StarIcon,
  TaskDone01Icon,
} from '@hugeicons/core-free-icons'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Footer from '@/components/landing/Footer'
import PromoBanner from '@/components/landing/PromoBanner'
import Gallery from '@/components/listing/Gallery'
import ServiceCard from '@/components/listing/ServiceCard'
import SimilarGrid from '@/components/listing/SimilarGrid'
import SpecList from '@/components/listing/SpecList'
import useResource from '@/components/listing/useResource'
import { formatCurrency, initials } from '@/lib/format'
import { serviceArtwork } from '@/lib/serviceArtwork'
import { getService, getSimilarServices } from '@/services/serviceService'

const SERVICE_NOTES = [
  { icon: TaskDone01Icon, label: 'Package scope and features are listed before work begins' },
  { icon: Clock01Icon, label: 'Delivery estimates are set by the freelancer' },
  { icon: InformationCircleIcon, label: 'Ordering is not available in this release' },
]

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="aspect-16/9 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

function PackagePanel({ pack }) {
  const features = Array.isArray(pack.features) ? pack.features : []

  return (
    <div className="flex flex-col gap-4 rounded-xl p-4 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="outline">{pack.name}</Badge>
          <h2 className="mt-2 text-base font-semibold text-foreground">{pack.title}</h2>
        </div>
        <span className="shrink-0 font-heading text-2xl font-semibold text-foreground">
          {formatCurrency(pack.price, pack.currency)}
        </span>
      </div>

      {pack.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{pack.description}</p>
      ) : null}

      <SpecList
        rows={[
          { icon: Clock01Icon, label: 'Delivery', value: `${pack.deliveryDays} days` },
          { icon: RefreshIcon, label: 'Revisions', value: pack.revisions },
        ]}
      />

      {features.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No additional features are listed.</p>
      )}

      <Button size="lg" className="w-full" disabled>
        Ordering coming soon
      </Button>
    </div>
  )
}

function ServiceDetailPage() {
  const { id } = useParams()
  const { data: service, loading, error } = useResource(getService, id, 'service')
  const { data: similar } = useResource(getSimilarServices, id, 'services')
  const [selectedPackageId, setSelectedPackageId] = useState(null)
  const packageIds = service?.packages?.map((pack) => String(pack._id)) || []
  const activePackageId = packageIds.includes(selectedPackageId)
    ? selectedPackageId
    : packageIds[0]
  const seller = service?.freelancer
  const location = [seller?.city, seller?.country].filter(Boolean).join(', ') || 'Not provided'
  const rating = Number(service?.ratingAvg || 0)

  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/services" />}>Services</BreadcrumbLink>
            </BreadcrumbItem>
            {service ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">{service.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>

        {loading ? <DetailSkeleton /> : null}

        {error && !loading ? (
          <div className="rounded-xl p-8 text-center ring-1 ring-foreground/10">
            <h1 className="font-heading text-lg font-semibold text-foreground">Service unavailable</h1>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" nativeButton={false} render={<Link to="/services" />}>
              Back to services
            </Button>
          </div>
        ) : null}

        {service && !loading ? (
          <>
            <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
              <div className="flex min-w-0 flex-col gap-6">
                <div>
                  <h1 className="font-heading text-2xl leading-snug font-semibold text-foreground">
                    {service.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar size="sm">
                        {seller?.avatarUrl ? <AvatarImage src={seller.avatarUrl} alt="" /> : null}
                        <AvatarFallback>{initials(seller?.name || 'Freelancer')}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium text-foreground">
                        {seller?.name || 'Freelancer'}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-4 text-primary" />
                      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({service.ratingCount || 0} reviews)</span>
                    </span>
                  </div>
                </div>

                <Gallery images={[serviceArtwork(service)]} title={service.name} />

                <section>
                  <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">
                    Choose a package
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    This service includes {service.packages.length}{' '}
                    {service.packages.length === 1 ? 'package' : 'packages'}. Compare the scope,
                    delivery estimate, revisions, and price before contacting the freelancer.
                  </p>
                </section>
              </div>

              <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
                <Tabs value={activePackageId} onValueChange={setSelectedPackageId}>
                  <TabsList className="h-auto w-full flex-wrap">
                    {service.packages.map((pack) => (
                      <TabsTrigger key={pack._id} value={String(pack._id)}>
                        {pack.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {service.packages.map((pack) => (
                    <TabsContent key={pack._id} value={String(pack._id)}>
                      <PackagePanel pack={pack} />
                    </TabsContent>
                  ))}
                </Tabs>

                <SpecList
                  rows={[
                    { icon: Location01Icon, label: 'Freelancer location', value: location },
                    { icon: Clock01Icon, label: 'Fastest delivery', value: `${service.fastestDelivery} days` },
                  ]}
                />

                <ul className="flex flex-col gap-2 rounded-xl p-3 ring-1 ring-foreground/10">
                  {SERVICE_NOTES.map((row) => (
                    <li key={row.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={row.icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
                      {row.label}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>

            <SimilarGrid
              title={`More from ${seller?.name || 'this freelancer'}`}
              items={similar || []}
              renderItem={(item) => <ServiceCard key={item._id} service={item} />}
              moreTo="/services"
              moreLabel="Browse services"
            />
          </>
        ) : null}
      </main>

      <PromoBanner
        eyebrow="For freelancers"
        title="Turn your packages into a service"
        description="Create clear options with prices, delivery estimates, revisions, and included features."
        actionLabel="Join as a freelancer"
        actionTo="/sign-up"
      />
      <Footer />
    </div>
  )
}

export default ServiceDetailPage
