import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase02Icon,
  Clock01Icon,
  Location01Icon,
  Money03Icon,
  RefreshIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { getCategories, getJobs } from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  experienceLevel: '',
}
const FILTER_KEYS = Object.keys(EMPTY_FILTERS)
const VALID_BUDGET_TYPES = new Set(['fixed', 'hourly'])
const VALID_EXPERIENCE_LEVELS = new Set(['entry', 'intermediate', 'expert'])

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

  return {
    search,
    category,
    budgetType: VALID_BUDGET_TYPES.has(budgetType) ? budgetType : '',
    experienceLevel: VALID_EXPERIENCE_LEVELS.has(experienceLevel) ? experienceLevel : '',
  }
}

function filtersFromSearchParams(searchParams) {
  return sanitizeFilters({
    search: searchParams.get('search'),
    category: searchParams.get('category'),
    budgetType: searchParams.get('budgetType'),
    experienceLevel: searchParams.get('experienceLevel'),
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

function avatarFallback(name) {
  return name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'GT'
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
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar size="sm">
              {job.client?.avatarUrl ? <AvatarImage src={job.client.avatarUrl} alt="" /> : null}
              <AvatarFallback>{avatarFallback(job.client?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{job.client?.name || 'GCC Talents client'}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {clientLocation ? (
                  <>
                    <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3" />
                    <span className="truncate">{clientLocation}</span>
                  </>
                ) : (
                  'Verified marketplace client'
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
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams))
  const [appliedFilters, setAppliedFilters] = useState(() => filtersFromSearchParams(searchParams))
  const [categories, setCategories] = useState([])
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
    setFilters((current) => ({ ...current, [name]: value }))
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
  const resultLabel = pagination.total === 1 ? '1 open job' : `${pagination.total || 0} open jobs`

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30">
      <section className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1">
            <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />
            GCC opportunities
          </Badge>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Find work that fits your expertise
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
              Explore open projects from clients across the GCC, compare the scope, and send a focused proposal.
            </p>
          </div>

          <form onSubmit={applyFilters} className="mt-7 flex max-w-3xl flex-col gap-2 sm:flex-row" role="search">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="h-11 pl-9"
                placeholder="Search by title or keyword"
                aria-label="Search jobs"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 px-5">
              Search jobs
            </Button>
          </form>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Refine results</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={applyFilters} className="grid gap-5">
                <label className="grid gap-1.5 text-sm font-medium">
                  Category
                  <NativeSelect
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full"
                  >
                    <NativeSelectOption value="">All categories</NativeSelectOption>
                    {categories.map((category) => (
                      <NativeSelectOption key={category._id} value={category._id}>
                        {category.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>

                <label className="grid gap-1.5 text-sm font-medium">
                  Budget
                  <NativeSelect
                    name="budgetType"
                    value={filters.budgetType}
                    onChange={handleFilterChange}
                    className="w-full"
                  >
                    <NativeSelectOption value="">Any budget type</NativeSelectOption>
                    <NativeSelectOption value="fixed">Fixed price</NativeSelectOption>
                    <NativeSelectOption value="hourly">Hourly rate</NativeSelectOption>
                  </NativeSelect>
                </label>

                <label className="grid gap-1.5 text-sm font-medium">
                  Experience
                  <NativeSelect
                    name="experienceLevel"
                    value={filters.experienceLevel}
                    onChange={handleFilterChange}
                    className="w-full"
                  >
                    <NativeSelectOption value="">Any level</NativeSelectOption>
                    <NativeSelectOption value="entry">Entry level</NativeSelectOption>
                    <NativeSelectOption value="intermediate">Intermediate</NativeSelectOption>
                    <NativeSelectOption value="expert">Expert</NativeSelectOption>
                  </NativeSelect>
                </label>

                <Button type="submit" className="w-full">Apply filters</Button>
                {filtersAreActive ? (
                  <Button type="button" variant="ghost" className="w-full" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </aside>

        <section aria-labelledby="jobs-heading" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 id="jobs-heading" className="text-xl font-semibold">Open jobs</h2>
              <p className="mt-0.5 text-sm text-muted-foreground" aria-live="polite">
                {loading ? 'Finding the latest opportunities…' : resultLabel}
              </p>
            </div>
            {!loading && !error ? (
              <Button variant="outline" size="sm" onClick={loadJobs} aria-label="Refresh jobs">
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            ) : null}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Jobs are unavailable</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                <span>{error}</span>
                <Button type="button" size="sm" variant="outline" onClick={loadJobs}>
                  Try again
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
                  <EmptyTitle>No matching jobs</EmptyTitle>
                  <EmptyDescription>
                    Try a broader keyword or remove one of your filters.
                  </EmptyDescription>
                </EmptyHeader>
                {filtersAreActive ? (
                  <EmptyContent>
                    <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            </Card>
          )}

          {!loading && !error && pagination.totalPages > 1 ? (
            <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Job result pages">
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{pagination.page}</span> of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page >= pagination.totalPages}
              >
                Next
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default JobsPage
