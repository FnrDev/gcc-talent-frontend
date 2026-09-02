import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Delete02Icon,
  EyeIcon,
  RefreshIcon,
  Search01Icon,
  StarIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  deleteAdminJob,
  getAdminJob,
  getAdminJobs,
  getApiErrorMessage,
  updateAdminJob,
} from "@/services/adminService"

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 0 }
const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" })
const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})
const numberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 2 })

function formatDate(value, includeTime = false) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"
  return (includeTime ? dateTimeFormatter : dateFormatter).format(date)
}

function formatBudget(job) {
  const minimum = Number(job?.budgetMin)
  const maximum = Number(job?.budgetMax)
  const hasMinimum = Number.isFinite(minimum)
  const hasMaximum = Number.isFinite(maximum)
  if (!hasMinimum && !hasMaximum) return "Not specified"
  const value = hasMinimum && hasMaximum
    ? `${numberFormatter.format(minimum)}–${numberFormatter.format(maximum)}`
    : numberFormatter.format(hasMinimum ? minimum : maximum)
  return `${value} BHD${job?.budgetType === "hourly" ? "/hr" : ""}`
}

function JobStatusBadge({ status }) {
  const tones = {
    draft: "bg-muted text-muted-foreground",
    open: "border-chart-1 bg-chart-1/25 text-chart-5",
    in_progress: "border-primary/25 bg-primary/10 text-primary",
    completed: "border-chart-4/40 bg-chart-4/15 text-chart-5",
    closed: "bg-muted text-muted-foreground",
  }
  return (
    <Badge variant="outline" className={tones[status] || ""}>
      <span className="capitalize">{status?.replaceAll("_", " ") || "Unknown"}</span>
    </Badge>
  )
}

function VisibilityBadges({ item }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className={item.isHidden ? "text-muted-foreground" : "border-chart-1 bg-chart-1/20 text-chart-5"}>
        <HugeiconsIcon icon={item.isHidden ? ViewOffIcon : EyeIcon} strokeWidth={2} className="size-3" />
        {item.isHidden ? "Hidden" : "Visible"}
      </Badge>
      {item.isFeatured && (
        <Badge variant="outline" className="border-chart-2/40 bg-chart-2/15">
          <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-3" />
          Featured
        </Badge>
      )}
    </div>
  )
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-b py-3 text-sm last:border-0 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 break-words font-medium ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  )
}

function referenceMessage(references) {
  if (!references || typeof references !== "object") return ""
  const entries = Object.entries(references).filter(([, value]) => Number(value) > 0)
  if (entries.length === 0) return ""
  return ` Linked history: ${entries.map(([key, value]) => `${value} ${key}`).join(" and ")}.`
}

function statusOptions(status) {
  if (status === "draft") return ["draft", "open"]
  if (status === "open") return ["open", "closed"]
  if (status === "closed") return ["closed", "open"]
  return [status].filter(Boolean)
}

