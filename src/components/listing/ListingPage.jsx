import FilterBar from './FilterBar'
import ListingGrid from './ListingGrid'
import Paginator from './Paginator'
import SeoTextBlock from './SeoTextBlock'
import PromoBanner from '@/components/landing/PromoBanner'
import Footer from '@/components/landing/Footer'

function resultLabel({ loading, pagination, activeFilterCount, noun }) {
  if (loading) return 'Loading…'
  if (!pagination || pagination.total === 0) return `No ${noun} found`

  const suffix = activeFilterCount > 0 ? ' match your filters' : ' available'
  return `${pagination.total} ${pagination.total === 1 ? noun.replace(/s$/, '') : noun}${suffix}`
}

/**
 * The shared browse-page shell. Both /jobs and /services are this component
 * plus a listing query, a set of filter definitions, and a card renderer —
 * everything that genuinely differs between the two.
 */
function ListingPage({
  title,
  subtitle,
  noun,
  listing,
  filterDefinitions,
  renderItem,
  withMedia = false,
  seo,
  promo,
  emptyTitle,
  emptyDescription,
}) {
  const { items, pagination, loading, error, filters, page, setFilter, setPage, clearFilters, activeFilterCount } =
    listing

  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </header>

        <FilterBar
          definitions={filterDefinitions}
          filters={filters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          activeFilterCount={activeFilterCount}
          resultLabel={resultLabel({ loading, pagination, activeFilterCount, noun })}
        />

        <div className="mt-6">
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
        </div>

        <div className="mt-8">
          <Paginator page={page} totalPages={pagination?.totalPages ?? 0} onPageChange={setPage} />
        </div>

        <div className="mt-12">
          <SeoTextBlock title={seo.title} paragraphs={seo.paragraphs} />
        </div>
      </main>

      <PromoBanner {...promo} />
      <Footer />
    </div>
  )
}

export default ListingPage
