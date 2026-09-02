import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  EyeIcon,
  PackageIcon,
  RefreshIcon,
  Search01Icon,
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
  deleteAdminService,
  getAdminService,
  getAdminServices,
  getApiErrorMessage,
  updateAdminService,
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

function formatPrice(packageItem) {
  if (!packageItem || !Number.isFinite(Number(packageItem.price))) return "Not set"
  return `${numberFormatter.format(Number(packageItem.price))} ${packageItem.currency || "BHD"}`
}

function priceRange(packages = []) {
  const activePackages = packages.filter((packageItem) => packageItem.isActive !== false)
  const prices = activePackages
    .map((packageItem) => Number(packageItem.price))
    .filter(Number.isFinite)
  if (prices.length === 0) return "No active pricing"
  const minimum = Math.min(...prices)
  const maximum = Math.max(...prices)
  const currency = activePackages.find((packageItem) => Number.isFinite(Number(packageItem.price)))?.currency || "BHD"
  if (minimum === maximum) return `${numberFormatter.format(minimum)} ${currency}`
  return `${numberFormatter.format(minimum)}–${numberFormatter.format(maximum)} ${currency}`
}

function VisibilityBadge({ hidden }) {
  return (
    <Badge variant="outline" className={hidden ? "text-muted-foreground" : "border-chart-1 bg-chart-1/20 text-chart-5"}>
      <HugeiconsIcon icon={hidden ? ViewOffIcon : EyeIcon} strokeWidth={2} className="size-3" />
      {hidden ? "Hidden" : "Visible"}
    </Badge>
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

function PackageList({ packages = [] }) {
  if (packages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No packages are linked to this service.
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border">
      {packages.map((packageItem) => (
        <div key={packageItem._id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium">{packageItem.title || packageItem.name || "Untitled package"}</h4>
                <Badge variant={packageItem.isActive === false ? "outline" : "secondary"}>
                  {packageItem.isActive === false ? "Inactive" : "Active"}
                </Badge>
              </div>
              {packageItem.name && packageItem.name !== packageItem.title && (
                <p className="mt-0.5 text-xs text-muted-foreground">{packageItem.name}</p>
              )}
            </div>
            <span className="shrink-0 font-semibold tabular-nums">{formatPrice(packageItem)}</span>
          </div>
          {packageItem.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{packageItem.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{packageItem.deliveryDays || "—"} delivery days</span>
            <span>{packageItem.revisions ?? 0} revisions</span>
            <span>Order {packageItem.sortOrder ?? 0}</span>
          </div>
          {packageItem.features?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {packageItem.features.map((feature, index) => (
                <Badge key={`${packageItem._id}-${index}`} variant="outline">{feature}</Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ServiceDetailSheet({ serviceId, onClose, onSaved, onDeleted, onAccessDenied }) {
  const [detail, setDetail] = useState(null)
  const [name, setName] = useState("")
  const [isHidden, setIsHidden] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState("")
  const requestSequence = useRef(0)

  const loadDetail = useCallback(async () => {
    if (!serviceId) return
    const requestId = ++requestSequence.current
    setLoading(true)
    setError("")
    setDetail(null)
    try {
      const response = await getAdminService(serviceId)
      if (requestId !== requestSequence.current) return
      setDetail(response)
      setName(response.service.name || "")
      setIsHidden(Boolean(response.service.isHidden))
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      if ([401, 403].includes(requestError?.response?.status)) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load this service."))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [onAccessDenied, serviceId])

  useEffect(() => {
    // Fetching the selected service intentionally drives the sheet's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail()
    return () => {
      requestSequence.current += 1
    }
  }, [loadDetail])

  const service = detail?.service
  const detailMatchesSelection = service?._id === serviceId
  const contractReferences = Number(detail?.references?.contracts) || 0
  const canDelete = contractReferences === 0

  async function handleSave(event) {
    event.preventDefault()
    if (!detailMatchesSelection) return
    const trimmedName = name.trim()
    const updates = {}
    if (trimmedName !== service.name) updates.name = trimmedName
    if (isHidden !== Boolean(service.isHidden)) updates.isHidden = isHidden

    if (Object.keys(updates).length === 0) {
      onSaved(service, "No service changes to save.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const response = await updateAdminService(serviceId, updates)
      setDetail((current) => ({ ...current, service: response.service }))
      setName(response.service.name || "")
      setIsHidden(Boolean(response.service.isHidden))
      onSaved(response.service, response.message || "Service updated.")
    } catch (requestError) {
      if ([401, 403].includes(requestError?.response?.status)) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not update this service."))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!detailMatchesSelection) return
    setDeleting(true)
    setError("")
    try {
      const response = await deleteAdminService(serviceId)
      setConfirmDelete(false)
      onDeleted(serviceId, response.message || "Service deleted.")
    } catch (requestError) {
      if ([401, 403].includes(requestError?.response?.status)) {
        setConfirmDelete(false)
        onAccessDenied?.()
        return
      }
      const references = requestError?.response?.data?.references
      setError(`${getApiErrorMessage(requestError, "Could not delete this service.")}${referenceMessage(references)}`)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Sheet open={Boolean(serviceId)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="data-[side=right]:w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Service details</SheetTitle>
            <SheetDescription>Review packages and manage how the service appears in the marketplace.</SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : detailMatchesSelection ? (
            <div className="space-y-6 p-4">
              <div className="flex items-start gap-4">
                {service.images?.[0]?.url ? (
                  <img src={service.images[0].url} alt="" className="size-20 shrink-0 rounded-xl border object-cover" />
                ) : (
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={PackageIcon} strokeWidth={1.6} className="size-7" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <VisibilityBadge hidden={service.isHidden} />
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">{service.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    By {service.freelancer?.name || "Unknown freelancer"}
                    {service.freelancer?.email ? ` · ${service.freelancer.email}` : ""}
                  </p>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <section>
                <h3 className="font-medium">Service summary</h3>
                <dl>
                  <DetailRow label="Freelancer" value={service.freelancer?.name} />
                  <DetailRow label="Account status" value={service.freelancer?.status} />
                  <DetailRow label="Pricing" value={priceRange(service.packages)} />
                  <DetailRow label="Packages" value={String(service.packages?.length || 0)} />
                  <DetailRow label="Images" value={String(service.images?.length || 0)} />
                  <DetailRow label="Contracts" value={String(contractReferences)} />
                  <DetailRow label="Created" value={formatDate(service.createdAt, true)} />
                  <DetailRow label="Updated" value={formatDate(service.updatedAt, true)} />
                  <DetailRow label="Service ID" value={service._id} mono />
                </dl>
              </section>

              {service.images?.length > 1 && (
                <section className="space-y-2">
                  <h3 className="font-medium">Gallery</h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {service.images.map((image) => (
                      <img key={image.url} src={image.url} alt="" className="aspect-square w-full rounded-lg border object-cover" />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <h3 className="font-medium">Packages</h3>
                  <span className="text-xs text-muted-foreground">Read-only here</span>
                </div>
                <PackageList packages={service.packages} />
              </section>

              <form onSubmit={handleSave} className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div>
                  <h3 className="font-medium">Service controls</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Rename the service or remove it from public discovery.</p>
                </div>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Service name</span>
                  <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-background px-3 py-2.5 text-sm">
                  <span>
                    <span className="block font-medium">Hidden from marketplace</span>
                    <span className="block text-xs text-muted-foreground">Keep packages and history while removing public access.</span>
                  </span>
                  <input type="checkbox" checked={isHidden} onChange={(event) => setIsHidden(event.target.checked)} className="size-4 accent-primary" />
                </label>
                <Button type="submit" disabled={saving || !name.trim()}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </form>

              <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="font-medium text-destructive">Delete service</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canDelete
                    ? "This service has no contract history and can be permanently deleted. Packages remain owned by the freelancer."
                    : "Services with contract history cannot be deleted. Hide this service to remove it from the marketplace while preserving its records."}
                </p>
                <Button
                  variant="destructive"
                  className="mt-3"
                  disabled={!canDelete}
                  title={canDelete ? undefined : "Services with contract history cannot be deleted."}
                  onClick={() => setConfirmDelete(true)}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  Delete service
                </Button>
              </section>
            </div>
          ) : (
            <div className="p-4">
              <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error || "This service could not be loaded."}
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
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>
              “{service?.name || "This service"}” will be permanently removed. It has no linked contract history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting…" : "Delete service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function EmptyServices({ filtered, onClear }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <HugeiconsIcon icon={PackageIcon} strokeWidth={1.8} className="size-5" />
      </span>
      <h3 className="font-medium">{filtered ? "No matching services" : "No services yet"}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {filtered ? "Try changing the search term or visibility filter." : "Freelancer services will appear here when they are created."}
      </p>
      {filtered && <Button variant="outline" className="mt-4" onClick={onClear}>Clear filters</Button>}
    </div>
  )
}

function ServicesSection({ onAccessDenied, onNotice }) {
  const [services, setServices] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [visibility, setVisibility] = useState("")
  const [sort, setSort] = useState("-createdAt")
  const [page, setPage] = useState(1)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const requestSequence = useRef(0)

  const loadServices = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError("")
    try {
      const response = await getAdminServices({
        page,
        limit: 10,
        search: search || undefined,
        visibility: visibility || undefined,
        sort,
      })
      if (requestId !== requestSequence.current) return
      const nextPagination = response.pagination || { ...emptyPagination, page }
      const lastPage = Math.max(1, nextPagination.totalPages)
      if (page > lastPage) {
        setPage(lastPage)
        return
      }
      setServices(response.services || [])
      setPagination(nextPagination)
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      if ([401, 403].includes(requestError?.response?.status)) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load services."))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [onAccessDenied, page, search, sort, visibility])

  useEffect(() => {
    // Server-side filters and pagination intentionally reload this table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadServices()
    return () => {
      requestSequence.current += 1
    }
  }, [loadServices])

  const filtered = Boolean(search || visibility)
  const resultLabel = useMemo(() => {
    if (loading) return "Loading services…"
    return `${pagination.total || 0} ${pagination.total === 1 ? "service" : "services"}`
  }, [loading, pagination.total])

  function submitSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function clearFilters() {
    setSearchInput("")
    setSearch("")
    setVisibility("")
    setSort("-createdAt")
    setPage(1)
  }

  function handleSaved(updatedService, message) {
    setServices((current) => current.map((service) => (service._id === updatedService._id ? { ...service, ...updatedService } : service)))
    onNotice?.(message)
    loadServices()
  }

  function handleDeleted(serviceId, message) {
    setSelectedServiceId(null)
    setServices((current) => current.filter((service) => service._id !== serviceId))
    onNotice?.(message)
    loadServices()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Marketplace management</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review freelancer offerings, inspect package pricing, and control public visibility.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Service listings</CardTitle>
          <CardDescription>{resultLabel}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
            <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
              <div className="relative min-w-0 flex-1">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search service or freelancer" aria-label="Search services" className="pl-8" />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 lg:flex">
              <NativeSelect className="w-full lg:w-40" value={visibility} aria-label="Filter services by visibility" onChange={(event) => { setVisibility(event.target.value); setPage(1) }}>
                <NativeSelectOption value="">All visibility</NativeSelectOption>
                <NativeSelectOption value="visible">Visible</NativeSelectOption>
                <NativeSelectOption value="hidden">Hidden</NativeSelectOption>
              </NativeSelect>
              <NativeSelect className="w-full lg:w-40" value={sort} aria-label="Sort services" onChange={(event) => { setSort(event.target.value); setPage(1) }}>
                <NativeSelectOption value="-createdAt">Newest first</NativeSelectOption>
                <NativeSelectOption value="createdAt">Oldest first</NativeSelectOption>
                <NativeSelectOption value="name">Name A–Z</NativeSelectOption>
                <NativeSelectOption value="-name">Name Z–A</NativeSelectOption>
              </NativeSelect>
              <Button variant="outline" size="icon" onClick={loadServices} disabled={loading} aria-label="Refresh services">
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {error ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              </span>
              <p className="font-medium">Could not load services</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadServices}>Try again</Button>
            </div>
          ) : !loading && services.length === 0 ? (
            <EmptyServices filtered={filtered} onClear={clearFilters} />
          ) : (
            <>
              <div className="divide-y md:hidden">
                {loading
                  ? Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex gap-3 p-4">
                      <Skeleton className="size-14 rounded-lg" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-5 w-20" /></div>
                    </div>
                  ))
                  : services.map((service) => (
                    <button key={service._id} type="button" className="flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/30" onClick={() => setSelectedServiceId(service._id)}>
                      {service.images?.[0]?.url ? (
                        <img src={service.images[0].url} alt="" className="size-14 shrink-0 rounded-lg border object-cover" />
                      ) : (
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground"><HugeiconsIcon icon={PackageIcon} strokeWidth={1.7} /></span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{service.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {service.freelancer?.name || "Unknown freelancer"} · {service.packages?.length || 0} {service.packages?.length === 1 ? "package" : "packages"}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <VisibilityBadge hidden={service.isHidden} />
                          <span className="text-xs text-muted-foreground">{priceRange(service.packages)}</span>
                        </span>
                      </span>
                    </button>
                  ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Service</TableHead>
                      <TableHead>Freelancer</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-14 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 6 }, (_, index) => (
                        <TableRow key={index}>
                          <TableCell className="pl-4"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-lg" /><Skeleton className="h-4 w-40" /></div></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell />
                        </TableRow>
                      ))
                      : services.map((service) => (
                        <TableRow key={service._id} className="cursor-pointer" onClick={() => setSelectedServiceId(service._id)}>
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-3">
                              {service.images?.[0]?.url ? (
                                <img src={service.images[0].url} alt="" className="size-10 shrink-0 rounded-lg border object-cover" />
                              ) : (
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground"><HugeiconsIcon icon={PackageIcon} strokeWidth={1.7} /></span>
                              )}
                              <p className="max-w-64 truncate font-medium">{service.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-48 truncate">{service.freelancer?.name || "Unknown freelancer"}</p>
                            <p className="max-w-48 truncate text-xs text-muted-foreground">{service.freelancer?.email}</p>
                          </TableCell>
                          <TableCell><VisibilityBadge hidden={service.isHidden} /></TableCell>
                          <TableCell className="tabular-nums">{service.packages?.length || 0}</TableCell>
                          <TableCell className="whitespace-nowrap">{priceRange(service.packages)}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(service.createdAt)}</TableCell>
                          <TableCell className="pr-4 text-right">
                            <Button variant="ghost" size="icon-sm" aria-label={`Manage ${service.name}`} onClick={(event) => { event.stopPropagation(); setSelectedServiceId(service._id) }}>
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

      <ServiceDetailSheet
        key={selectedServiceId || "closed"}
        serviceId={selectedServiceId}
        onClose={() => setSelectedServiceId(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onAccessDenied={onAccessDenied}
      />
    </div>
  )
}

export default ServicesSection
