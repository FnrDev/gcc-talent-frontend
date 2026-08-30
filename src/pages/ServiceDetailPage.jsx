import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  StarIcon,
  Clock01Icon,
  RefreshIcon,
  Location01Icon,
  CheckmarkCircle02Icon,
  Shield01Icon,
  Message01Icon,
  FlashIcon,
  Album02Icon,
} from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import Gallery from '@/components/listing/Gallery'
import SpecList from '@/components/listing/SpecList'
import SimilarGrid from '@/components/listing/SimilarGrid'
import GigCard from '@/components/listing/GigCard'
import useResource from '@/components/listing/useResource'
import PromoBanner from '@/components/landing/PromoBanner'
import Footer from '@/components/landing/Footer'
import { getGig, getSimilarGigs } from '@/services/gigService'
import { formatCurrency } from '@/lib/format'
import UserLink from '@/components/UserLink'

const TRUST_ROWS = [
  { icon: FlashIcon, label: 'Instant order — no waiting for a quote' },
  { icon: Shield01Icon, label: 'Payment held in escrow until you approve' },
  { icon: Message01Icon, label: '24/7 support on every order' },
]

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="aspect-16/9 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

function PackagePanel({ pack, gig }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl p-4 ring-1 ring-foreground/10">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-2xl font-semibold text-foreground">
          {formatCurrency(pack.price, pack.currency)}
        </span>
        <Badge variant="outline">{pack.title}</Badge>
      </div>

      <SpecList
        rows={[
          { icon: Clock01Icon, label: 'Delivery', value: `${pack.deliveryDays} days` },
          { icon: RefreshIcon, label: 'Revisions', value: pack.revisions },
          { icon: Album02Icon, label: 'Category', value: gig.category?.name },
        ]}
      />

      <ul className="flex flex-col gap-2">
        {pack.features.map((feature) => (
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

      <Button size="lg" className="w-full">
        Continue ({formatCurrency(pack.price, pack.currency)})
      </Button>
    </div>
  )
}

function ServiceDetailPage() {
  const { id } = useParams()
  const { data: gig, loading, error } = useResource(getGig, id, 'gig')
  const { data: similar } = useResource(getSimilarGigs, id, 'gigs')
  const [tier, setTier] = useState('basic')

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
            {gig && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">{gig.category?.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {loading && <DetailSkeleton />}

        {error && !loading && (
          <div className="rounded-xl p-8 text-center ring-1 ring-foreground/10">
            <h1 className="font-heading text-lg font-semibold text-foreground">Service unavailable</h1>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" nativeButton={false} render={<Link to="/services" />}>
              Back to services
            </Button>
          </div>
        )}

        {gig && !loading && (
          <>
            <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
              <div className="flex min-w-0 flex-col gap-6">
                <div>
                  <h1 className="font-heading text-2xl leading-snug font-semibold text-foreground">{gig.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <UserLink user={gig.seller} showAvatar nameClassName="text-sm font-medium" />
                    <span className="flex items-center gap-1 text-sm">
                      <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-4 text-primary" />
                      <span className="font-medium text-foreground">{gig.ratingAvg.toFixed(1)}</span>
                      <span className="text-muted-foreground">({gig.ratingCount} reviews)</span>
                    </span>
                    <span className="text-sm text-muted-foreground">{gig.ordersCompleted} orders completed</span>
                  </div>
                </div>

                <Gallery images={gig.gallery} title={gig.title} />

                <section>
                  <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">About this service</h2>
                  <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {gig.description.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Skills</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {gig.skills.map((skill) => (
                      <Badge key={skill._id} variant="secondary">{skill.name}</Badge>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                <Tabs value={tier} onValueChange={setTier}>
                  <TabsList className="w-full">
                    {gig.packages.map((pack) => (
                      <TabsTrigger key={pack.tier} value={pack.tier}>
                        {pack.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {gig.packages.map((pack) => (
                    <TabsContent key={pack.tier} value={pack.tier}>
                      <PackagePanel pack={pack} gig={gig} />
                    </TabsContent>
                  ))}
                </Tabs>

                <SpecList
                  rows={[
                    { icon: Location01Icon, label: 'Seller located in', value: gig.seller?.country },
                    { icon: Clock01Icon, label: 'Fastest delivery', value: `${gig.fastestDelivery} days` },
                  ]}
                />

                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link to={`/profile/${gig.seller?._id}`} />}
                >
                  View seller profile
                </Button>

                <ul className="flex flex-col gap-2 rounded-xl p-3 ring-1 ring-foreground/10">
                  {TRUST_ROWS.map((row) => (
                    <li key={row.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={row.icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
                      {row.label}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>

            <SimilarGrid
              title="More like this"
              items={similar ?? []}
              renderItem={(item) => <GigCard key={item._id} gig={item} />}
              moreTo="/services"
              moreLabel="See more"
            />
          </>
        )}
      </main>

      <PromoBanner
        eyebrow="For Freelancers"
        title="Turn your skills into a service people can buy"
        description="Package what you do best and start receiving orders from clients across the region."
        actionLabel="Become a Seller"
        actionTo="/sign-up"
      />
      <Footer />
    </div>
  )
}

export default ServiceDetailPage
