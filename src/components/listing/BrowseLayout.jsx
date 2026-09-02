import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import DitheredWaves from '@/components/landing/DitheredWaves'
import { HERO_WAVES, HERO_WAVES_FALLBACK, HERO_WAVES_SCRIM } from '@/components/landing/heroWaves'
import Footer from '@/components/landing/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * The shared browse-page shell for /jobs, /services, and /search.
 *
 * Extracted from the jobs page, which had grown its own copy of this layout
 * and drifted away from the others. Every browse page now renders through
 * here, so the hero, the sticky filter rail, and the results column can only
 * change in one place.
 *
 * Pages supply slots rather than configuration: `search` and `filters` are
 * whole nodes because each page's controls differ enough that a shared
 * abstraction over them would be a worse fit than passing the markup in.
 */
function BrowseLayout({
  badge,
  title,
  subtitle,
  search,
  filters,
  filtersTitle,
  resultsTitle,
  resultsSummary,
  resultsAction,
  seo,
  promo,
  children,
}) {
  const { t } = useTranslation()
  const headingId = useId()

  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1 bg-muted/30">
        {/* The browse header carries the landing hero's backdrop, so /jobs,
            /services and /search open on the same surface the home page does.
            It runs up under the floating nav pill the way the hero does. */}
        <section className="relative isolate -mt-22 overflow-hidden text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
            <DitheredWaves colors={HERO_WAVES} fallbackClassName={HERO_WAVES_FALLBACK} />
            <div className={`absolute inset-0 ${HERO_WAVES_SCRIM}`} />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 pt-28 pb-12 sm:pb-14">
            {/* The pages hand over a `variant="outline"` badge built for a
                light surface; this restates it for the blue rather than making
                three call sites each know what they are sitting on. */}
            <div className="[&>*]:border-white/35! [&>*]:bg-white/12! [&>*]:text-white! [&>*]:backdrop-blur-sm">
              {badge}
            </div>
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
              <p className="mt-3 text-base leading-7 text-white/90 sm:text-lg">{subtitle}</p>
            </div>
            {/* The pages' search fields are built for a light page: shadcn's
                Input is transparent, which leaves the placeholder almost
                invisible on this surface. Giving them a card fill here keeps
                the three call sites unaware of what they sit on. */}
            {search ? (
              <div className="mt-7 max-w-3xl [&_input]:border-transparent! [&_input]:bg-card! [&_input]:text-foreground!">
                {search}
              </div>
            ) : null}
          </div>
        </section>

        {/* 18rem rail: wide enough that skill chips and the paired min/max
            budget inputs stop wrapping awkwardly, while three result cards
            still fit across the remaining column. */}
        <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">{filtersTitle ?? t('common.refineResults')}</CardTitle>
              </CardHeader>
              <CardContent>{filters}</CardContent>
            </Card>
          </aside>

          <section aria-labelledby={headingId} className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 id={headingId} className="text-xl font-semibold">{resultsTitle}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground" aria-live="polite">
                  {resultsSummary}
                </p>
              </div>
              {resultsAction}
            </div>

            {children}
          </section>
        </div>

        {seo ? <div className="mx-auto max-w-6xl px-4 pb-12">{seo}</div> : null}
      </main>

      {promo}
      <Footer />
    </div>
  )
}

export default BrowseLayout
