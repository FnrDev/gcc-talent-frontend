import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Clock01Icon,
  CreditCardIcon,
  InformationCircleIcon,
  RefreshIcon,
  ShoppingBag01Icon,
} from '@hugeicons/core-free-icons'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Paginator from '@/components/listing/Paginator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserLink from '@/components/UserLink'
import { getClientServiceOrders } from '@/services/contractService'

const ORDER_STATUSES = [
  { value: 'all', label: 'All orders' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const MILESTONE_DETAILS = {
  pending: {
    label: 'Awaiting funding',
    progress: 5,
    copy: 'This milestone has not been funded yet.',
  },
  funded: {
    label: 'Funded',
    progress: 25,
    copy: 'Demo funds are held while the freelancer prepares to start.',
  },
  in_progress: {
    label: 'In progress',
    progress: 50,
    copy: 'The freelancer is working on this milestone.',
  },
  delivered: {
    label: 'Delivered',
    progress: 75,
    copy: 'The delivery is waiting for client review.',
  },
  revision_requested: {
    label: 'Revision requested',
    progress: 65,
    copy: 'Feedback was sent and the freelancer is preparing a revision.',
  },
  approved: {
    label: 'Approved',
    progress: 100,
    copy: 'The milestone was approved and its demo funds were released.',
  },
  disputed: {
    label: 'Disputed',
    progress: 75,
    copy: 'This milestone needs resolution before it can continue.',
  },
  refunded: {
    label: 'Refunded',
    progress: 100,
    copy: 'The internal demo funds were returned.',
  },
  split: {
    label: 'Split',
    progress: 100,
    copy: 'The milestone was closed with a split resolution.',
  },
  cancelled: {
    label: 'Cancelled',
    progress: 100,
    copy: 'This milestone was cancelled.',
  },
}

const CLOSED_MILESTONE_STATUSES = new Set(['approved', 'refunded', 'split', 'cancelled'])
const DATE_FORMATTER = new Intl.DateTimeFormat('en-BH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const PAGE_LOAD_TIME = Date.now()
const MONEY_FORMATTERS = new Map()

function formatOrderMoney(value, currency = 'BHD') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Not available'

  const currencyCode = typeof currency === 'string' && currency.trim()
    ? currency.trim().toUpperCase()
    : 'BHD'

  if (!MONEY_FORMATTERS.has(currencyCode)) {
    try {
      MONEY_FORMATTERS.set(
        currencyCode,
        new Intl.NumberFormat('en-BH', { style: 'currency', currency: currencyCode }),
      )
    } catch {
      return `${amount.toLocaleString('en-BH')} ${currencyCode}`
    }
  }

  return MONEY_FORMATTERS.get(currencyCode).format(amount)
}

function formatOrderDate(value) {
  if (!value) return 'Not set'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not set' : DATE_FORMATTER.format(date)
}

function getRequestError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.err ||
    'We could not load your orders. Please try again.'
  )
}

function normalizeResult(result) {
  const contracts = Array.isArray(result?.contracts) ? result.contracts : []

  return {
    orders: contracts,
    pagination: result?.pagination || {
      page: 1,
      limit: 8,
      total: contracts.length,
      totalPages: contracts.length > 0 ? 1 : 0,
    },
  }
}

function contractStatusVariant(status) {
  if (status === 'completed') return 'default'
  if (status === 'cancelled') return 'destructive'
  return 'secondary'
}

function milestoneStatusVariant(status) {
  if (status === 'approved') return 'default'
  if (['disputed', 'cancelled'].includes(status)) return 'destructive'
  if (['in_progress', 'delivered', 'revision_requested'].includes(status)) return 'secondary'
  return 'outline'
}

function activeMilestone(milestones) {
  return (
    milestones.find((milestone) => !CLOSED_MILESTONE_STATUSES.has(milestone.status)) ||
    milestones.at(-1) ||
    null
  )
}

