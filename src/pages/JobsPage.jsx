import { useCallback, useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Location01Icon,
  Money03Icon,
  RefreshIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { getCategories, getJobs, getSkills } from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import BrowseLayout from '@/components/listing/BrowseLayout'
import UserLink from '@/components/UserLink'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 8
const EMPTY_FILTERS = {
  search: '',
  category: '',
  budgetType: '',
  budgetMin: '',
  budgetMax: '',
  experienceLevel: '',
  skillIds: '',
  datePosted: '',
  sort: '',
}
const FILTER_KEYS = Object.keys(EMPTY_FILTERS)
const VALID_BUDGET_TYPES = new Set(['fixed', 'hourly'])
const VALID_EXPERIENCE_LEVELS = new Set(['entry', 'intermediate', 'expert'])
const VALID_DATE_POSTED = new Set(['24h', '7d', '30d'])
const VALID_SORTS = new Set(['budget_high', 'budget_low'])

const BUDGET_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

const DATE_FORMATTER = new Intl.DateTimeFormat('en-BH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function sanitizeFilters(values) {
  const search = typeof values?.search === 'string' ? values.search.trim() : ''
  const category = typeof values?.category === 'string' ? values.category.trim() : ''
  const budgetType = typeof values?.budgetType === 'string' ? values.budgetType.trim() : ''
  const experienceLevel = typeof values?.experienceLevel === 'string'
    ? values.experienceLevel.trim()
    : ''
  const budgetMin = typeof values?.budgetMin === 'string' ? values.budgetMin.trim() : ''
  const budgetMax = typeof values?.budgetMax === 'string' ? values.budgetMax.trim() : ''
  const skillIds = typeof values?.skillIds === 'string'
    ? [...new Set(values.skillIds.split(',').map((value) => value.trim()).filter(Boolean))].join(',')
    : ''
  const datePosted = typeof values?.datePosted === 'string' ? values.datePosted.trim() : ''
  const sort = typeof values?.sort === 'string' ? values.sort.trim() : ''

  const sanitizedBudgetMin = budgetMin !== '' && Number.isFinite(Number(budgetMin)) && Number(budgetMin) >= 0
    ? budgetMin
    : ''
  const sanitizedBudgetMax = budgetMax !== '' && Number.isFinite(Number(budgetMax)) && Number(budgetMax) >= 0
    ? budgetMax
    : ''

  return {
    search,
    category,
    budgetType: VALID_BUDGET_TYPES.has(budgetType) ? budgetType : '',
    budgetMin: sanitizedBudgetMin,
    budgetMax: sanitizedBudgetMax,
    experienceLevel: VALID_EXPERIENCE_LEVELS.has(experienceLevel) ? experienceLevel : '',
    skillIds,
    datePosted: VALID_DATE_POSTED.has(datePosted) ? datePosted : '',
    sort: VALID_SORTS.has(sort) ? sort : '',
  }
}

function filtersFromSearchParams(searchParams) {
  return sanitizeFilters({
    search: searchParams.get('search'),
    category: searchParams.get('category'),
    budgetType: searchParams.get('budgetType'),
    budgetMin: searchParams.get('budgetMin'),
    budgetMax: searchParams.get('budgetMax'),
    experienceLevel: searchParams.get('experienceLevel'),
    skillIds: searchParams.get('skillIds'),
    datePosted: searchParams.get('datePosted'),
    sort: searchParams.get('sort'),
  })
}

function searchParamsFromFilters(filters) {
  const searchParams = new URLSearchParams()

  for (const key of FILTER_KEYS) {
    if (filters[key]) searchParams.set(key, filters[key])
  }

  return searchParams
}

function filtersMatch(left, right) {
  return FILTER_KEYS.every((key) => left[key] === right[key])
}

function hasAmount(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

function formatBudget(job) {
  const hasMinimum = hasAmount(job.budgetMin)
  const hasMaximum = hasAmount(job.budgetMax)
  const suffix = job.budgetType === 'hourly' ? ' / hour' : ''

  if (hasMinimum && hasMaximum) {
    return `${BUDGET_FORMATTER.format(Number(job.budgetMin))} – ${BUDGET_FORMATTER.format(Number(job.budgetMax))}${suffix}`
  }

  if (hasMinimum) return `From ${BUDGET_FORMATTER.format(Number(job.budgetMin))}${suffix}`
  if (hasMaximum) return `Up to ${BUDGET_FORMATTER.format(Number(job.budgetMax))}${suffix}`
  return 'Budget to be discussed'
}

function formatPostedDate(value) {
  const timestamp = new Date(value).getTime()

  if (!Number.isFinite(timestamp)) return 'Recently posted'

  const elapsedDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))

  if (elapsedDays === 0) return 'Posted today'
  if (elapsedDays === 1) return 'Posted yesterday'
  if (elapsedDays < 7) return `Posted ${elapsedDays} days ago`
  return `Posted ${DATE_FORMATTER.format(new Date(timestamp))}`
}

