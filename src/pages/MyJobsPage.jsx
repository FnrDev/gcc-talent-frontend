import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import i18n from '@/i18n'

const JOB_STATUS_TABS = [
  { value: 'all', labelKey: 'workspace.all' },
  { value: 'draft', labelKey: 'workspace.drafts' },
  { value: 'open', labelKey: 'status.open' },
  { value: 'in_progress', labelKey: 'status.in_progress' },
  { value: 'completed', labelKey: 'status.completed' },
  { value: 'closed', labelKey: 'status.closed' },
]

// Arabic keeps Latin digits, consistent with the rest of the marketplace.
function localeTag() {
  return i18n.language === 'ar' ? 'ar-u-nu-latn' : 'en-BH'
}

function budgetFormatter() {
  return new Intl.NumberFormat(localeTag(), {
    style: 'currency',
    currency: 'BHD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function formatDate(value) {
  if (!value) return i18n.t('workspace.noDateSet')

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return i18n.t('workspace.noDateSet')

  return new Intl.DateTimeFormat(localeTag(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatBudget(job) {
  const format = budgetFormatter()
  const minimum = Number.isFinite(job?.budgetMin) ? job.budgetMin : null
  const maximum = Number.isFinite(job?.budgetMax) ? job.budgetMax : null

  if (minimum !== null && maximum !== null) {
    return `${format.format(minimum)} – ${format.format(maximum)}`
  }

  if (minimum !== null) return i18n.t('workspace.fromAmount', { amount: format.format(minimum) })
  if (maximum !== null) return i18n.t('workspace.upToAmount', { amount: format.format(maximum) })

  return i18n.t('workspace.budgetNotSpecified')
}

function statusLabel(status) {
  if (!status) return i18n.t('status.draft')
  return i18n.exists(`status.${status}`) ? i18n.t(`status.${status}`) : status.replaceAll('_', ' ')
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
    <div className="grid gap-4" aria-label={i18n.t('workspace.loadingYourJobs')}>
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
  const { t } = useTranslation()
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
      setError(getRequestError(requestError, i18n.t('workspace.jobsLoadFailed')))
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
    if (total === 0) return t('workspace.noJobs')
    return t('workspace.jobCount', { count: total })
  }, [jobs.length, pagination.total, t])

  function handleStatusChange(value) {
    setStatus(value)
    setPage(1)
  }

  async function handleJobAction(job, action) {
    const confirmations = {
      close: t('workspace.confirmClose', { title: job.title }),
      delete: t('workspace.confirmDelete', { title: job.title }),
    }

    if (confirmations[action] && !window.confirm(confirmations[action])) return

    const actions = {
      publish: () => publishJob(job._id),
      close: () => closeJob(job._id),
      reopen: () => reopenJob(job._id),
      delete: () => deleteMyJob(job._id),
    }
    const successMessages = {
      publish: t('workspace.publishSuccess'),
      close: t('workspace.closeSuccess'),
      reopen: t('workspace.reopenSuccess'),
      delete: t('workspace.deleteSuccess'),
    }

    setPendingAction(`${action}:${job._id}`)
    setActionError('')
    setActionSuccess('')

    try {
      await actions[action]()
      setActionSuccess(successMessages[action])
      await loadJobs()
    } catch (requestError) {
      setActionError(getRequestError(requestError, t('workspace.actionFailed')))
    } finally {
      setPendingAction('')
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('workspace.hiringWorkspace')}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{t('workspace.myJobs')}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t('workspace.myJobsSubtitle')}
            </p>
          </div>
          <Button className="h-10 self-start px-4 sm:self-auto" nativeButton={false} render={<Link to="/jobs/new" />}>
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            {t('workspace.createJob')}
          </Button>
        </header>

        <section className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-4" />
            <span>{loading ? t('workspace.loadingJobs') : resultSummary}</span>
          </div>
          <Tabs value={status} onValueChange={handleStatusChange}>
            <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-fit" aria-label={t('workspace.filterByStatus')}>
              {JOB_STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value || 'all'} value={tab.value} className="px-3 py-1.5">
                  {t(tab.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        {actionSuccess ? (
          <Alert className="mb-5 border-primary/20 bg-primary/5">
            <AlertTitle>{t('workspace.jobUpdated')}</AlertTitle>
            <AlertDescription>{actionSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {actionError ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>{t('workspace.couldNotUpdateJob')}</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>{t('workspace.couldNotLoadJobs')}</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadJobs}>{t('common.tryAgain')}</Button>
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
                {status !== 'all' ? t('workspace.noStatusJobs', { status: statusLabel(status) }) : t('workspace.createFirstJob')}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {status !== 'all'
                  ? t('workspace.tryAnotherStatus')
                  : t('workspace.describeWork')}
              </p>
              {status !== 'all' ? (
                <Button className="mt-5" variant="outline" onClick={() => setStatus('all')}>{t('workspace.viewAllJobs')}</Button>
              ) : (
                <Button className="mt-5" nativeButton={false} render={<Link to="/jobs/new" />}>
                  <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
                  {t('workspace.createJob')}
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
                          {t('format.proposalsCount', { count: job.proposalsCount || 0 })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                          {t('workspace.createdOn', { date: formatDate(job.createdAt) })}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 border-t pt-4 sm:min-w-52 sm:items-end sm:border-s sm:border-t-0 sm:ps-5 sm:pt-0">
                      <div className="sm:text-end">
                        <p className="font-semibold">{formatBudget(job)}</p>
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">{t('workspace.budgetTypeSuffix', { type: job.budgetType || 'fixed' })}</p>
                      </div>
                      <div className="flex w-full flex-wrap justify-end gap-2">
                        {['draft', 'open'].includes(job.status) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            nativeButton={false}
                            render={<Link to={`/jobs/${job._id}/edit`} />}
                          >
                            {t('workspace.edit')}
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
                              {pendingAction === `delete:${job._id}` ? t('workspace.deleting') : t('workspace.delete')}
                            </Button>
                            <Button
                              size="sm"
                              disabled={Boolean(pendingAction)}
                              onClick={() => handleJobAction(job, 'publish')}
                            >
                              {pendingAction === `publish:${job._id}` ? t('workspace.publishing') : t('workspace.publishJob')}
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
                            {pendingAction === `close:${job._id}` ? t('workspace.closing') : t('workspace.closeJob')}
                          </Button>
                        ) : null}

                        {job.status === 'closed' ? (
                          <Button
                            size="sm"
                            disabled={Boolean(pendingAction)}
                            onClick={() => handleJobAction(job, 'reopen')}
                          >
                            {pendingAction === `reopen:${job._id}` ? t('workspace.reopening') : t('workspace.reopenJob')}
                          </Button>
                        ) : null}

                        {job.status !== 'draft' ? (
                          <Button
                            size="sm"
                            variant={job.proposalsCount > 0 ? 'default' : 'outline'}
                            nativeButton={false}
                            render={<Link to={`/jobs/${job._id}/proposals`} />}
                          >
                            {t('workspace.reviewProposals')}
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
          <nav className="mt-7 flex items-center justify-between" aria-label={t('workspace.jobsPagination')}>
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              {t('common.previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('common.pageOfPlain', { page: pagination.page || page, total: pagination.totalPages })}
            </span>
            <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>
              {t('common.next')}
            </Button>
          </nav>
        ) : null}
      </div>
    </main>
  )
}

export default MyJobsPage
