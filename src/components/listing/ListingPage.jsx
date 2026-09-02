import { useTranslation } from 'react-i18next'

import BrowseLayout from './BrowseLayout'
import FilterPanel from './FilterPanel'
import HeroSearch from './HeroSearch'
import ListingGrid from './ListingGrid'
import Paginator from './Paginator'
import SeoTextBlock from './SeoTextBlock'
import PromoBanner from '@/components/landing/PromoBanner'

// Arabic has six plural forms, so the count goes through i18next rather than a
// hand-rolled singular/plural swap.
function resultLabel({ t, loading, pagination, activeFilterCount, nounKey }) {
  if (loading) return t('common.loading')

  const noun = t(nounKey)
  if (!pagination || pagination.total === 0) return t('listing.noneFound', { noun })

  const key = activeFilterCount > 0 ? 'listing.matching' : 'listing.available'
  return t(key, { count: pagination.total, noun })
}

/**
 * The declarative browse page: a listing query, a set of filter definitions,
 * and a card renderer. Everything structural comes from BrowseLayout, which
 * /jobs and /search render through as well.
 */
function ListingPage({
  badge,
  title,
  subtitle,
  resultsTitle,
  nounKey,
  listing,
  filterDefinitions,
  renderItem,
  withMedia = false,
  seo,
  promo,
  emptyTitle,
  emptyDescription,
}) {
  const { t } = useTranslation()
  const { items, pagination, loading, error, filters, page, setFilter, setPage, clearFilters, activeFilterCount } =
    listing

  // The search box sits in the hero like the jobs page it mirrors; the rail
  // below is left for refinements only, so the query isn't asked for twice.
  const searchDefinition = filterDefinitions.find((definition) => definition.type === 'search')
  const railDefinitions = filterDefinitions.filter((definition) => definition.type !== 'search')

  return (
    <BrowseLayout
      badge={badge}
      title={title}
      subtitle={subtitle}
      resultsTitle={resultsTitle}
      resultsSummary={resultLabel({ t, loading, pagination, activeFilterCount, nounKey })}
      search={
        searchDefinition ? (
          <HeroSearch
            value={filters[searchDefinition.key] ?? ''}
            onChange={(value) => setFilter(searchDefinition.key, value)}
            placeholder={searchDefinition.placeholder}
            buttonLabel={searchDefinition.buttonLabel}
          />
        ) : null
      }
      filters={
        <FilterPanel
          definitions={railDefinitions}
          filters={filters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          activeFilterCount={activeFilterCount}
        />
      }
      seo={seo ? <SeoTextBlock title={seo.title} paragraphs={seo.paragraphs} /> : null}
      promo={promo ? <PromoBanner {...promo} /> : null}
    >
      <ListingGrid
        items={items}
        loading={loading}
        error={error}
        renderItem={renderItem}
        withMedia={withMedia}
        onClear={activeFilterCount > 0 ? clearFilters : undefined}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <div className="mt-8">
        <Paginator page={page} totalPages={pagination?.totalPages ?? 0} onPageChange={setPage} />
      </div>
    </BrowseLayout>
  )
}

export default ListingPage
