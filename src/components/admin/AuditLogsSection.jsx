import { useCallback, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Audit01Icon,
  RefreshIcon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAdminAuditLogs, getApiErrorMessage } from "@/services/adminService"

const resources = [
  ["User", "User", "Users"],
  ["Job", "Job", "Jobs"],
  ["Proposal", "Proposal", "Proposals"],
  ["Contract", "Contract", "Contracts"],
  ["Transaction", "Transaction", "Transactions"],
  ["Review", "Review", "Reviews"],
  ["Category", "Category", "Categories"],
  ["Skill", "Skill", "Skills"],
  ["FreelancerProfile", "Freelancer profile", "Freelancer profiles"],
  ["ClientProfile", "Client profile", "Client profiles"],
]

const resourceLabels = Object.fromEntries(resources.map(([value, label]) => [value, label]))
const actionLabels = { create: "Created", update: "Updated", delete: "Deleted" }
const initialQuery = { page: 1, limit: 20, search: "", action: "", resource: "", from: "", to: "" }
const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 0 }
const numberFormatter = new Intl.NumberFormat("en")
const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" })
const timeFormatter = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", second: "2-digit" })
const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
})

function formatDate(value, formatter = dateTimeFormatter) {
  if (!value) return "Not recorded"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Not recorded" : formatter.format(date)
}

function readableOperation(value) {
  if (typeof value !== "string" || !value.trim()) return "Not recorded"
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function actorDetails(log) {
  if (log.actorType === "anonymous") return { name: "Anonymous", description: "Unauthenticated request", id: log.actor }
  if (log.actorType === "system") return { name: "System", description: "Automated operation", id: log.actor }
  const id = log.actor || log.actorUser?._id
  return {
    name: log.actorUser?.name || (log.actorUser ? "Unnamed user" : id ? "Deleted user" : "Unknown user"),
    description: log.actorUser?.email || id || "User ID not recorded",
    id,
  }
}

function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  // A date-only ISO string is parsed as UTC; the explicit time keeps this local.
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const [year, month, day] = value.split("-").map(Number)
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null
  return date
}

function dateRangeFilters({ from, to }) {
  const fromDate = from ? parseLocalDate(from) : null
  const toDate = to ? parseLocalDate(to) : null
  if ((from && !fromDate) || (to && !toDate)) {
    return { error: "Enter valid dates. Showing results for the last valid date range." }
  }
  if (fromDate && toDate && fromDate > toDate) {
    return { error: "The end date must be on or after the start date. Showing results for the last valid date range." }
  }
  if (toDate) toDate.setHours(23, 59, 59, 999)
  return { from: fromDate?.toISOString() || "", to: toDate?.toISOString() || "", error: "" }
}

function ActionBadge({ action }) {
  return (
    <Badge
      variant={action === "delete" ? "destructive" : "outline"}
      className={action === "create" ? "border-chart-1 bg-chart-1/25 text-chart-5" : action === "update" ? "bg-muted" : ""}
    >
      {actionLabels[action] || action || "Unknown"}
    </Badge>
  )
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b py-3 last:border-0 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 break-words font-medium ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value ?? "Not recorded"}
      </dd>
    </div>
  )
}

