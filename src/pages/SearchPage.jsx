import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  Location01Icon,
  Search01Icon,
  StarIcon,
} from '@hugeicons/core-free-icons'

import BrowseLayout from '@/components/listing/BrowseLayout'
import JobCard from '@/components/listing/JobCard'
import ServiceCard from '@/components/listing/ServiceCard'
import UserLink from '@/components/UserLink'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { searchMarketplace } from '@/services/generalService'

const PAGE_SIZE = 12
const SEARCH_TYPES = [
  { value: 'services', labelKey: 'search.typeServices', nounKey: 'search.nounServices' },
  { value: 'jobs', labelKey: 'search.typeJobs', nounKey: 'search.nounJobs' },
  { value: 'freelancers', labelKey: 'search.typeFreelancers', nounKey: 'search.nounFreelancers' },
]
const SEARCH_TYPE_VALUES = new Set(SEARCH_TYPES.map((option) => option.value))
const AVAILABILITY_KEYS = {
  full_time: 'search.availabilityFullTime',
  part_time: 'search.availabilityPartTime',
  unavailable: 'search.availabilityUnavailable',
}

function normalizeType(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (normalized === 'gigs') return 'services'
  return SEARCH_TYPE_VALUES.has(normalized) ? normalized : 'services'
}

function normalizePage(value) {
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function FreelancerCard({ freelancer }) {
  const { t } = useTranslation()
  const profile = freelancer.profile || {}
  const skills = Array.isArray(profile.skills) ? profile.skills.slice(0, 4) : []
  const location = [freelancer.city, freelancer.country].filter(Boolean).join(', ')
  const rating = Number(freelancer.ratingAvg || 0)
  const ratingCount = Number(freelancer.ratingCount || 0)
  const hourlyRate = Number(profile.hourlyRate)

  return (
    <Card className="h-full gap-4">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <UserLink
            user={freelancer}
            showAvatar
            avatarSize="lg"
            nameClassName="font-heading text-base font-semibold text-foreground"
          />
          {freelancer.isEmailVerified ? (
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              className="size-5 shrink-0 text-primary"
              aria-label={t('search.emailVerified')}
            />
          ) : null}
        </div>
        <div>
          <p className="font-medium text-foreground">{profile.headline || 'Freelance professional'}</p>
          {location ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" />
              {location}
            </p>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {profile.bio || t('search.noIntroduction')}
        </p>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <Badge key={skill._id || skill.name} variant="secondary">{skill.name}</Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-3.5 text-primary" />
            <strong className="font-medium text-foreground">{rating.toFixed(1)}</strong>
            ({ratingCount})
          </span>
          {Number.isFinite(hourlyRate) ? (
            <span>{formatCurrency(hourlyRate, profile.currency)}/hr</span>
          ) : null}
          {profile.availability ? (
            <span>
              {AVAILABILITY_KEYS[profile.availability] ? t(AVAILABILITY_KEYS[profile.availability]) : profile.availability}
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {t('search.completedContracts', { count: Number(profile.completedContracts || 0) })}
        </span>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link to={`/profile/${freelancer._id}`} />}
        >
          {t('search.viewProfile')}
        </Button>
      </CardFooter>
    </Card>
  )
}

function SearchPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const type = normalizeType(searchParams.get('type'))
  const query = (searchParams.get('query') || '').trim()
  const page = normalizePage(searchParams.get('page'))
  const requestKey = `${type}\u0000${query}\u0000${page}`
  const [result, setResult] = useState({ key: null, data: null, error: '' })

  useEffect(() => {
    if (!query) return undefined

    let cancelled = false
    searchMarketplace({ type, query, page, limit: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: '' })
      })
      .catch((error) => {
        if (cancelled) return
        setResult({
          key: requestKey,
          data: null,
          error: error?.response?.data?.message || 'Search is unavailable right now.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [page, query, requestKey, type])

  const currentResult = result.key === requestKey ? result : { data: null, error: '' }
  const loading = Boolean(query) && result.key !== requestKey
  const items = Array.isArray(currentResult.data?.results) ? currentResult.data.results : []
  const pagination = currentResult.data?.pagination || null
  const activeType = SEARCH_TYPES.find((option) => option.value === type) || SEARCH_TYPES[0]
  const activeNoun = t(activeType.nounKey)

  function submitSearch(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextType = normalizeType(form.get('type'))
    const nextQuery = String(form.get('query') || '').trim()
    const next = new URLSearchParams({ type: nextType })
    if (nextQuery) next.set('query', nextQuery)
    setSearchParams(next)
  }

  function setPage(nextPage) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextPage > 1) next.set('page', String(nextPage))
      else next.delete('page')
      return next
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <BrowseLayout
      badge={
        <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          {t('search.badge')}
        </Badge>
      }
      title={t('search.title')}
      subtitle={t('search.subtitle')}
      search={
        <form key={`hero:${query}`} onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row" role="search">
          <input type="hidden" name="type" value={type} />
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              name="query"
              defaultValue={query}
              maxLength={100}
              className="h-11 ps-9"
              placeholder={t('search.searchPlaceholder', { noun: activeNoun })}
              aria-label={t('search.searchPlaceholder', { noun: activeNoun })}
            />
          </div>
          <Button type="submit" size="lg" className="h-11 px-5">
            {t('common.search')}
          </Button>
        </form>
      }
      filters={
        <form key={`rail:${type}:${query}`} onSubmit={submitSearch} className="grid gap-5">
          <label className="grid gap-1.5 text-sm font-medium">
            {t('search.resultType')}
            <NativeSelect name="type" defaultValue={type} className="w-full" aria-label={t('search.resultType')}>
              {SEARCH_TYPES.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>{t(option.labelKey)}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          {/* Carries the hero's query through so switching type refines the
              current search instead of clearing it. */}
          <input type="hidden" name="query" value={query} />

          <Button type="submit" className="w-full">{t('common.applyFilters')}</Button>
          {query ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setSearchParams(new URLSearchParams({ type }))}
            >
              {t('common.clearFilters')}
            </Button>
          ) : null}
        </form>
      }
      resultsTitle={query ? t('search.resultsFor', { query }) : t(activeType.labelKey)}
      resultsSummary={
        loading
          ? t('search.searching')
          : !query
            ? t('search.enterKeyword', { noun: activeNoun })
            : pagination
              ? t('search.totalCount', { count: pagination.total, noun: activeNoun })
              : t('search.noneFound', { noun: activeNoun })
      }
    >
      {currentResult.error ? (
        <Alert variant="destructive">
          <AlertTitle>{t('search.failedTitle')}</AlertTitle>
          <AlertDescription>{currentResult.error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : !query ? (
        <Empty className="min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} /></EmptyMedia>
            <EmptyTitle>{t('search.startTitle')}</EmptyTitle>
            <EmptyDescription>
              {t('search.startDescription')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : items.length === 0 ? (
        <Empty className="min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} /></EmptyMedia>
            <EmptyTitle>{t('search.noneFound', { noun: activeNoun })}</EmptyTitle>
            <EmptyDescription>{t('search.emptyDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => {
            if (type === 'jobs') return <JobCard key={item._id} job={item} />
            if (type === 'freelancers') return <FreelancerCard key={item._id} freelancer={item} />
            return <ServiceCard key={item._id} service={item} />
          })}
        </div>
      )}

      {pagination?.totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label={t('search.pagesLabel')}>
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            <Trans
              i18nKey="common.pageOf"
              values={{ page, total: pagination.totalPages }}
              components={[<span key="0" className="font-medium text-foreground" />]}
            />
          </span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
            {t('common.next')}
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
          </Button>
        </nav>
      ) : null}
    </BrowseLayout>
  )
}

export default SearchPage
