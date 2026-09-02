import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
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
import ServiceCheckoutDialog from '@/components/listing/ServiceCheckoutDialog'
import ServiceReviews from '@/components/listing/ServiceReviews'
import SimilarGrid from '@/components/listing/SimilarGrid'
import SpecList from '@/components/listing/SpecList'
import useResource from '@/components/listing/useResource'
import UserLink from '@/components/UserLink'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/format'
import { serviceGallery } from '@/lib/serviceArtwork'
import { getService, getSimilarServices } from '@/services/serviceService'

const SERVICE_NOTES = [
  { icon: TaskDone01Icon, labelKey: 'serviceDetail.noteScope' },
  { icon: Clock01Icon, labelKey: 'serviceDetail.noteDelivery' },
  { icon: InformationCircleIcon, labelKey: 'serviceDetail.noteDemo' },
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

function PackagePanel({ pack, onOrder, orderLabel, orderDisabled }) {
  const { t } = useTranslation()
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
          { icon: Clock01Icon, label: t('serviceDetail.delivery'), value: t('serviceDetail.deliveryDaysValue', { count: pack.deliveryDays }) },
          { icon: RefreshIcon, label: t('serviceDetail.revisions'), value: pack.revisions },
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
        <p className="text-sm text-muted-foreground">{t('serviceDetail.noFeatures')}</p>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => onOrder(pack)}
        disabled={orderDisabled}
      >
        {orderLabel}
      </Button>
    </div>
  )
}

function ServiceDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const { data: service, loading, error } = useResource(getService, id, 'service')
  const { data: similar } = useResource(getSimilarServices, id, 'services')
  const [selectedPackageId, setSelectedPackageId] = useState(null)
  const [checkoutPackage, setCheckoutPackage] = useState(null)
  const packageIds = service?.packages?.map((pack) => String(pack._id)) || []
  const activePackageId = packageIds.includes(selectedPackageId)
    ? selectedPackageId
    : packageIds[0]
  const seller = service?.freelancer
  const location = [seller?.city, seller?.country].filter(Boolean).join(', ') || t('serviceDetail.notProvided')
  const rating = Number(service?.ratingAvg || 0)
  const canOrder = user?.role === 'client'
  const orderLabel = authLoading
    ? t('serviceDetail.checkingAccount')
    : !user
      ? t('serviceDetail.signInToOrder')
      : canOrder
        ? t('serviceDetail.orderPackage')
        : t('serviceDetail.clientRequired')

  function handleOrder(pack) {
    if (authLoading) return

    if (!user) {
      navigate('/sign-in', {
        state: {
          from: `${routeLocation.pathname}${routeLocation.search}`,
          message: t('serviceDetail.signInMessage'),
        },
      })
      return
    }

    if (canOrder) setCheckoutPackage(pack)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>{t('serviceDetail.home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/services" />}>{t('serviceDetail.services')}</BreadcrumbLink>
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
            <h1 className="font-heading text-lg font-semibold text-foreground">{t('serviceDetail.unavailable')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" nativeButton={false} render={<Link to="/services" />}>
              {t('serviceDetail.backToServices')}
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
                    <UserLink
                      user={seller}
                      showAvatar
                      nameClassName="text-sm font-medium text-foreground"
                    />
                    <span className="flex items-center gap-1 text-sm">
                      <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-4 text-primary" />
                      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({t('serviceDetail.reviewsCount', { count: service.ratingCount || 0 })})</span>
                    </span>
                  </div>
                </div>

                <Gallery images={serviceGallery(service)} title={service.name} />

                <section>
                  <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">
                    {t('serviceDetail.choosePackage')}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t('serviceDetail.packageIntro', { count: service.packages.length })}
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
                      <PackagePanel
                        pack={pack}
                        onOrder={handleOrder}
                        orderLabel={orderLabel}
                        orderDisabled={authLoading || (Boolean(user) && !canOrder)}
                      />
                    </TabsContent>
                  ))}
                </Tabs>

                <SpecList
                  rows={[
                    { icon: Location01Icon, label: t('serviceDetail.freelancerLocation'), value: location },
                    { icon: Clock01Icon, label: t('serviceDetail.fastestDelivery'), value: t('serviceDetail.deliveryDaysValue', { count: service.fastestDelivery }) },
                  ]}
                />

                <ul className="flex flex-col gap-2 rounded-xl p-3 ring-1 ring-foreground/10">
                  {SERVICE_NOTES.map((row) => (
                    <li key={row.labelKey} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={row.icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
                      {t(row.labelKey)}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>

            <ServiceReviews key={service._id} serviceId={service._id} />

            <SimilarGrid
              title={t('serviceDetail.moreFrom', { name: seller?.name || t('serviceDetail.thisFreelancer') })}
              items={similar || []}
              renderItem={(item) => <ServiceCard key={item._id} service={item} />}
              moreTo="/services"
              moreLabel={t('serviceDetail.browseServices')}
            />
          </>
        ) : null}
      </main>

      {checkoutPackage ? (
        <ServiceCheckoutDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setCheckoutPackage(null)
          }}
          service={service}
          pack={checkoutPackage}
        />
      ) : null}

      <PromoBanner
        eyebrow={t('services.promoEyebrow')}
        title={t('services.promoTitle')}
        description={t('serviceDetail.promoDescription')}
        actionLabel={t('services.promoAction')}
        actionTo="/services/new"
      />
      <Footer />
    </div>
  )
}

export default ServiceDetailPage