function AuditLogDetailSheet({ log, onClose }) {
  const titleRef = useRef(null)
  const actor = log ? actorDetails(log) : null
  return (
    <Sheet open={Boolean(log)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent initialFocus={titleRef} className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle ref={titleRef} tabIndex={-1} className="outline-none">Audit log details</SheetTitle>
          <SheetDescription>Read-only record of a marketplace change.</SheetDescription>
        </SheetHeader>
        {log && (
          <div className="space-y-6 px-4 pb-6">
            <section>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <ActionBadge action={log.action} />
                <h3 className="font-medium">{resourceLabels[log.resource] || log.resource}</h3>
              </div>
              <dl>
                <DetailRow label="Log ID" value={log._id} mono />
                <DetailRow label="Timestamp" value={formatDate(log.createdAt)} />
                <DetailRow label="Operation" value={readableOperation(log.details?.operation)} />
                <DetailRow label="Resource ID" value={log.resourceId || "Bulk change (no single resource ID)"} mono={Boolean(log.resourceId)} />
                <DetailRow label="Affected records" value={numberFormatter.format(log.affectedCount ?? 1)} />
              </dl>
            </section>
            <section>
              <h3 className="font-medium">Actor</h3>
              <dl>
                <DetailRow label="Type" value={<span className="capitalize">{log.actorType || "Not recorded"}</span>} />
                <DetailRow label="Name" value={actor.name} />
                <DetailRow label="Email" value={log.actorUser?.email} />
                <DetailRow label="User ID" value={actor.id} mono />
              </dl>
            </section>
            <section>
              <h3 className="font-medium">Request</h3>
              <dl>
                <DetailRow label="Request ID" value={log.request?.id} mono />
                <DetailRow label="Method" value={log.request?.method} />
                <DetailRow label="Endpoint" value={log.request?.path} mono />
                <DetailRow label="IP address" value={log.request?.ip} mono />
              </dl>
            </section>
            <section className="space-y-2">
              <h3 className="font-medium">Change details</h3>
              <p className="text-xs text-muted-foreground">Recorded operation metadata, not a full snapshot of the original record.</p>
              <pre
                tabIndex={0}
                aria-label="Audit change details"
                className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
              >
                {JSON.stringify(log.details || {}, null, 2)}
              </pre>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function EmptyAuditLogs({ filtered, onClear }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <HugeiconsIcon icon={Audit01Icon} strokeWidth={1.8} className="size-5" />
      </span>
      <h3 className="font-medium">{filtered ? "No matching audit logs" : "No audit logs yet"}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search, action, resource, or date range."
          : "New create, update, and delete activity will appear here. Changes made before audit logging was enabled are not included."}
      </p>
      {filtered && <Button variant="outline" className="mt-4" onClick={onClear}>Clear filters</Button>}
    </div>
  )
}

function AuditLogsSection({ onAccessDenied }) {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [query, setQuery] = useState(initialQuery)
  const [searchInput, setSearchInput] = useState("")
  const [dateInputs, setDateInputs] = useState({ from: "", to: "" })
  const [selectedLog, setSelectedLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const requestSequence = useRef(0)
  const dateRange = dateRangeFilters(dateInputs)

  const loadLogs = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError("")

    try {
      const response = await getAdminAuditLogs({
        page: query.page,
        limit: query.limit,
        search: query.search || undefined,
        action: query.action || undefined,
        resource: query.resource || undefined,
        from: query.from || undefined,
        to: query.to || undefined,
      })
      if (requestId !== requestSequence.current) return

      const nextPagination = response.pagination || { ...emptyPagination, page: query.page, limit: query.limit }
      const lastPage = Math.max(1, nextPagination.totalPages)
      if (query.page > lastPage) {
        // Keep loading until the corrected page arrives; never show a false empty result.
        requestSequence.current += 1
        setQuery((current) => ({ ...current, page: lastPage }))
        return
      }

      setLogs(response.logs || [])
      setPagination(nextPagination)
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      if (requestError?.response?.status === 403) {
        setLogs([])
        setPagination(emptyPagination)
        setSelectedLog(null)
        setError("Your account no longer has permission to view audit logs.")
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load audit logs."))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [onAccessDenied, query])

  useEffect(() => {
    // Server-side filters, pagination, and refresh intentionally reload this table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs()
    return () => {
      requestSequence.current += 1
    }
  }, [loadLogs])

  function changeQuery(updates) {
    // Invalidate immediately, including responses that arrive before effect cleanup.
    requestSequence.current += 1
    setLoading(true)
    setError("")
    setSelectedLog(null)
    setQuery((current) => ({ ...current, page: 1, ...updates }))
  }

  function submitSearch(event) {
    event.preventDefault()
    if (dateRange.error) return
    changeQuery({ search: searchInput.trim() })
  }

  function changeDate(name, value) {
    const nextDates = { ...dateInputs, [name]: value }
    setDateInputs(nextDates)
    const nextRange = dateRangeFilters(nextDates)
    if (!nextRange.error) changeQuery({ from: nextRange.from, to: nextRange.to })
  }

  function clearFilters() {
    setSearchInput("")
    setDateInputs({ from: "", to: "" })
    changeQuery({ ...initialQuery, limit: query.limit })
  }

  const filtered = Boolean(query.search || query.action || query.resource || query.from || query.to)
  const hasFilterInput = filtered || Boolean(searchInput || dateInputs.from || dateInputs.to)
  const resultLabel = loading
    ? "Loading audit logs…"
    : error
      ? "Activity history is unavailable"
      : `${numberFormatter.format(pagination.total)} ${pagination.total === 1 ? "record" : "records"} · Newest first`

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">Marketplace activity</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Audit logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review who created, updated, or deleted records across the marketplace.</p>
        </div>
        <Button variant="outline" className="self-start" onClick={loadLogs} disabled={loading}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          Refresh
        </Button>
      </div>

      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
          <div className="space-y-1.5">
            <CardTitle>Activity history</CardTitle>
            <CardDescription aria-live="polite">{resultLabel}</CardDescription>
          </div>
          <Badge variant="outline">Read only</Badge>
        </CardHeader>
        <CardContent className="min-w-0 p-0">
          <form onSubmit={submitSearch} className="space-y-3 border-b p-4">
            <div className="flex min-w-0 gap-2">
              <div className="relative min-w-0 flex-1">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search operation, endpoint or ID"
                  aria-label="Search operation, endpoint or ID"
                  maxLength={100}
                  className="pl-8"
                />
              </div>
              <Button type="submit" variant="outline" disabled={Boolean(dateRange.error)}>Search</Button>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <label className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
                Action
                <NativeSelect className="w-full text-foreground" value={query.action} onChange={(event) => changeQuery({ action: event.target.value })}>
                  <NativeSelectOption value="">All actions</NativeSelectOption>
                  <NativeSelectOption value="create">Created</NativeSelectOption>
                  <NativeSelectOption value="update">Updated</NativeSelectOption>
                  <NativeSelectOption value="delete">Deleted</NativeSelectOption>
                </NativeSelect>
              </label>
              <label className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
                Resource
                <NativeSelect className="w-full text-foreground" value={query.resource} onChange={(event) => changeQuery({ resource: event.target.value })}>
                  <NativeSelectOption value="">All resources</NativeSelectOption>
                  {resources.map(([value, , label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}
                </NativeSelect>
              </label>
              <label className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
                From
                <Input
                  type="date"
                  value={dateInputs.from}
                  onChange={(event) => changeDate("from", event.target.value)}
                  aria-invalid={Boolean(dateRange.error)}
                  aria-describedby={dateRange.error ? "audit-date-help audit-date-error" : "audit-date-help"}
                  className="min-w-0 text-foreground"
                />
              </label>
              <label className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
                To
                <Input
                  type="date"
                  value={dateInputs.to}
                  onChange={(event) => changeDate("to", event.target.value)}
                  aria-invalid={Boolean(dateRange.error)}
                  aria-describedby={dateRange.error ? "audit-date-help audit-date-error" : "audit-date-help"}
                  className="min-w-0 text-foreground"
                />
              </label>
            </div>
            {dateRange.error && <p id="audit-date-error" role="alert" className="text-xs text-destructive">{dateRange.error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p id="audit-date-help" className="text-xs text-muted-foreground">Dates include the full day. Times use your local time zone.</p>
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilterInput}>Clear filters</Button>
            </div>
          </form>

          {error ? (
            <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              </span>
              <h3 className="font-medium">Could not load audit logs</h3>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadLogs}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
                Try again
              </Button>
            </div>
          ) : !loading && logs.length === 0 ? (
            <EmptyAuditLogs filtered={filtered} onClear={clearFilters} />
          ) : (
            <Table className="min-w-[800px]" aria-label="Audit logs" aria-busy={loading}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead className="pr-4 text-right"><span className="sr-only">Details</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 6 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell className="pl-4"><div className="space-y-1.5"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" /></div></TableCell>
                      <TableCell><div className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-36" /></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><div className="space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-36" /></div></TableCell>
                      <TableCell><Skeleton className="h-3 w-28" /></TableCell>
                      <TableCell className="pr-4"><Skeleton className="ml-auto h-7 w-24" /></TableCell>
                    </TableRow>
                  ))
                  : logs.map((log) => {
                    const actor = actorDetails(log)
                    const count = log.affectedCount ?? 1
                    return (
                      <TableRow key={log._id}>
                        <TableCell className="pl-4" title={formatDate(log.createdAt)}>
                          <p>{formatDate(log.createdAt, dateFormatter)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(log.createdAt, timeFormatter)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-48 truncate font-medium" title={actor.name}>{actor.name}</p>
                          <p className="mt-0.5 max-w-56 truncate text-xs text-muted-foreground" title={actor.description}>{actor.description}</p>
                        </TableCell>
                        <TableCell><ActionBadge action={log.action} /></TableCell>
                        <TableCell>
                          <p className="font-medium">{resourceLabels[log.resource] || log.resource}</p>
                          <p className={`mt-0.5 text-xs text-muted-foreground ${log.resourceId ? "font-mono" : ""}`}>
                            {log.resourceId || `Bulk change · ${numberFormatter.format(count)} ${count === 1 ? "record" : "records"}`}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-56 whitespace-normal">
                          <p className="break-words">{readableOperation(log.details?.operation)}</p>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} aria-label={`View details for audit log ${log._id}`}>
                            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                            View details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          )}

          {!error && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm xl:flex-row xl:items-center xl:justify-between">
              <p className="text-muted-foreground">
                {loading
                  ? "Loading records…"
                  : pagination.total === 0
                    ? "0 records"
                    : `Showing ${numberFormatter.format((pagination.page - 1) * pagination.limit + 1)}–${numberFormatter.format(Math.min(pagination.page * pagination.limit, pagination.total))} of ${numberFormatter.format(pagination.total)}`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Per page
                  <NativeSelect size="sm" className="w-20 text-foreground" value={query.limit} onChange={(event) => changeQuery({ limit: Number(event.target.value) })}>
                    {[20, 50, 100].map((limit) => <NativeSelectOption key={limit} value={limit}>{limit}</NativeSelectOption>)}
                  </NativeSelect>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Page {query.page} of {Math.max(pagination.totalPages, 1)}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={loading || query.page <= 1}
                    aria-label="Previous page"
                    onClick={() => changeQuery({ page: Math.max(1, query.page - 1) })}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={loading || query.page >= pagination.totalPages}
                    aria-label="Next page"
                    onClick={() => changeQuery({ page: query.page + 1 })}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AuditLogDetailSheet log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}

export default AuditLogsSection
