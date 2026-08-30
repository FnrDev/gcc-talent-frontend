import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Briefcase02Icon,
  Calendar03Icon,
  PlusSignIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { getMyJobs, publishJob } from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'

const JOB_STATUSES = ['draft', 'open', 'in_progress', 'completed', 'closed']

const BUDGET_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function formatDate(value) {
  if (!value) return 'No date set'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No date set'

  return new Intl.DateTimeFormat('en-BH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatBudget(job) {
  const minimum = Number.isFinite(job?.budgetMin) ? job.budgetMin : null
  const maximum = Number.isFinite(job?.budgetMax) ? job.budgetMax : null

  if (minimum !== null && maximum !== null) {
    return `${BUDGET_FORMATTER.format(minimum)} – ${BUDGET_FORMATTER.format(maximum)}`
  }

  if (minimum !== null) return `From ${BUDGET_FORMATTER.format(minimum)}`
  if (maximum !== null) return `Up to ${BUDGET_FORMATTER.format(maximum)}`

  return 'Budget not specified'
}

function statusLabel(status) {
  return status?.replaceAll('_', ' ') || 'draft'
}

function statusVariant(status) {
  if (status === 'open' || status === 'completed') return 'default'
  if (status === 'closed') return 'destructive'
  if (status === 'in_progress') return 'secondary'
  return 'outline'
}

function normalizeResult(result) {
  const data = result?.data || result || {}

  return {
    jobs: Array.isArray(data) ? data : data.jobs || [],
    pagination: data.pagination || {
      page: 1,
      total: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
    },
  }
}

function LoadingJobs() {
  return (
    <div className="grid gap-4" aria-label="Loading your jobs">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MyJobsPage() {
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publishingJobId, setPublishingJobId] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = normalizeResult(await getMyJobs({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      }))
      setJobs(result.jobs)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not load your jobs. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    // Loading remote page data is the external synchronization handled by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs()
  }, [loadJobs])

  const resultSummary = useMemo(() => {
    const total = pagination.total ?? jobs.length
    if (total === 0) return 'No jobs'
    return `${total} ${total === 1 ? 'job' : 'jobs'}`
  }, [jobs.length, pagination.total])

  function handleStatusChange(event) {
    setStatus(event.target.value)
    setPage(1)
  }

  async function handlePublish(jobId) {
    setPublishingJobId(jobId)
    setActionError('')
    setActionSuccess('')

    try {
      await publishJob(jobId)
      setActionSuccess('Your draft is now open for proposals.')
      await loadJobs()
    } catch (requestError) {
      setActionError(getRequestError(requestError, 'We could not publish this draft. Please try again.'))
    } finally {
      setPublishingJobId('')
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Hiring workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">My jobs</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Track every job you have posted and review proposals from interested freelancers.
            </p>
          </div>
          <Button className="h-10 self-start px-4 sm:self-auto" nativeButton={false} render={<Link to="/jobs/new" />}>
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            Create a job
          </Button>
        </header>

        <section className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-4" />
            <span>{loading ? 'Loading jobs…' : resultSummary}</span>
          </div>
          <NativeSelect
            className="h-9 w-full capitalize sm:w-44"
            aria-label="Filter jobs by status"
            value={status}
            onChange={handleStatusChange}
          >
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            {JOB_STATUSES.map((jobStatus) => (
              <NativeSelectOption key={jobStatus} value={jobStatus}>
                {statusLabel(jobStatus)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </section>

        {actionSuccess ? (
          <Alert className="mb-5 border-primary/20 bg-primary/5">
            <AlertTitle>Job published</AlertTitle>
            <AlertDescription>{actionSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {actionError ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Could not publish job</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Could not load jobs</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadJobs}>Try again</Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? <LoadingJobs /> : null}

        {!loading && !error && jobs.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent className="mx-auto flex max-w-md flex-col items-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={Briefcase02Icon} className="size-6" />
              </span>
              <h2 className="text-lg font-semibold">
                {status ? `No ${statusLabel(status)} jobs` : 'Create your first job'}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {status
                  ? 'Try another status or view all of your jobs.'
                  : 'Describe the work you need and start receiving proposals from freelancers.'}
              </p>
              {status ? (
                <Button className="mt-5" variant="outline" onClick={() => setStatus('')}>View all jobs</Button>
              ) : (
                <Button className="mt-5" nativeButton={false} render={<Link to="/jobs/new" />}>
                  <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
                  Create a job
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job._id} className="transition-shadow hover:shadow-sm">
                <CardContent>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="capitalize" variant={statusVariant(job.status)}>
                          {statusLabel(job.status)}
                        </Badge>
                        {job.category?.name ? (
                          <span className="text-xs text-muted-foreground">{job.category.name}</span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">{job.title}</h2>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={UserGroupIcon} className="size-4" />
                          {job.proposalsCount || 0} {(job.proposalsCount || 0) === 1 ? 'proposal' : 'proposals'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                          Created {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 border-t pt-4 sm:min-w-52 sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                      <div className="sm:text-right">
                        <p className="font-semibold">{formatBudget(job)}</p>
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">{job.budgetType || 'fixed'} budget</p>
                      </div>
                      {job.status === 'draft' ? (
                        <Button
                          className="w-full sm:w-auto"
                          disabled={Boolean(publishingJobId)}
                          onClick={() => handlePublish(job._id)}
                        >
                          {publishingJobId === job._id ? 'Publishing…' : 'Publish job'}
                          <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                        </Button>
                      ) : (
                        <Button
                          className="w-full sm:w-auto"
                          variant={job.proposalsCount > 0 ? 'default' : 'outline'}
                          nativeButton={false}
                          render={<Link to={`/jobs/${job._id}/proposals`} />}
                        >
                          Review proposals
                          <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {!loading && !error && pagination.totalPages > 1 ? (
          <nav className="mt-7 flex items-center justify-between" aria-label="Jobs pagination">
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

export default MyJobsPage
