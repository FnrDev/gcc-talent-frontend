import ListingPage from '@/components/listing/ListingPage'
import ServiceCard from '@/components/listing/ServiceCard'
import useListingQuery from '@/components/listing/useListingQuery'
import { getServices } from '@/services/serviceService'

const FILTER_KEYS = ['search', 'deliveryDays', 'sort']

const FILTERS = [
  { key: 'search', type: 'search', placeholder: 'Search services, packages, or freelancers' },
  {
    key: 'deliveryDays',
    type: 'select',
    label: 'Any delivery time',
    options: [
      { value: '3', label: 'Up to 3 days' },
      { value: '7', label: 'Up to 7 days' },
      { value: '14', label: 'Up to 14 days' },
    ],
  },
  {
    key: 'sort',
    type: 'select',
    label: 'Recommended',
    options: [
      { value: 'newest', label: 'Newest first' },
      { value: 'delivery', label: 'Fastest delivery' },
      { value: 'rating', label: 'Highest rated' },
    ],
  },
]

const SEO = {
  title: 'Buying services on GCC Talents',
  paragraphs: [
    'A service groups one or more packages from the same freelancer. Compare each package by scope, price, delivery time, revisions, and included features before deciding which option fits your project.',
    'Package prices can use different supported currencies, so every card and package displays its own currency. Delivery estimates and revision counts are supplied by the freelancer and should be reviewed alongside the package description.',
    'Ratings summarize marketplace reviews attached to the freelancer. Consider both the score and the number of reviews when comparing services.',
  ],
}

const PROMO = {
  eyebrow: 'For freelancers',
  title: 'Turn your packages into a service',
  description: 'Create focused packages with clear prices, delivery times, and included features.',
  actionLabel: 'Join as a freelancer',
  actionTo: '/sign-up',
}

function ServicesPage() {
  const listing = useListingQuery({
    fetcher: getServices,
    resultKey: 'services',
    filterKeys: FILTER_KEYS,
    limit: 9,
  })

  return (
    <ListingPage
      title="Browse services"
      subtitle="Compare live packages offered by freelancers across the GCC."
      noun="services"
      listing={listing}
      filterDefinitions={FILTERS}
      renderItem={(service) => <ServiceCard key={service._id} service={service} />}
      withMedia
      emptyTitle="No services match your filters"
      emptyDescription="Try a different search or a longer delivery window."
      seo={SEO}
      promo={PROMO}
    />
  )
}

export default ServicesPage
