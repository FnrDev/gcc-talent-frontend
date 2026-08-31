import { useEffect, useState } from 'react'
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

import Footer from '@/components/landing/Footer'
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
  { value: 'services', label: 'Services', noun: 'services' },
  { value: 'jobs', label: 'Jobs', noun: 'jobs' },
  { value: 'freelancers', label: 'Freelancers', noun: 'freelancers' },
]
const SEARCH_TYPE_VALUES = new Set(SEARCH_TYPES.map((option) => option.value))
const AVAILABILITY_LABELS = {
  full_time: 'Available full time',
  part_time: 'Available part time',
  unavailable: 'Unavailable',
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
              aria-label="Email verified"
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
          {profile.bio || 'This freelancer has not added an introduction yet.'}
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
          {profile.availability ? <span>{AVAILABILITY_LABELS[profile.availability] || profile.availability}</span> : null}
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {Number(profile.completedContracts || 0).toLocaleString()} completed
        </span>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link to={`/profile/${freelancer._id}`} />}
        >
          View profile
        </Button>
      </CardFooter>
    </Card>
  )
}

function SearchPage() {
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
    <div className="flex min-h-svh flex-col bg-muted/20">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary">Marketplace search</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Search jobs, services, and GCC talent
          </h1>
          <p className="mt-3 text-muted-foreground">
            Switch result types without losing the search flow, then open any listing or public profile.
          </p>
        </div>

        <Card className="mx-auto mt-8 max-w-4xl p-3 sm:p-4">
          <form key={`${type}:${query}`} onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
            <NativeSelect name="type" defaultValue={type} className="w-full sm:w-44" aria-label="Search type">
              {SEARCH_TYPES.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>
              ))}
            </NativeSelect>
            <div className="relative min-w-0 flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                name="query"
                defaultValue={query}
                maxLength={100}
                placeholder={`Search ${activeType.noun}`}
                aria-label={`Search ${activeType.noun}`}
                className="pl-9"
              />
            </div>
            <Button type="submit">
              Search
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
            </Button>
          </form>
        </Card>

        <section className="mt-10" aria-live="polite">
          {query ? (
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{activeType.label}</p>
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  Results for “{query}”
                </h2>
              </div>
              {pagination ? (
                <p className="text-sm text-muted-foreground">
                  {pagination.total.toLocaleString()} {activeType.noun}
                </p>
              ) : null}
            </div>
          ) : null}

          {currentResult.error ? (
            <Alert variant="destructive">
              <AlertTitle>Search failed</AlertTitle>
              <AlertDescription>{currentResult.error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : !query ? (
            <Empty className="min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} /></EmptyMedia>
                <EmptyTitle>Start with a name, skill, or project</EmptyTitle>
                <EmptyDescription>
                  Choose services, jobs, or freelancers and enter what you are looking for.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : items.length === 0 ? (
            <Empty className="min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} /></EmptyMedia>
                <EmptyTitle>No {activeType.noun} found</EmptyTitle>
                <EmptyDescription>Try a broader term or switch to another result type.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                if (type === 'jobs') return <JobCard key={item._id} job={item} />
                if (type === 'freelancers') return <FreelancerCard key={item._id} freelancer={item} />
                return <ServiceCard key={item._id} service={item} />
              })}
            </div>
          )}

          {pagination?.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                Next
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
              </Button>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default SearchPage