function orderProgress(milestones) {
  if (milestones.length === 0) return 0

  const total = milestones.reduce(
    (sum, milestone) => sum + (MILESTONE_DETAILS[milestone.status]?.progress || 0),
    0,
  )

  return Math.round(total / milestones.length)
}

function packageFacts(snapshot) {
  const facts = []

  if (Number.isFinite(snapshot.deliveryDays)) {
    facts.push(`${snapshot.deliveryDays} ${snapshot.deliveryDays === 1 ? 'day' : 'days'} delivery`)
  }

  if (Number.isFinite(snapshot.revisions)) {
    facts.push(
      snapshot.revisions === 0
        ? 'No revisions'
        : `${snapshot.revisions} ${snapshot.revisions === 1 ? 'revision' : 'revisions'}`,
    )
  }

  return facts.join(' · ')
}

function LoadingOrders() {
  return (
    <div className="grid gap-5" aria-label="Loading your orders">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <CardAction>
              <Skeleton className="h-5 w-16 rounded-full" />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-28 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function OrderCard({ order }) {
  const snapshot = order.source?.packageSnapshot || {}
  const service = order.source?.service
  const serviceId = typeof service === 'object' ? service?._id : service
  const serviceName = snapshot.serviceName || service?.name || order.title || 'Service order'
  const packageName = snapshot.packageName || order.source?.package?.name || 'Package'
  const packageTitle = snapshot.title || order.source?.package?.title || order.title
  const freelancer = order.freelancer
  const milestones = Array.isArray(order.milestones) ? order.milestones : []
  const milestone = activeMilestone(milestones)
  const milestoneDetails = MILESTONE_DETAILS[milestone?.status] || {
    label: 'Status unavailable',
    copy: 'Milestone details are not available.',
  }
  const progress = orderProgress(milestones)
  const dueDate = milestone?.dueDate || milestones[0]?.dueDate
  const dueTimestamp = dueDate ? new Date(dueDate).getTime() : Number.NaN
  const isOverdue =
    order.status === 'active' &&
    ['pending', 'funded', 'in_progress'].includes(milestone?.status) &&
    Number.isFinite(dueTimestamp) &&
    dueTimestamp < PAGE_LOAD_TIME
  const total = formatOrderMoney(order.totalAmount, order.currency)
  const facts = packageFacts(snapshot)
  const approvedMilestones = milestones.filter((item) => item.status === 'approved').length
  const milestoneCopy =
    milestones.length > 1
      ? `${approvedMilestones} of ${milestones.length} milestones approved. ${milestoneDetails.copy}`
      : milestoneDetails.copy

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader>
        <Badge variant="outline" className="mb-1">
          {packageName} package
        </Badge>
        <CardTitle className="text-lg sm:text-xl">
          {serviceId ? (
            <Link className="transition-colors hover:text-primary" to={`/services/${serviceId}`}>
              {serviceName}
            </Link>
          ) : (
            serviceName
          )}
        </CardTitle>
        <CardDescription>{packageTitle || 'Service package'}</CardDescription>
        <CardAction>
          <Badge className="capitalize" variant={contractStatusVariant(order.status)}>
            {order.status || 'Unknown'}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          {snapshot.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {snapshot.description}
            </p>
          ) : null}

          {facts ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">{facts}</p>
          ) : null}

          <section className="mt-5 rounded-lg bg-muted/45 p-4" aria-label="Milestone progress">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Milestone progress
                </p>
                <p className="mt-1 truncate font-medium text-foreground">
                  {milestone?.title || packageTitle || 'Service delivery'}
                </p>
              </div>
              <Badge variant={milestoneStatusVariant(milestone?.status)}>
                {milestoneDetails.label}
              </Badge>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>Order progress</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <Progress
              value={progress}
              aria-label={`${progress}% order progress`}
              className="mt-2 [&_[data-slot=progress-track]]:h-2"
            />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{milestoneCopy}</p>
          </section>
        </div>

        <aside className="border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Freelancer</p>
            <UserLink
              user={freelancer}
              showAvatar
              nameClassName="font-medium text-foreground"
            />
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Order total</dt>
              <dd className="font-semibold tabular-nums text-foreground">{total}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={Calendar03Icon} className="size-4" aria-hidden="true" />
                Ordered
              </dt>
              <dd className="text-right text-foreground">{formatOrderDate(order.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={Clock01Icon} className="size-4" aria-hidden="true" />
                {isOverdue ? 'Due (overdue)' : 'Due'}
              </dt>
              <dd className={isOverdue ? 'text-right font-medium text-destructive' : 'text-right text-foreground'}>
                {formatOrderDate(dueDate)}
              </dd>
            </div>
          </dl>
        </aside>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3 text-xs leading-relaxed text-muted-foreground">
        <span className="flex min-w-0 items-start gap-2">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          Demo order: totals and funds shown here are internal test balances, not real charges.
        </span>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/contracts/${order._id}`} />}>
          Open workspace
          <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 0 })
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = normalizeResult(
        await getClientServiceOrders({
          page,
          limit: 8,
          ...(status === 'all' ? {} : { status }),
        }),
      )

      setOrders(result.orders)
      setPagination(result.pagination)
    } catch (requestError) {
      setOrders([])
      setError(getRequestError(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    // Fetching the selected remote result page is the synchronization handled by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders()
  }, [loadOrders])

  const resultSummary = useMemo(() => {
    const total = pagination.total ?? orders.length
    if (total === 0) return status === 'all' ? 'No orders yet' : `No ${status} orders`

    return `${total} ${total === 1 ? 'order' : 'orders'}`
  }, [orders.length, pagination.total, status])

  function handleStatusChange(value) {
    setStatus(value)
    setPage(1)
  }

  function clearFilter() {
    setStatus('all')
    setPage(1)
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-7">
          <p className="text-sm font-medium text-primary">Client workspace</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            My orders
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Track the service packages you ordered and follow each delivery milestone.
          </p>
        </header>

        <Alert className="mb-6 bg-primary/5">
          <HugeiconsIcon icon={CreditCardIcon} aria-hidden="true" />
          <AlertTitle>Demo checkout funds</AlertTitle>
          <AlertDescription>
            These orders use internal demo ledger balances. No real card charge or freelancer payout
            takes place.
          </AlertDescription>
        </Alert>

        <section className="mb-5 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <HugeiconsIcon icon={ShoppingBag01Icon} className="size-4" aria-hidden="true" />
              <span>{loading ? 'Loading orders…' : resultSummary}</span>
            </div>

            <Tabs value={status} onValueChange={handleStatusChange}>
              <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-fit">
                {ORDER_STATUSES.map((item) => (
                  <TabsTrigger key={item.value} value={item.value} className="px-3 py-1.5">
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </section>

        {error ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Could not load orders</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadOrders}>
                <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? <LoadingOrders /> : null}

        {!loading && !error && orders.length === 0 ? (
          <Card className="border border-dashed py-12 text-center ring-0">
            <CardContent className="mx-auto flex max-w-md flex-col items-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-lg font-semibold">
                {status === 'all' ? 'No service orders yet' : `No ${status} orders`}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {status === 'all'
                  ? 'Choose a package from the services marketplace when you are ready to start.'
                  : 'Try another order status or return to all of your orders.'}
              </p>
              {status === 'all' ? (
                <Button className="mt-5" nativeButton={false} render={<Link to="/services" />}>
                  Browse services
                </Button>
              ) : (
                <Button className="mt-5" variant="outline" onClick={clearFilter}>
                  View all orders
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className="grid gap-5">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : null}

        {!loading && !error ? (
          <Paginator
            page={pagination.page || page}
            totalPages={pagination.totalPages || 0}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </main>
  )
}

export default MyOrdersPage
