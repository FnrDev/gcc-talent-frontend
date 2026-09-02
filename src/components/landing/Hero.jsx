import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/context/CategoryContext'
import DitheredWaves from './DitheredWaves'
import { HERO_WAVES, HERO_WAVES_FALLBACK, HERO_WAVES_SCRIM } from './heroWaves'
import { selectLandingCategories } from './categories'
import { cn } from '@/lib/utils'

const TARGETS = [
  { value: 'services', labelKey: 'home.targetServices', placeholderKey: 'home.placeholderServices' },
  { value: 'jobs', labelKey: 'home.targetJobs', placeholderKey: 'home.placeholderJobs' },
  { value: 'freelancers', labelKey: 'home.targetFreelancers', placeholderKey: 'home.placeholderFreelancers' },
]

function Hero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { categories, loading, error, refreshCategories } = useCategories()
  const visibleCategories = selectLandingCategories(categories)
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState('services')

  const active = TARGETS.find((option) => option.value === target)

  const submit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    const params = new URLSearchParams({ type: target })
    if (trimmed) params.set('query', trimmed)
    navigate(`/search?${params.toString()}`)
  }

  return (
    // The negative margin is on the wrapper, not the card: it cancels the
    // header's height so the padding below it lands the card 12px from the top
    // of the viewport, with the floating nav pill sitting over the blue.
    <div className="-mt-22 bg-paper p-3 sm:p-4">
      <section
        id="top"
        className="relative isolate overflow-hidden rounded-3xl text-white"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <DitheredWaves colors={HERO_WAVES} fallbackClassName={HERO_WAVES_FALLBACK} />
          <div className={`absolute inset-0 ${HERO_WAVES_SCRIM}`} />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-20">
          <p className="text-sm font-medium text-white/75">{t('home.heroEyebrow')}</p>

          <h1 className="mt-6 font-display text-4xl leading-[1.15] font-black text-balance text-white sm:mt-7 sm:text-5xl lg:text-6xl">
            {t('home.heroTitle')}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-white/75 sm:mt-6 sm:text-lg">
            {t('home.heroSubtitle')}
          </p>

          {/* Search. The tab row is a pill on the field; the field itself is a
              solid white pill, so the one opaque object on the blue is the thing
              you are meant to type into. */}
          <div className="mt-7 flex w-full flex-col items-center gap-3 sm:mt-8">
            <div
              role="tablist"
              aria-label={t('home.heroTabsLabel')}
              className="flex gap-1 rounded-full bg-white/12 p-1 ring-1 ring-white/20 backdrop-blur-sm"
            >
              {TARGETS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={target === option.value}
                  onClick={() => setTarget(option.value)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    target === option.value
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-white/85 hover:bg-white/15 hover:text-white',
                  )}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>

            <form
              onSubmit={submit}
              className="flex w-full items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_18px_44px_-18px_rgba(6,24,43,0.65)] transition-shadow focus-within:ring-2 focus-within:ring-white/70"
            >
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="ms-3 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(active.placeholderKey)}
                aria-label={t(active.labelKey)}
                className="h-11 min-w-0 flex-1 bg-transparent px-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="lg" className="h-11 shrink-0 rounded-full px-5 text-base">
                {t('common.search')}
                {/* Forward is leftward in Arabic, so the arrow turns with the
                    reading direction rather than pointing back at the field. */}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                  className="hidden sm:block rtl:rotate-180"
                />
              </Button>
            </form>
          </div>

          {/* Category shortcuts. Links follow the toggle rather than always
              pointing at /jobs, so they match what the selected tab promises. */}
          <div className="mt-4 flex min-h-8 flex-wrap items-center justify-center gap-2">
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-7 w-24 rounded-full bg-white/15" />
              ))
            ) : error ? (
              <div role="alert" className="flex items-center gap-2 text-sm text-white/90">
                <span>{t('home.categoriesUnavailable')}</span>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="text-white underline"
                  onClick={refreshCategories}
                >
                  {t('common.tryAgain')}
                </Button>
              </div>
            ) : visibleCategories.length === 0 ? (
              <p className="text-sm text-white/90">{t('home.noCategoriesYet')}</p>
            ) : (
              <>
                <span className="text-sm text-white/90">{t('home.popularPrefix')}</span>
                {visibleCategories.map((category) => (
                  <Link
                    key={category._id || category.slug || category.name}
                    to={target === 'jobs'
                      ? `/jobs?category=${encodeURIComponent(category._id)}`
                      : `/search?type=${target}&query=${encodeURIComponent(category.name)}`}
                    className="rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    {category.name}
                  </Link>
                ))}
              </>
            )}
          </div>

        </div>
      </section>
    </div>
  )
}

export default Hero
