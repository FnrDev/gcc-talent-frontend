import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Briefcase01Icon,
  Clock01Icon,
  DashboardSquare01Icon,
  FileSearchIcon,
  Money03Icon,
  RefreshIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '../context/AuthContext'
import UserLink from '@/components/UserLink'
import { getDashboard } from '@/services/dashboardService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

const INTEGER_FORMATTER = new Intl.NumberFormat('en-BH')

const ROLE_COPY = {
  client: {
    eyebrow: 'Client workspace',
    description: 'Keep hiring, service orders, and active work moving from one place.',
  },
  freelancer: {
    eyebrow: 'Freelancer workspace',
    description: 'Track opportunities, current work, services, and earnings at a glance.',
  },
  admin: {
    eyebrow: 'Platform workspace',
    description: 'A live overview of marketplace activity and the people using it.',
  },
}

const STAT_CONFIG = {
  client: [
    ['openJobs', 'Open jobs', Briefcase01Icon],
    ['proposalsReceived', 'Proposals received', UserGroupIcon],
    ['activeContracts', 'Active contracts', FileSearchIcon],
    ['serviceOrders', 'Service orders', DashboardSquare01Icon],
    ['totalSpent', 'Funds committed', Money03Icon, true],
  ],
  freelancer: [
    ['activeProposals', 'Active proposals', FileSearchIcon],
    ['acceptedProposals', 'Accepted proposals', UserGroupIcon],
    ['activeContracts', 'Active contracts', Briefcase01Icon],
    ['activeServices', 'Published services', DashboardSquare01Icon],
    ['totalEarned', 'Total earned', Money03Icon, true],
  ],
  admin: [
    ['totalUsers', 'Total users', UserGroupIcon],
    ['openJobs', 'Open jobs', Briefcase01Icon],
    ['activeContracts', 'Active contracts', FileSearchIcon],
    ['transactionCount', 'Transactions', DashboardSquare01Icon],
    ['transactionVolume', 'Transaction volume', Money03Icon, true],
  ],
}

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function formatDate(value) {
  if (!value) return 'Recently updated'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently updated'

  return new Intl.DateTimeFormat('en-BH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatStatus(status) {
  return status?.replaceAll('_', ' ') || 'active'
}

function statusVariant(status) {
  if (['open', 'active', 'accepted', 'completed'].includes(status)) return 'default'
  if (['cancelled', 'closed', 'declined', 'withdrawn'].includes(status)) return 'destructive'
  if (['in_progress', 'shortlisted'].includes(status)) return 'secondary'
  return 'outline'
}

function LoadingDashboard() {
  return (
    <div aria-label="Loading dashboard" className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-[32rem] max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, money }) {
  return (
    <Card>
      <CardContent className="p-5">
        <span className="mb-5 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon icon={icon} className="size-5" />
        </span>
        <p className="text-2xl font-semibold tracking-tight">
          {money ? CURRENCY_FORMATTER.format(Number(value) || 0) : INTEGER_FORMATTER.format(Number(value) || 0)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function EmptyRecent({ children }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed px-5 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function RecentRow({ title, href, status, meta, person }) {
  return (
    <div className="flex items-center gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        {href ? (
          <Link to={href} className="block truncate text-sm font-medium text-foreground hover:underline">
            {title}
          </Link>
        ) : <p className="truncate text-sm font-medium text-foreground">{title}</p>}
        {(person || meta) ? (
          <div className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            {person ? <UserLink user={person} className="max-w-40 shrink-0" /> : null}
            {person && meta ? <span aria-hidden="true">·</span> : null}
            {meta ? <span className="truncate">{meta}</span> : null}
          </div>
        ) : null}
      </div>
      {status ? <Badge variant={statusVariant(status)} className="shrink-0 capitalize">{formatStatus(status)}</Badge> : null}
    </div>
  )
}

function RecentActivity({ dashboard }) {
  const role = dashboard.role
  const recent = dashboard.recent || {}

  if (role === 'client') {
    const items = [
      ...(recent.jobs || []).map((job) => ({
        key: `job-${job._id}`,
        title: job.title,
        href: job.status === 'open' ? `/jobs/${job._id}` : '/jobs/mine',
        status: job.status,
        meta: `${job.proposalsCount || 0} proposal${job.proposalsCount === 1 ? '' : 's'} · ${formatDate(job.createdAt)}`,
      })),
      ...(recent.contracts || []).map((contract) => ({
        key: `contract-${contract._id}`,
        title: contract.title,
        href: `/contracts/${contract._id}`,
        status: contract.status,
        person: contract.freelancer,
        meta: `${CURRENCY_FORMATTER.format(contract.totalAmount || 0)} · ${formatDate(contract.updatedAt)}`,
      })),
    ].slice(0, 7)

    return items.length ? items.map((item) => <RecentRow key={item.key} {...item} />) : (
      <EmptyRecent>Your jobs, proposals, and orders will appear here.</EmptyRecent>
    )
  }

  if (role === 'freelancer') {
    const items = [
      ...(recent.proposals || []).map((proposal) => ({
        key: `proposal-${proposal._id}`,
        title: proposal.job?.title || 'Job proposal',
        href: proposal.job?._id && proposal.job?.status === 'open' ? `/jobs/${proposal.job._id}` : '/proposals',
        status: proposal.status,
        meta: `${CURRENCY_FORMATTER.format(proposal.amount || 0)} · ${formatDate(proposal.updatedAt)}`,
      })),
      ...(recent.contracts || []).map((contract) => ({
        key: `contract-${contract._id}`,
        title: contract.title,
        href: `/contracts/${contract._id}`,
        status: contract.status,
        person: contract.client,
        meta: `${CURRENCY_FORMATTER.format(contract.totalAmount || 0)} · ${formatDate(contract.updatedAt)}`,
      })),
    ].slice(0, 7)

    return items.length ? items.map((item) => <RecentRow key={item.key} {...item} />) : (
      <EmptyRecent>Your proposals and contracts will appear here.</EmptyRecent>
    )
  }

  const users = recent.users || []
  return users.length ? users.map((recentUser) => (
    <RecentRow
      key={recentUser._id}
      title={recentUser.name}
      status={recentUser.status}
      meta={`${recentUser.role} · Joined ${formatDate(recentUser.createdAt)}`}
    />
  )) : <EmptyRecent>New marketplace accounts will appear here.</EmptyRecent>
}

function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setDashboard(await getDashboard())
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not load your dashboard. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetching the authenticated summary is the external synchronization handled here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [loadDashboard])

  const copy = ROLE_COPY[dashboard?.role || user?.role] || ROLE_COPY.client
  const stats = useMemo(() => STAT_CONFIG[dashboard?.role] || [], [dashboard?.role])

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {location.state?.message ? (
          <Alert className="mb-6">
            <AlertDescription>{location.state.message}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? <LoadingDashboard /> : error ? (
          <Alert variant="destructive" className="max-w-2xl">
            <AlertTitle>Dashboard unavailable</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col items-start gap-3">
              <span>{error}</span>
              <Button type="button" variant="outline" size="sm" onClick={loadDashboard}>
                <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : dashboard ? (
          <>
            <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">{copy.eyebrow}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {firstName}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{copy.description}</p>
              </div>
              {dashboard.role !== 'admin' ? (
                <Button variant="outline" nativeButton={false} render={<Link to={`/profile/${user?._id || user?.id}`} />}>
                  View public profile
                  <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                </Button>
              ) : null}
            </header>

            <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map(([key, label, icon, money]) => (
                <StatCard key={key} icon={icon} label={label} value={dashboard.stats?.[key]} money={money} />
              ))}
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription>The latest work that needs your attention.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity dashboard={dashboard} />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick actions</CardTitle>
                    <CardDescription>Continue with the most common next steps.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {(dashboard.quickActions || []).map((action) => (
                      <Button key={action.href} variant="outline" className="justify-between" nativeButton={false} render={<Link to={action.href} />}>
                        {action.label}
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-primary/15 bg-primary/[0.035]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <HugeiconsIcon icon={Money03Icon} className="size-5 text-primary" />
                      Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-tight">
                      {CURRENCY_FORMATTER.format(dashboard.wallet?.available || 0)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {CURRENCY_FORMATTER.format(dashboard.wallet?.pending || 0)} pending
                    </p>
                    <Button className="mt-4 w-full" variant="secondary" nativeButton={false} render={<Link to="/wallet" />}>
                      Open wallet
                      <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                  Updated {formatDate(dashboard.generatedAt)}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}

export default Dashboard
