import { useCallback, useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Briefcase01Icon,
  ChartLineData01Icon,
  Clock01Icon,
  Money03Icon,
  RefreshIcon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminStats, getApiErrorMessage } from "@/services/adminService"

const signupChartConfig = {
  count: { label: "Signups", color: "var(--chart-3)" },
}

const financialChartConfig = {
  gmv: { label: "GMV", color: "var(--chart-3)" },
  platformRevenue: { label: "Platform revenue", color: "var(--chart-5)" },
}

const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
})

const compactNumberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
})

function formatNumber(value, compact = false) {
  const numericValue = Number(value) || 0
  return (compact ? compactNumberFormatter : numberFormatter).format(numericValue)
}

function shortDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00Z`),
  )
}

function MetricCard({ label, value, detail, icon, loading }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <HugeiconsIcon icon={icon} strokeWidth={2} />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="mb-2 h-8 w-24" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function BreakdownRow({ label, value, total, tone = "bg-primary" }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {formatNumber(value)} <span className="text-xs text-muted-foreground">({percentage}%)</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function ChartLoading() {
  return (
    <div className="flex h-64 items-end gap-2 px-4 pb-3">
      {[42, 66, 34, 78, 54, 88, 48, 70, 38, 62, 84, 52].map((height, index) => (
        <Skeleton key={index} className="flex-1" style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

function OverviewSection({ onAccessDenied }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await getAdminStats()
      setStats(response)
    } catch (requestError) {
      if (requestError?.response?.status === 403) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load platform statistics."))
    } finally {
      setLoading(false)
    }
  }, [onAccessDenied])

  useEffect(() => {
    // Fetching on mount intentionally drives this section's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats()
  }, [loadStats])

  const kpis = stats?.kpis
  const metricCards = [
    {
      label: "Total users",
      value: formatNumber(kpis?.totalUsers),
      detail: `${formatNumber(kpis?.newSignups?.last30Days)} joined in the last 30 days`,
      icon: UserGroupIcon,
    },
    {
      label: "New signups",
      value: formatNumber(kpis?.newSignups?.last7Days),
      detail: "In the last 7 days",
      icon: UserMultiple02Icon,
    },
    {
      label: "Open jobs",
      value: formatNumber(kpis?.openJobs),
      detail: "Currently open for proposals",
      icon: Briefcase01Icon,
    },
    {
      label: "Active contracts",
      value: formatNumber(kpis?.activeContracts),
      detail: "Work currently in progress",
      icon: Clock01Icon,
    },
    {
      label: "Gross marketplace value",
      value: formatNumber(kpis?.gmv, true),
      detail: "Completed escrow releases",
      icon: ChartLineData01Icon,
    },
    {
      label: "Platform revenue",
      value: formatNumber(kpis?.platformRevenue, true),
      detail: "Completed platform fees",
      icon: Money03Icon,
    },
  ]

  if (error && !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Statistics are unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadStats}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">Platform snapshot</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Marketplace health, activity, and financial performance at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats?.generatedAt && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(stats.generatedAt))}
            </span>
          )}
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} loading={loading && !stats} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>New user signups</CardTitle>
            <CardDescription>Daily registrations over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !stats ? (
              <ChartLoading />
            ) : (
              <ChartContainer config={signupChartConfig} className="h-64 w-full aspect-auto">
                <AreaChart data={stats?.timeSeries?.signups || []} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="signup-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={30} tickFormatter={shortDate} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => shortDate(label)} />} />
                  <Area type="monotone" dataKey="count" stroke="var(--color-count)" fill="url(#signup-fill)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User mix</CardTitle>
            <CardDescription>Accounts by marketplace role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading && !stats ? (
              <div className="space-y-5">
                {[1, 2, 3].map((item) => <Skeleton key={item} className="h-9 w-full" />)}
              </div>
            ) : (
              Object.entries(kpis?.usersByRole || {}).map(([role, value], index) => (
                <BreakdownRow
                  key={role}
                  label={role}
                  value={value}
                  total={kpis?.totalUsers || 0}
                  tone={["bg-chart-3", "bg-chart-4", "bg-chart-5"][index]}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Marketplace value</CardTitle>
            <CardDescription>GMV and platform revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !stats ? (
              <ChartLoading />
            ) : (
              <ChartContainer config={financialChartConfig} className="h-64 w-full aspect-auto">
                <LineChart data={stats?.timeSeries?.financials || []} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={30} tickFormatter={shortDate} />
                  <YAxis tickLine={false} axisLine={false} width={36} tickFormatter={(value) => formatNumber(value, true)} />
                  <ChartTooltip
                    content={(
                      <ChartTooltipContent
                        labelFormatter={(label) => shortDate(label)}
                        formatter={(value, name) => (
                          <div className="flex min-w-36 items-center justify-between gap-4">
                            <span className="text-muted-foreground">{financialChartConfig[name]?.label || name}</span>
                            <span className="font-mono font-medium tabular-nums">{formatNumber(value)}</span>
                          </div>
                        )}
                      />
                    )}
                  />
                  <Line type="monotone" dataKey="gmv" stroke="var(--color-gmv)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="platformRevenue" stroke="var(--color-platformRevenue)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Amounts are shown in the platform&apos;s base units because the statistics API does not provide a currency.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account health</CardTitle>
            <CardDescription>Active and suspended user accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading && !stats ? (
              <div className="space-y-5">
                {[1, 2].map((item) => <Skeleton key={item} className="h-9 w-full" />)}
              </div>
            ) : (
              Object.entries(kpis?.usersByStatus || {}).map(([status, value], index) => (
                <BreakdownRow
                  key={status}
                  label={status}
                  value={value}
                  total={kpis?.totalUsers || 0}
                  tone={index === 0 ? "bg-chart-3" : "bg-destructive"}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OverviewSection