function JobCard({ job }) {
  const clientLocation = [job.client?.city, job.client?.country].filter(Boolean).join(', ')
  const visibleSkills = job.skills?.slice(0, 5) || []
  const additionalSkills = Math.max(0, (job.skills?.length || 0) - visibleSkills.length)

  return (
    <Card className="gap-0 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{job.category?.name || 'General'}</Badge>
          <span>{formatPostedDate(job.createdAt)}</span>
          {job.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
        </div>
        <CardTitle className="text-xl leading-tight">
          <Link
            to={`/jobs/${job._id}`}
            className="outline-none transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {job.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 pb-5 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            {formatBudget(job)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
            {job.duration || 'Flexible timeline'}
          </span>
          <span className="capitalize text-muted-foreground">
            {job.experienceLevel ? `${job.experienceLevel} level` : 'Any experience level'}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {job.description}
        </p>

        {visibleSkills.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
            {visibleSkills.map((skill) => (
              <Badge key={skill._id || skill.name} variant="outline">
                {skill.name}
              </Badge>
            ))}
            {additionalSkills ? <Badge variant="outline">+{additionalSkills}</Badge> : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <UserLink
              user={job.client}
              showAvatar
              nameClassName="text-sm font-medium text-foreground"
            />
            <div className="mt-1 ps-8">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {clientLocation ? (
                  <>
                    <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3" />
                    <span className="truncate">{clientLocation}</span>
                  </>
                ) : (
                  job.client?.isEmailVerified ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3 text-primary" />
                      Email verified
                    </>
                  ) : (
                    'Marketplace client'
                  )
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-xs text-muted-foreground">
              {job.proposalsCount || 0} {(job.proposalsCount || 0) === 1 ? 'proposal' : 'proposals'}
            </span>
            <Button nativeButton={false} render={<Link to={`/jobs/${job._id}`} />}>
              View job
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JobCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-4 px-5 py-5 sm:px-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-7 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const { t } = useTranslation()
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams))
  const [appliedFilters, setAppliedFilters] = useState(() => filtersFromSearchParams(searchParams))
  const [categories, setCategories] = useState([])
  const [skills, setSkills] = useState([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestSequence = useRef(0)

  useEffect(() => {
    const nextFilters = filtersFromSearchParams(new URLSearchParams(queryString))

    // Browser navigation is an external URL change that intentionally synchronizes page state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((current) => (filtersMatch(current, nextFilters) ? current : nextFilters))
    setAppliedFilters((current) => (filtersMatch(current, nextFilters) ? current : nextFilters))
    setPage((current) => (current === 1 ? current : 1))
  }, [queryString])

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const result = await getCategories()
        if (!cancelled) setCategories(result)
      } catch {
        if (!cancelled) setCategories([])
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSkills() {
      setSkillsLoading(true)

      try {
        const result = await getSkills(filters.category || undefined)
        if (!cancelled) setSkills(result)
      } catch {
        if (!cancelled) setSkills([])
      } finally {
        if (!cancelled) setSkillsLoading(false)
      }
    }

    loadSkills()
    return () => {
      cancelled = true
    }
  }, [filters.category])

  const loadJobs = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError('')

    const params = { page, limit: PAGE_SIZE }
    for (const [key, value] of Object.entries(appliedFilters)) {
      if (value) params[key] = typeof value === 'string' ? value.trim() : value
    }

    try {
      const result = await getJobs(params)
      if (requestId !== requestSequence.current) return

      setJobs(result.jobs || [])
      setPagination(result.pagination || { page, total: 0, totalPages: 0 })
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      setJobs([])
      setError(
        requestError?.response?.data?.message ||
          'We could not load jobs right now. Please try again.',
      )
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    // Fetching the selected results intentionally drives the page loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs()
    return () => {
      requestSequence.current += 1
    }
  }, [loadJobs])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'category' ? { skillIds: '' } : null),
    }))
  }

  function toggleSkill(skillId) {
    setFilters((current) => {
      const selected = current.skillIds ? current.skillIds.split(',').filter(Boolean) : []
      const nextSelected = selected.includes(skillId)
        ? selected.filter((id) => id !== skillId)
        : [...selected, skillId]

      return { ...current, skillIds: nextSelected.join(',') }
    })
  }

  function applyFilters(event) {
    event.preventDefault()
    const nextFilters = sanitizeFilters(filters)
    const nextSearchParams = searchParamsFromFilters(nextFilters)

    setFilters((current) => (filtersMatch(current, nextFilters) ? current : nextFilters))
    setAppliedFilters((current) => (filtersMatch(current, nextFilters) ? current : nextFilters))
    setPage(1)
    if (nextSearchParams.toString() !== queryString) setSearchParams(nextSearchParams)
  }

  function clearFilters() {
    const emptyFilters = { ...EMPTY_FILTERS }

    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(1)
    if (queryString) setSearchParams(new URLSearchParams())
  }

  const filtersAreActive = Object.values(appliedFilters).some(Boolean)
  const resultLabel = t('jobs.count', { count: pagination.total || 0 })

  return (
    <BrowseLayout
      title={t('jobs.title')}
      subtitle={t('jobs.subtitle')}
      search={
        <form onSubmit={applyFilters} className="flex flex-col gap-2 sm:flex-row" role="search">
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="h-11 ps-9"
              placeholder={t('jobs.searchPlaceholder')}
              aria-label={t('jobs.searchPlaceholder')}
            />
          </div>
          <Button type="submit" size="lg" className="h-11 px-5">
            {t('jobs.searchButton')}
          </Button>
        </form>
      }
      filters={
        <form onSubmit={applyFilters} className="grid gap-5">
          <label className="grid gap-1.5 text-sm font-medium">
            {t('jobs.category')}
            <NativeSelect
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full"
            >
              <NativeSelectOption value="">{t('jobs.allCategories')}</NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category._id} value={category._id}>
                  {category.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">{t('jobs.skills')}</legend>
            <div className="max-h-44 overflow-y-auto rounded-lg border p-2">
              {skillsLoading ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">{t('jobs.loadingSkills')}</p>
              ) : skills.length ? (
                <div className="flex flex-wrap gap-1.5" aria-label={t('jobs.filterBySkills')}>
                  {skills.map((skill) => {
                    const selected = filters.skillIds.split(',').filter(Boolean).includes(skill._id)

                    return (
                      <button
                        key={skill._id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleSkill(skill._id)}
                        className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                      >
                        {skill.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="px-1 py-2 text-xs text-muted-foreground">{t('jobs.noSkills')}</p>
              )}
            </div>
          </fieldset>

          <label className="grid gap-1.5 text-sm font-medium">
            {t('jobs.budgetType')}
            <NativeSelect
              name="budgetType"
              value={filters.budgetType}
              onChange={handleFilterChange}
              className="w-full"
            >
              <NativeSelectOption value="">{t('jobs.anyBudgetType')}</NativeSelectOption>
              <NativeSelectOption value="fixed">{t('jobs.fixedPrice')}</NativeSelectOption>
              <NativeSelectOption value="hourly">{t('jobs.hourlyRate')}</NativeSelectOption>
            </NativeSelect>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1.5 text-sm font-medium">
              {t('jobs.minBudget')}
              <Input
                name="budgetMin"
                type="number"
                min="0"
                step="0.001"
                inputMode="decimal"
                value={filters.budgetMin}
                onChange={handleFilterChange}
                placeholder="0"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              {t('jobs.maxBudget')}
              <Input
                name="budgetMax"
                type="number"
                min="0"
                step="0.001"
                inputMode="decimal"
                value={filters.budgetMax}
                onChange={handleFilterChange}
                placeholder={t('jobs.any')}
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium">
            {t('jobs.experience')}
            <NativeSelect
              name="experienceLevel"
              value={filters.experienceLevel}
              onChange={handleFilterChange}
              className="w-full"
            >
              <NativeSelectOption value="">{t('jobs.anyLevel')}</NativeSelectOption>
              <NativeSelectOption value="entry">{t('jobs.entryLevel')}</NativeSelectOption>
              <NativeSelectOption value="intermediate">{t('jobs.intermediate')}</NativeSelectOption>
              <NativeSelectOption value="expert">{t('jobs.expert')}</NativeSelectOption>
            </NativeSelect>
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            {t('jobs.datePosted')}
            <NativeSelect
              name="datePosted"
              value={filters.datePosted}
              onChange={handleFilterChange}
              className="w-full"
            >
              <NativeSelectOption value="">{t('jobs.anyTime')}</NativeSelectOption>
              <NativeSelectOption value="24h">{t('jobs.past24h')}</NativeSelectOption>
              <NativeSelectOption value="7d">{t('jobs.past7d')}</NativeSelectOption>
              <NativeSelectOption value="30d">{t('jobs.past30d')}</NativeSelectOption>
            </NativeSelect>
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            {t('jobs.sortBy')}
            <NativeSelect
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className="w-full"
            >
              <NativeSelectOption value="">{t('jobs.newestFirst')}</NativeSelectOption>
              <NativeSelectOption value="budget_high">{t('jobs.budgetHighToLow')}</NativeSelectOption>
              <NativeSelectOption value="budget_low">{t('jobs.budgetLowToHigh')}</NativeSelectOption>
            </NativeSelect>
          </label>

          <Button type="submit" className="w-full">{t('common.applyFilters')}</Button>
          {filtersAreActive ? (
            <Button type="button" variant="ghost" className="w-full" onClick={clearFilters}>
              {t('common.clearFilters')}
            </Button>
          ) : null}
        </form>
      }
      resultsTitle={t('jobs.resultsTitle')}
      resultsSummary={loading ? t('jobs.finding') : resultLabel}
      resultsAction={
        !loading && !error ? (
          <Button variant="outline" size="sm" onClick={loadJobs} aria-label={t('jobs.refreshLabel')}>
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </Button>
        ) : null
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{t('jobs.unavailableTitle')}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button type="button" size="sm" variant="outline" onClick={loadJobs}>
              {t('common.tryAgain')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)}
        </div>
      ) : jobs.length ? (
        <div className="grid gap-4">
          {jobs.map((job) => <JobCard key={job._id} job={job} />)}
        </div>
      ) : (
        <Card>
          <Empty className="min-h-72">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>{t('jobs.emptyTitle')}</EmptyTitle>
              <EmptyDescription>
                {t('jobs.emptyDescription')}
              </EmptyDescription>
            </EmptyHeader>
            {filtersAreActive ? (
              <EmptyContent>
                <Button variant="outline" onClick={clearFilters}>{t('common.clearFilters')}</Button>
              </EmptyContent>
            ) : null}
          </Empty>
        </Card>
      )}

      {!loading && !error && pagination.totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label={t('jobs.pagesLabel')}>
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            <Trans
              i18nKey="common.pageOf"
              values={{ page: pagination.page, total: pagination.totalPages }}
              components={[<span key="0" className="font-medium text-foreground" />]}
            />
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            disabled={page >= pagination.totalPages}
          >
            {t('common.next')}
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </nav>
      ) : null}
    </BrowseLayout>
  )
}

export default JobsPage
