import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Briefcase02Icon,
  Calendar03Icon,
  Clock01Icon,
  File02Icon,
  Money03Icon,
  SentIcon,
} from '@hugeicons/core-free-icons'
import { getMyProposals } from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'

const PROPOSAL_STATUSES = ['pending', 'shortlisted', 'accepted', 'declined', 'withdrawn']

const BHD_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function formatDate(value) {
  if (!value) return 'Unknown date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return new Intl.DateTimeFormat('en-BH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function statusVariant(status) {
  if (status === 'accepted') return 'default'
  if (status === 'declined' || status === 'withdrawn') return 'destructive'
  if (status === 'shortlisted') return 'secondary'
  return 'outline'
}

function normalizeResult(result) {
  const data = result?.data || result || {}

  return {
    proposals: Array.isArray(data) ? data : data.proposals || [],
    pagination: data.pagination || {
      page: 1,
      total: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
    },
  }
}

function LoadingProposals() {
  return (
    <div className="grid gap-4" aria-label="Loading your proposals">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MyProposalsPage() {
  const [proposals, setProposals] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProposals = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = normalizeResult(await getMyProposals({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      }))
      setProposals(result.proposals)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not load your proposals. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    // Loading remote page data is the external synchronization handled by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProposals()
  }, [loadProposals])

  const resultSummary = useMemo(() => {
    const total = pagination.total ?? proposals.length
    if (total === 0) return 'No proposals'
    return `${total} ${total === 1 ? 'proposal' : 'proposals'}`
  }, [pagination.total, proposals.length])

  function handleStatusChange(event) {
    setStatus(event.target.value)
    setPage(1)
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-primary">Freelancer workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">My proposals</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Follow every proposal from submission to the client&apos;s final decision.
          </p>
        </header>

        <section className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <HugeiconsIcon icon={SentIcon} className="size-4" />
            <span>{loading ? 'Loading proposals…' : resultSummary}</span>
          </div>
          <NativeSelect
            className="h-9 w-full capitalize sm:w-44"
            aria-label="Filter proposals by status"
            value={status}
            onChange={handleStatusChange}
          >
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            {PROPOSAL_STATUSES.map((proposalStatus) => (
              <NativeSelectOption key={proposalStatus} value={proposalStatus}>
                {proposalStatus}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </section>

        {error ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Could not load proposals</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadProposals}>Try again</Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? <LoadingProposals /> : null}

        {!loading && !error && proposals.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent className="mx-auto flex max-w-md flex-col items-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={File02Icon} className="size-6" />
              </span>
              <h2 className="text-lg font-semibold">
                {status ? `No ${status} proposals` : 'No proposals yet'}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {status
                  ? 'Try another status or view all of your proposals.'
                  : 'Browse available jobs and send a tailored proposal when you find the right fit.'}
              </p>
              {status ? (
                <Button className="mt-5" variant="outline" onClick={() => setStatus('')}>View all proposals</Button>
              ) : (
                <Button className="mt-5" nativeButton={false} render={<Link to="/jobs" />}>
                  <HugeiconsIcon icon={Briefcase02Icon} data-icon="inline-start" />
                  Browse jobs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && proposals.length > 0 ? (
          <div className="grid gap-4">
            {proposals.map((proposal) => {
              const job = proposal.job
              const jobId = typeof job === 'object' ? job?._id : job
              const jobStatus = typeof job === 'object' ? job?.status : ''
              const isJobOpen = jobStatus === 'open'

              return (
                <Card key={proposal._id} className="transition-shadow hover:shadow-sm">
                  <CardContent>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="capitalize" variant={statusVariant(proposal.status)}>
                            {proposal.status}
                          </Badge>
                          {job?.status ? (
                            <span className="text-xs capitalize text-muted-foreground">
                              Job {job.status.replaceAll('_', ' ')}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">
                          {job?.title || 'Job proposal'}
                        </h2>
                        <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {proposal.coverLetter}
                        </p>

                        {proposal.status === 'declined' && proposal.declineReason ? (
                          <div className="mt-4 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            <span className="font-medium">Client note:</span> {proposal.declineReason}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Money03Icon} className="size-4" />
                            {BHD_FORMATTER.format(proposal.amount || 0)} proposed
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                            {proposal.deliveryDays || 0} {(proposal.deliveryDays || 0) === 1 ? 'day' : 'days'} delivery
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                            Sent {formatDate(proposal.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 border-t pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                        {jobId && isJobOpen ? (
                          <Button
                            className="w-full sm:w-auto"
                            variant="outline"
                            nativeButton={false}
                            render={<Link to={`/jobs/${jobId}`} />}
                          >
                            View job
                            <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                          </Button>
                        ) : (
                          <span className="text-sm capitalize text-muted-foreground">
                            {jobStatus ? `Job ${jobStatus.replaceAll('_', ' ')}` : 'Job unavailable'}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : null}

        {!loading && !error && pagination.totalPages > 1 ? (
          <nav className="mt-7 flex items-center justify-between" aria-label="Proposals pagination">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page || page} of {pagination.totalPages}
            </span>
            <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </nav>
        ) : null}
      </div>
    </main>
  )
}

export default MyProposalsPage