function JobDetailSheet({ jobId, onClose, onSaved, onDeleted, onAccessDenied }) {
  const [detail, setDetail] = useState(null)
  const [formData, setFormData] = useState({ status: "draft", isHidden: false, isFeatured: false })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState("")
  const requestSequence = useRef(0)

  const loadDetail = useCallback(async () => {
    if (!jobId) return
    const requestId = ++requestSequence.current
    setLoading(true)
    setError("")
    setDetail(null)

    try {
      const response = await getAdminJob(jobId)
      if (requestId !== requestSequence.current) return
      setDetail(response)
      setFormData({
        status: response.job.status,
        isHidden: Boolean(response.job.isHidden),
        isFeatured: Boolean(response.job.isFeatured),
      })
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      if ([401, 403].includes(requestError?.response?.status)) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load this job."))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [jobId, onAccessDenied])

  useEffect(() => {
    // Fetching the selected job intentionally drives the sheet's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail()
    return () => {
      requestSequence.current += 1
    }
  }, [loadDetail])

  const job = detail?.job
  const detailMatchesSelection = job?._id === jobId
  const allowedStatuses = statusOptions(job?.status)
  const proposalReferences = Number(detail?.references?.proposals) || 0
  const contractReferences = Number(detail?.references?.contracts) || 0
  const canDelete = job?.status === "draft" && proposalReferences === 0 && contractReferences === 0

  async function handleSave(event) {
    event.preventDefault()
    if (!detailMatchesSelection) return

    const updates = {}
    if (formData.status !== job.status) updates.status = formData.status
    if (formData.isHidden !== Boolean(job.isHidden)) updates.isHidden = formData.isHidden
    if (formData.isFeatured !== Boolean(job.isFeatured)) updates.isFeatured = formData.isFeatured

    if (Object.keys(updates).length === 0) {
      onSaved(job, "No job changes to save.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const response = await updateAdminJob(jobId, updates)
      setDetail((current) => ({ ...current, job: response.job }))
      setFormData({
        status: response.job.status,
        isHidden: Boolean(response.job.isHidden),
        isFeatured: Boolean(response.job.isFeatured),
      })
      onSaved(response.job, response.message || "Job updated.")
    } catch (requestError) {
      if ([401, 403].includes(requestError?.response?.status)) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not update this job."))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!detailMatchesSelection) return
    setDeleting(true)
    setError("")
    try {
      const response = await deleteAdminJob(jobId)
      setConfirmDelete(false)
      onDeleted(jobId, response.message || "Job deleted.")
    } catch (requestError) {
      if ([401, 403].includes(requestError?.response?.status)) {
        setConfirmDelete(false)
        onAccessDenied?.()
        return
      }
      const references = requestError?.response?.data?.references
      setError(`${getApiErrorMessage(requestError, "Could not delete this job.")}${referenceMessage(references)}`)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Sheet open={Boolean(jobId)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="data-[side=right]:w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Job details</SheetTitle>
            <SheetDescription>Review the listing and manage its marketplace visibility.</SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          ) : detailMatchesSelection ? (
            <div className="space-y-6 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <JobStatusBadge status={job.status} />
                  <VisibilityBadges item={job} />
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">{job.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Posted by {job.client?.name || "Unknown client"}
                  {job.client?.email ? ` · ${job.client.email}` : ""}
                </p>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <section>
                <h3 className="font-medium">Listing summary</h3>
                <dl>
                  <DetailRow label="Category" value={job.category?.name} />
                  <DetailRow label="Budget" value={formatBudget(job)} />
                  <DetailRow label="Experience" value={job.experienceLevel?.replaceAll("_", " ")} />
                  <DetailRow label="Duration" value={job.duration} />
                  <DetailRow label="Deadline" value={formatDate(job.deadline)} />
                  <DetailRow label="Proposals" value={String(proposalReferences)} />
                  <DetailRow label="Contracts" value={String(contractReferences)} />
                  <DetailRow label="Created" value={formatDate(job.createdAt, true)} />
                  <DetailRow label="Updated" value={formatDate(job.updatedAt, true)} />
                  <DetailRow label="Job ID" value={job._id} mono />
                </dl>
              </section>

              <section className="space-y-2">
                <h3 className="font-medium">Description</h3>
                <p className="whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed">
                  {job.description || "No description provided."}
                </p>
              </section>

              {job.skills?.length > 0 && (
                <section className="space-y-2">
                  <h3 className="font-medium">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <Badge key={skill._id || skill} variant="secondary">
                        {skill.name || skill}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              <form onSubmit={handleSave} className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div>
                  <h3 className="font-medium">Moderation controls</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Visibility and featured changes take effect across the marketplace immediately.
                  </p>
                </div>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Status</span>
                  <NativeSelect
                    className="w-full"
                    value={formData.status}
                    disabled={allowedStatuses.length < 2}
                    onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                  >
                    {allowedStatuses.map((status) => (
                      <NativeSelectOption key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {allowedStatuses.length < 2 && (
                    <span className="text-xs text-muted-foreground">
                      Jobs with active or completed work cannot change lifecycle status here.
                    </span>
                  )}
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-background px-3 py-2.5 text-sm">
                  <span>
                    <span className="block font-medium">Hidden from marketplace</span>
                    <span className="block text-xs text-muted-foreground">Keep the record while removing it from public listings.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.isHidden}
                    onChange={(event) => setFormData((current) => ({ ...current, isHidden: event.target.checked }))}
                    className="size-4 accent-primary"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-background px-3 py-2.5 text-sm">
                  <span>
                    <span className="block font-medium">Featured job</span>
                    <span className="block text-xs text-muted-foreground">Mark this listing for curated marketplace placement.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(event) => setFormData((current) => ({ ...current, isFeatured: event.target.checked }))}
                    className="size-4 accent-primary"
                  />
                </label>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </form>

              <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="font-medium text-destructive">Delete job</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canDelete
                    ? "This draft has no linked marketplace history and can be permanently deleted."
                    : "Only drafts without proposals or contracts can be deleted. Hide this job when you need to remove a live or historical listing from the marketplace."}
                </p>
                <Button
                  variant="destructive"
                  className="mt-3"
                  disabled={!canDelete}
                  title={canDelete ? undefined : "Only drafts without linked history can be deleted."}
                  onClick={() => setConfirmDelete(true)}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  Delete job
                </Button>
              </section>
            </div>
          ) : (
            <div className="p-4">
              <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error || "This job could not be loaded."}
              </div>
              <Button variant="outline" className="mt-3" onClick={loadDetail}>Try again</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              “{job?.title || "This job"}” will be permanently removed. This draft has no linked proposals or contracts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting…" : "Delete job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function EmptyJobs({ filtered, onClear }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={1.8} className="size-5" />
      </span>
      <h3 className="font-medium">{filtered ? "No matching jobs" : "No jobs yet"}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {filtered ? "Try changing the search term or listing filters." : "Client job listings will appear here when they are created."}
      </p>
      {filtered && <Button variant="outline" className="mt-4" onClick={onClear}>Clear filters</Button>}
    </div>
  )
}

function JobsSection({ onAccessDenied, onNotice }) {
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [visibility, setVisibility] = useState("")
  const [featured, setFeatured] = useState("")
  const [sort, setSort] = useState("-createdAt")
  const [page, setPage] = useState(1)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const requestSequence = useRef(0)

  const loadJobs = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError("")
    try {
      const response = await getAdminJobs({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        visibility: visibility || undefined,
        featured: featured || undefined,
        sort,
      })
      if (requestId !== requestSequence.current) return
      const nextPagination = response.pagination || { ...emptyPagination, page }
      const lastPage = Math.max(1, nextPagination.totalPages)
      if (page > lastPage) {
        setPage(lastPage)
        return
      }
      setJobs(response.jobs || [])
      setPagination(nextPagination)
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      if ([401, 403].includes(requestError?.response?.status)) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load jobs."))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [featured, onAccessDenied, page, search, sort, status, visibility])

  useEffect(() => {
    // Server-side filters and pagination intentionally reload this table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs()
    return () => {
      requestSequence.current += 1
    }
  }, [loadJobs])

  const filtered = Boolean(search || status || visibility || featured)
  const resultLabel = useMemo(() => {
    if (loading) return "Loading jobs…"
    return `${pagination.total || 0} ${pagination.total === 1 ? "job" : "jobs"}`
  }, [loading, pagination.total])

  function submitSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function clearFilters() {
    setSearchInput("")
    setSearch("")
    setStatus("")
    setVisibility("")
    setFeatured("")
    setSort("-createdAt")
    setPage(1)
  }

  function handleSaved(updatedJob, message) {
    setJobs((current) => current.map((job) => (job._id === updatedJob._id ? { ...job, ...updatedJob } : job)))
    onNotice?.(message)
    loadJobs()
  }

  function handleDeleted(jobId, message) {
    setSelectedJobId(null)
    setJobs((current) => current.filter((job) => job._id !== jobId))
    onNotice?.(message)
    loadJobs()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Marketplace management</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review client listings, control visibility, and manage safe lifecycle changes.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Job listings</CardTitle>
          <CardDescription>{resultLabel}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3 border-b p-4">
            <form onSubmit={submitSearch} className="flex min-w-0 gap-2">
              <div className="relative min-w-0 flex-1">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search title, description, or client"
                  aria-label="Search jobs"
                  className="pl-8"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
              <Button variant="outline" size="icon" onClick={loadJobs} disabled={loading} aria-label="Refresh jobs">
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={loading ? "animate-spin" : ""} />
              </Button>
            </form>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <NativeSelect value={status} aria-label="Filter jobs by status" onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
                <NativeSelectOption value="">All statuses</NativeSelectOption>
                <NativeSelectOption value="draft">Draft</NativeSelectOption>
                <NativeSelectOption value="open">Open</NativeSelectOption>
                <NativeSelectOption value="in_progress">In progress</NativeSelectOption>
                <NativeSelectOption value="completed">Completed</NativeSelectOption>
                <NativeSelectOption value="closed">Closed</NativeSelectOption>
              </NativeSelect>
              <NativeSelect value={visibility} aria-label="Filter jobs by visibility" onChange={(event) => { setVisibility(event.target.value); setPage(1) }}>
                <NativeSelectOption value="">All visibility</NativeSelectOption>
                <NativeSelectOption value="visible">Visible</NativeSelectOption>
                <NativeSelectOption value="hidden">Hidden</NativeSelectOption>
              </NativeSelect>
              <NativeSelect value={featured} aria-label="Filter jobs by featured status" onChange={(event) => { setFeatured(event.target.value); setPage(1) }}>
                <NativeSelectOption value="">All placement</NativeSelectOption>
                <NativeSelectOption value="true">Featured</NativeSelectOption>
                <NativeSelectOption value="false">Not featured</NativeSelectOption>
              </NativeSelect>
              <NativeSelect value={sort} aria-label="Sort jobs" onChange={(event) => { setSort(event.target.value); setPage(1) }}>
                <NativeSelectOption value="-createdAt">Newest first</NativeSelectOption>
                <NativeSelectOption value="createdAt">Oldest first</NativeSelectOption>
                <NativeSelectOption value="title">Title A–Z</NativeSelectOption>
                <NativeSelectOption value="-title">Title Z–A</NativeSelectOption>
                <NativeSelectOption value="-proposalsCount">Most proposals</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>

          {error ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              </span>
              <p className="font-medium">Could not load jobs</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadJobs}>Try again</Button>
            </div>
          ) : !loading && jobs.length === 0 ? (
            <EmptyJobs filtered={filtered} onClear={clearFilters} />
          ) : (
            <>
              <div className="divide-y md:hidden">
                {loading
                  ? Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="space-y-3 p-4">
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div>
                    </div>
                  ))
                  : jobs.map((job) => (
                    <button key={job._id} type="button" className="block w-full p-4 text-left transition-colors hover:bg-muted/30" onClick={() => setSelectedJobId(job._id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{job.title}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{job.client?.name || "Unknown client"} · {job.category?.name || "Uncategorised"}</p>
                        </div>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <VisibilityBadges item={job} />
                        <span className="text-xs text-muted-foreground">{job.proposalsCount || 0} proposals · {formatDate(job.createdAt)}</span>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Proposals</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-14 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 6 }, (_, index) => (
                        <TableRow key={index}>
                          <TableCell className="pl-4"><div className="space-y-1"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell />
                        </TableRow>
                      ))
                      : jobs.map((job) => (
                        <TableRow key={job._id} className="cursor-pointer" onClick={() => setSelectedJobId(job._id)}>
                          <TableCell className="pl-4">
                            <p className="max-w-72 truncate font-medium">{job.title}</p>
                            <p className="max-w-72 truncate text-xs text-muted-foreground">{job.client?.name || "Unknown client"} · {job.category?.name || "Uncategorised"}</p>
                          </TableCell>
                          <TableCell><JobStatusBadge status={job.status} /></TableCell>
                          <TableCell><VisibilityBadges item={job} /></TableCell>
                          <TableCell className="whitespace-nowrap">{formatBudget(job)}</TableCell>
                          <TableCell className="tabular-nums">{job.proposalsCount || 0}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                          <TableCell className="pr-4 text-right">
                            <Button variant="ghost" size="icon-sm" aria-label={`Manage ${job.title}`} onClick={(event) => { event.stopPropagation(); setSelectedJobId(job._id) }}>
                              <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!error && pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs text-muted-foreground">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
                <Button variant="outline" size="icon-sm" disabled={loading || pagination.page <= 1} aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" size="icon-sm" disabled={loading || pagination.page >= pagination.totalPages} aria-label="Next page" onClick={() => setPage((current) => current + 1)}>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <JobDetailSheet
        key={selectedJobId || "closed"}
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onAccessDenied={onAccessDenied}
      />
    </div>
  )
}

export default JobsSection
