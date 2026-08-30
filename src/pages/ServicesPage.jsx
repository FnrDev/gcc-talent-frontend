import { useMemo } from 'react'

import ListingPage from '@/components/listing/ListingPage'
import GigCard from '@/components/listing/GigCard'
import useListingQuery from '@/components/listing/useListingQuery'
import useCategories from '@/components/listing/useCategories'
import { getGigs } from '@/services/gigService'

const FILTER_KEYS = ['search', 'category', 'priceBand', 'deliveryDays', 'sort']

const SEO = {
  title: 'Buying services on GCC Talents',
  paragraphs: [
    'A service is a packaged offer: a freelancer defines exactly what they deliver, how long it takes, and what it costs, so you can compare like for like instead of writing a brief and waiting for quotes. Most services come in three tiers, and the difference between them is scope rather than quality — the same person does the work at every level.',
    'Read the package contents before the price. A cheaper tier that excludes source files or commercial rights is rarely the cheaper option once you need them, and delivery time is usually the constraint that matters most on a launch. Where a seller offers unlimited revisions, that applies within the scope of the package, not to changes of direction.',
    'Every order runs through milestone escrow. Your funds are held by the platform when you order and released to the freelancer only once you approve the delivery, so neither side is exposed. If a delivery does not match what the package described, you can request a revision or open a dispute before approving.',
    'Ratings shown on each card are the average across completed orders, with the review count beside them. A 4.7 across two hundred orders is a stronger signal than a 5.0 across three — weigh the count as heavily as the score, and read the most recent reviews rather than the top ones.',
  ],
}

const PROMO = {
  eyebrow: 'For Freelancers',
  title: 'Turn your skills into a service people can buy',
  description: 'Package what you do best and start receiving orders from clients across the region.',
  actionLabel: 'Become a Seller',
  actionTo: '/sign-up',
}

function ServicesPage() {
  const categories = useCategories()

  const listing = useListingQuery({
    fetcher: getGigs,
    resultKey: 'gigs',
    filterKeys: FILTER_KEYS,
    limit: 9,
  })

  const filterDefinitions = useMemo(
    () => [
      { key: 'search', type: 'search', placeholder: 'Search services, skills, or sellers' },
      {
        key: 'category',
        type: 'select',
        label: 'All categories',
        options: categories.map((category) => ({ value: category._id, label: category.name })),
      },
      {
        key: 'priceBand',
        type: 'select',
        label: 'Any price',
        options: [
          { value: 'under_25', label: 'Under BHD 25' },
          { value: '25_75', label: 'BHD 25 – 75' },
          { value: 'over_75', label: 'Over BHD 75' },
        ],
      },
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
          { value: 'price_low', label: 'Price: low to high' },
          { value: 'price_high', label: 'Price: high to low' },
          { value: 'rating', label: 'Highest rated' },
        ],
      },
    ],
    [categories],
  )

  return (
    <ListingPage
      title="Browse services"
      subtitle="Ready-made packages from freelancers across the GCC — pick a tier and order."
      noun="services"
      listing={listing}
      filterDefinitions={filterDefinitions}
      renderItem={(gig) => <GigCard key={gig._id} gig={gig} />}
      withMedia
      emptyTitle="No services match your filters"
      emptyDescription="Try a longer delivery window or a wider price range, or clear the filters to see everything on offer."
      seo={SEO}
      promo={PROMO}
    />
  )
}

export default ServicesPage
