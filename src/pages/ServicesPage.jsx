import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { PackageIcon } from '@hugeicons/core-free-icons'

import ListingPage from '@/components/listing/ListingPage'
import ServiceCard from '@/components/listing/ServiceCard'
import useListingQuery from '@/components/listing/useListingQuery'
import { Badge } from '@/components/ui/badge'
import { getServices } from '@/services/serviceService'

const FILTER_KEYS = ['search', 'deliveryDays', 'sort']

function ServicesPage() {
  const { t } = useTranslation()

  const listing = useListingQuery({
    fetcher: getServices,
    resultKey: 'services',
    filterKeys: FILTER_KEYS,
    limit: 8,
  })

  // Rebuilt when the language changes so option labels follow the switcher.
  const filters = useMemo(
    () => [
      {
        key: 'search',
        type: 'search',
        placeholder: t('services.searchPlaceholder'),
        buttonLabel: t('services.searchButton'),
      },
      {
        key: 'deliveryDays',
        type: 'select',
        title: t('services.deliveryTime'),
        label: t('services.anyDeliveryTime'),
        options: [
          { value: '3', label: t('services.upTo3') },
          { value: '7', label: t('services.upTo7') },
          { value: '14', label: t('services.upTo14') },
        ],
      },
      {
        key: 'sort',
        type: 'select',
        title: t('services.sortBy'),
        label: t('services.recommended'),
        options: [
          { value: 'newest', label: t('services.newestFirst') },
          { value: 'delivery', label: t('services.fastestDelivery') },
          { value: 'rating', label: t('services.highestRated') },
        ],
      },
    ],
    [t],
  )

  const seo = useMemo(
    () => ({
      title: t('services.seoTitle'),
      paragraphs: [t('services.seoP1'), t('services.seoP2'), t('services.seoP3')],
    }),
    [t],
  )

  const promo = useMemo(
    () => ({
      eyebrow: t('services.promoEyebrow'),
      title: t('services.promoTitle'),
      description: t('services.promoDescription'),
      actionLabel: t('services.promoAction'),
      actionTo: '/services/new',
    }),
    [t],
  )

  return (
    <ListingPage
      badge={
        <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1">
          <HugeiconsIcon icon={PackageIcon} strokeWidth={2} />
          {t('services.badge')}
        </Badge>
      }
      title={t('services.title')}
      subtitle={t('services.subtitle')}
      resultsTitle={t('services.resultsTitle')}
      nounKey="listing.nounServices"
      listing={listing}
      filterDefinitions={filters}
      renderItem={(service) => <ServiceCard key={service._id} service={service} />}
      withMedia
      emptyTitle={t('services.emptyTitle')}
      emptyDescription={t('services.emptyDescription')}
      seo={seo}
      promo={promo}
    />
  )
}

export default ServicesPage
