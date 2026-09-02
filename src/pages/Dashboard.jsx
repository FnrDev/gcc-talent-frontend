import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import i18n from '@/i18n'

// Arabic keeps Latin digits, matching the rest of the marketplace.
function localeTag() {
  return i18n.language === 'ar' ? 'ar-u-nu-latn' : 'en-BH'
}

function formatMoney(value) {
  return new Intl.NumberFormat(localeTag(), {
    style: 'currency',
    currency: 'BHD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number(value) || 0)
}

function formatInteger(value) {
  return new Intl.NumberFormat(localeTag()).format(Number(value) || 0)
}

const ROLE_COPY = {
  client: { eyebrow: 'dashboard.clientEyebrow', description: 'dashboard.clientDescription' },
  freelancer: { eyebrow: 'dashboard.freelancerEyebrow', description: 'dashboard.freelancerDescription' },
  admin: { eyebrow: 'dashboard.adminEyebrow', description: 'dashboard.adminDescription' },
}

const STAT_CONFIG = {
  client: [
    ['openJobs', 'dashboard.openJobs', Briefcase01Icon],
    ['proposalsReceived', 'dashboard.proposalsReceived', UserGroupIcon],
    ['activeContracts', 'dashboard.activeContracts', FileSearchIcon],
    ['serviceOrders', 'dashboard.serviceOrders', DashboardSquare01Icon],
    ['totalSpent', 'dashboard.totalSpent', Money03Icon, true],
  ],
  freelancer: [
    ['activeProposals', 'dashboard.activeProposals', FileSearchIcon],
    ['acceptedProposals', 'dashboard.acceptedProposals', UserGroupIcon],
    ['activeContracts', 'dashboard.activeContracts', Briefcase01Icon],
    ['activeServices', 'dashboard.activeServices', DashboardSquare01Icon],
    ['totalEarned', 'dashboard.totalEarned', Money03Icon, true],
  ],
  admin: [
    ['totalUsers', 'dashboard.totalUsers', UserGroupIcon],
    ['openJobs', 'dashboard.openJobs', Briefcase01Icon],
    ['activeContracts', 'dashboard.activeContracts', FileSearchIcon],
    ['transactionCount', 'dashboard.transactionCount', DashboardSquare01Icon],
    ['transactionVolume', 'dashboard.transactionVolume', Money03Icon, true],
  ],
}

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function formatDate(value) {
  if (!value) return i18n.t('dashboard.recentlyUpdated')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return i18n.t('dashboard.recentlyUpdated')

  return new Intl.DateTimeFormat(localeTag(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// Backend enums map to copy; anything unmapped falls back to the raw value
// with underscores stripped, so a new status still renders sensibly.
function formatStatus(status) {
  if (!status) return i18n.t('status.active')
  return i18n.exists(`status.${status}`) ? i18n.t(`status.${status}`) : status.replaceAll('_', ' ')
}

function statusVariant(status) {
  if (['open', 'active', 'accepted', 'completed'].includes(status)) return 'default'
  if (['cancelled', 'closed', 'declined', 'withdrawn'].includes(status)) return 'destructive'
  if (['in_progress', 'shortlisted'].includes(status)) return 'secondary'
  return 'outline'
}

function LoadingDashboard() {
  return (
    <div aria-label={i18n.t('dashboard.loadingDashboard')} className="space-y-8">
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
          {money ? formatMoney(value) : formatInteger(value)}
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
        meta: `${i18n.t('format.proposalsCount', { count: job.proposalsCount || 0 })} · ${formatDate(job.createdAt)}`,
      })),
      ...(recent.contracts || []).map((contract) => ({
        key: `contract-${contract._id}`,
        title: contract.title,
        href: `/contracts/${contract._id}`,
        status: contract.status,
        person: contract.freelancer,
        meta: `${formatMoney(contract.totalAmount)} · ${formatDate(contract.updatedAt)}`,
      })),
    ].slice(0, 7)

    return items.length ? items.map((item) => <RecentRow key={item.key} {...item} />) : (
      <EmptyRecent>{i18n.t('dashboard.emptyClient')}</EmptyRecent>
    )
  }

  if (role === 'freelancer') {
    const items = [
      ...(recent.proposals || []).map((proposal) => ({
        key: `proposal-${proposal._id}`,
        title: proposal.job?.title || i18n.t('dashboard.jobProposal'),
        href: proposal.job?._id && proposal.job?.status === 'open' ? `/jobs/${proposal.job._id}` : '/proposals',
        status: proposal.status,
        meta: `${formatMoney(proposal.amount)} · ${formatDate(proposal.updatedAt)}`,
      })),
      ...(recent.contracts || []).map((contract) => ({
        key: `contract-${contract._id}`,
        title: contract.title,
        href: `/contracts/${contract._id}`,
        status: contract.status,
        person: contract.client,
        meta: `${formatMoney(contract.totalAmount)} · ${formatDate(contract.updatedAt)}`,
      })),
    ].slice(0, 7)

    return items.length ? items.map((item) => <RecentRow key={item.key} {...item} />) : (
      <EmptyRecent>{i18n.t('dashboard.emptyFreelancer')}</EmptyRecent>
    )
  }

  const users = recent.users || []
  return users.length ? users.map((recentUser) => (
    <RecentRow
      key={recentUser._id}
      title={recentUser.name}
      status={recentUser.status}
      meta={`${recentUser.role} · ${i18n.t('dashboard.joined', { date: formatDate(recentUser.createdAt) })}`}
    />
  )) : <EmptyRecent>{i18n.t('dashboard.emptyAdmin')}</EmptyRecent>
}

function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const firstName = user?.name?.trim().split(/\s+/)[0] || t('dashboard.there')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setDashboard(await getDashboard())
    } catch (requestError) {
      setError(getRequestError(requestError, i18n.t('dashboard.loadFailed')))
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
            <AlertTitle>{t('dashboard.unavailable')}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col items-start gap-3">
              <span>{error}</span>
              <Button type="button" variant="outline" size="sm" onClick={loadDashboard}>
                <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
                {t('common.tryAgain')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : dashboard ? (
          <>
            <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">{t(copy.eyebrow)}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{t('dashboard.welcomeBack', { name: firstName })}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{t(copy.description)}</p>
              </div>
              {dashboard.role !== 'admin' ? (
                <Button variant="outline" nativeButton={false} render={<Link to={`/profile/${user?._id || user?.id}`} />}>
                  {t('dashboard.viewPublicProfile')}
                  <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                </Button>
              ) : null}
            </header>

            <section aria-label={t('dashboard.accountSummary')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map(([key, label, icon, money]) => (
                <StatCard key={key} icon={icon} label={t(label)} value={dashboard.stats?.[key]} money={money} />
              ))}
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                  <CardDescription>{t('dashboard.recentDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity dashboard={dashboard} />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                    <CardDescription>{t('dashboard.quickDescription')}</CardDescription>
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
                      {t('dashboard.wallet')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatMoney(dashboard.wallet?.available)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('dashboard.pendingAmount', { amount: formatMoney(dashboard.wallet?.pending) })}
                    </p>
                    <Button className="mt-4 w-full" variant="secondary" nativeButton={false} render={<Link to="/wallet" />}>
                      {t('dashboard.openWallet')}
                      <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                  {t('dashboard.updatedAt', { date: formatDate(dashboard.generatedAt) })}
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
