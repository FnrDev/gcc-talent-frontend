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
import {
  closeJob,
  deleteMyJob,
  getMyJobs,
  publishJob,
  reopenJob,
} from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const JOB_STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
]

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
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = normalizeResult(await getMyJobs({
        page,
        limit: 10,
        ...(status !== 'all' ? { status } : {}),
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

  function handleStatusChange(value) {
    setStatus(value)
    setPage(1)
  }

  async function handleJobAction(job, action) {
    const confirmations = {
      close: `Close “${job.title}”? Freelancers will no longer be able to submit proposals.`,
      delete: `Delete the draft “${job.title}”? This cannot be undone.`,
    }

    if (confirmations[action] && !window.confirm(confirmations[action])) return

    const actions = {
      publish: () => publishJob(job._id),
      close: () => closeJob(job._id),
      reopen: () => reopenJob(job._id),
      delete: () => deleteMyJob(job._id),
    }
    const successMessages = {
      publish: 'Your draft is now open for proposals.',
      close: 'The job is now closed to new proposals.',
      reopen: 'The job is open for proposals again.',
      delete: 'The draft was deleted.',
    }

    setPendingAction(`${action}:${job._id}`)
    setActionError('')
    setActionSuccess('')

    try {
      await actions[action]()
      setActionSuccess(successMessages[action])
      await loadJobs()
    } catch (requestError) {
      setActionError(getRequestError(requestError, `We could not ${action} this job. Please try again.`))
    } finally {
      setPendingAction('')
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

        <section className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-4" />
            <span>{loading ? 'Loading jobs…' : resultSummary}</span>
          </div>
          <Tabs value={status} onValueChange={handleStatusChange}>
            <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-fit" aria-label="Filter jobs by status">
              {JOB_STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value || 'all'} value={tab.value} className="px-3 py-1.5">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        {actionSuccess ? (
          <Alert className="mb-5 border-primary/20 bg-primary/5">
            <AlertTitle>Job updated</AlertTitle>
            <AlertDescription>{actionSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {actionError ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Could not update job</AlertTitle>
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
                {status !== 'all' ? `No ${statusLabel(status)} jobs` : 'Create your first job'}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {status !== 'all'
                  ? 'Try another status or view all of your jobs.'
                  : 'Describe the work you need and start receiving proposals from freelancers.'}
              </p>
              {status !== 'all' ? (
                <Button className="mt-5" variant="outline" onClick={() => setStatus('all')}>View all jobs</Button>
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
                      <div className="flex w-full flex-wrap justify-end gap-2">
                        {['draft', 'open'].includes(job.status) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            nativeButton={false}
                            render={<Link to={`/jobs/${job._id}/edit`} />}
                          >
                            Edit
                          </Button>
                        ) : null}

                        {job.status === 'draft' ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={Boolean(pendingAction)}
                              onClick={() => handleJobAction(job, 'delete')}
                            >
                              {pendingAction === `delete:${job._id}` ? 'Deleting…' : 'Delete'}
                            </Button>
                            <Button
                              size="sm"
                              disabled={Boolean(pendingAction)}
                              onClick={() => handleJobAction(job, 'publish')}
                            >
                              {pendingAction === `publish:${job._id}` ? 'Publishing…' : 'Publish job'}
                              <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                            </Button>
                          </>
                        ) : null}

                        {job.status === 'open' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={Boolean(pendingAction)}
                            onClick={() => handleJobAction(job, 'close')}
                          >
                            {pendingAction === `close:${job._id}` ? 'Closing…' : 'Close job'}
                          </Button>
                        ) : null}

                        {job.status === 'closed' ? (
                          <Button
                            size="sm"
                            disabled={Boolean(pendingAction)}
                            onClick={() => handleJobAction(job, 'reopen')}
                          >
                            {pendingAction === `reopen:${job._id}` ? 'Reopening…' : 'Reopen job'}
                          </Button>
                        ) : null}

                        {job.status !== 'draft' ? (
                          <Button
                            size="sm"
                            variant={job.proposalsCount > 0 ? 'default' : 'outline'}
                            nativeButton={false}
                            render={<Link to={`/jobs/${job._id}/proposals`} />}
                          >
                            Review proposals
                            <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                          </Button>
                        ) : null}
                      </div>
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
