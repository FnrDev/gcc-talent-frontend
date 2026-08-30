import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Mail01Icon,
  RefreshIcon,
  Search01Icon,
  UserIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  getAdminUser,
  getAdminUsers,
  getApiErrorMessage,
  updateAdminUser,
} from "@/services/adminService"

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

const numberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 2 })

function formatDate(value, includeTime = false) {
  if (!value) return "Not available"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"
  return (includeTime ? dateTimeFormatter : dateFormatter).format(date)
}

function initials(name) {
  return (name || "User")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function RoleBadge({ role }) {
  return <Badge variant="outline" className="capitalize">{role}</Badge>
}

function StatusBadge({ status }) {
  const active = status === "active"
  return (
    <Badge
      variant={active ? "secondary" : "destructive"}
      className={active ? "bg-chart-1/35 text-chart-5" : ""}
    >
      <span className={`size-1.5 rounded-full ${active ? "bg-chart-4" : "bg-destructive"}`} />
      <span className="capitalize">{status}</span>
    </Badge>
  )
}

function EmptyUsers({ filtered, onClear }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <HugeiconsIcon icon={UserIcon} strokeWidth={1.8} className="size-5" />
      </span>
      <h3 className="font-medium">{filtered ? "No matching users" : "No users yet"}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try changing the search term or account filters."
          : "User accounts will appear here after people join the marketplace."}
      </p>
      {filtered && <Button variant="outline" className="mt-4" onClick={onClear}>Clear filters</Button>}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[65%] text-right font-medium">{value || "—"}</span>
    </div>
  )
}

function HistoryList({ title, summary, type }) {
  const items = summary?.items || []
  const total = summary?.total || 0

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {total > 20 ? `Latest 20 of ${total}` : `${total} total`}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} recorded.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((item) => (
            <div key={item._id} className="flex items-start justify-between gap-4 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {type === "contract" ? item.title || "Untitled contract" : item.type?.replaceAll("_", " ")}
                </p>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {item.status} · {formatDate(item.createdAt)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {type === "contract"
                  ? `${numberFormatter.format(Number(item.totalAmount) || 0)} ${item.currency || ""}`.trim()
                  : numberFormatter.format(Number(item.amount) || 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function UserDetailSheet({
  userId,
  currentAdminId,
  onClose,
  onUserUpdated,
  onAccessDenied,
}) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    role: "client",
    status: "active",
    isEmailVerified: false,
  })
  const requestSequence = useRef(0)

  const loadDetail = useCallback(async () => {
    if (!userId) return
    const requestId = ++requestSequence.current
    setLoading(true)
    setError("")
    setDetail(null)

    try {
      const response = await getAdminUser(userId)
      if (requestId !== requestSequence.current) return
      setDetail(response)
      setFormData({
        role: response.user.role,
        status: response.user.status,
        isEmailVerified: Boolean(response.user.isEmailVerified),
      })
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      if (requestError?.response?.status === 403) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load this user."))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [onAccessDenied, userId])

  useEffect(() => {
    // Fetching the selected record intentionally drives the sheet's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail()
    return () => {
      requestSequence.current += 1
    }
  }, [loadDetail])

  const isSelf = detail?.user?._id === currentAdminId
  const detailMatchesSelection = detail?.user?._id === userId

  async function handleSave(event) {
    event.preventDefault()
    if (!detailMatchesSelection) return
    const updates = {}
    if (formData.role !== detail.user.role) updates.role = formData.role
    if (formData.status !== detail.user.status) updates.status = formData.status
    if (formData.isEmailVerified !== Boolean(detail.user.isEmailVerified)) {
      updates.isEmailVerified = formData.isEmailVerified
    }

    if (Object.keys(updates).length === 0) {
      onUserUpdated(detail.user, "No account changes to save.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await updateAdminUser(userId, updates)
      setDetail((current) => ({ ...current, user: { ...current.user, ...response.user } }))
      onUserUpdated(response.user, response.message)
    } catch (requestError) {
      if (requestError?.response?.status === 403) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not update this user."))
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspendInstead() {
    if (!detailMatchesSelection) return
    setSaving(true)
    setError("")
    try {
      const response = await updateAdminUser(userId, { status: "suspended" })
      setDetail((current) => ({ ...current, user: { ...current.user, ...response.user } }))
      setFormData((current) => ({ ...current, status: "suspended" }))
      onUserUpdated(response.user, "User suspended instead of deleted.")
    } catch (requestError) {
      if (requestError?.response?.status === 403) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not suspend this user."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={Boolean(userId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>User account</SheetTitle>
          <SheetDescription>Review identity, marketplace history, and account access.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-48" /></div>
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : detailMatchesSelection ? (
          <div className="space-y-6 p-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                {detail.user.avatarUrl && <AvatarImage src={detail.user.avatarUrl} alt="" />}
                <AvatarFallback>{initials(detail.user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold">{detail.user.name}</h2>
                  {isSelf && <Badge variant="outline">You</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{detail.user.email}</p>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                <div className="flex items-start gap-2">
                  <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {!isSelf && detail.user.status !== "suspended" && error.toLowerCase().includes("history") && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleSuspendInstead} disabled={saving}>
                    Suspend instead
                  </Button>
                )}
              </div>
            )}

            <section>
              <h3 className="mb-1 font-medium">Account summary</h3>
              <div className="text-sm">
                <DetailRow label="Location" value={[detail.user.city, detail.user.country].filter(Boolean).join(", ")} />
                <DetailRow label="Joined" value={formatDate(detail.user.createdAt)} />
                <DetailRow label="Last login" value={formatDate(detail.user.lastLoginAt, true)} />
                <DetailRow label="Rating" value={`${numberFormatter.format(detail.user.ratingAvg || 0)} from ${detail.user.ratingCount || 0} reviews`} />
                <DetailRow label="Wallet available" value={numberFormatter.format(detail.user.wallet?.available || 0)} />
                <DetailRow label="Wallet pending" value={numberFormatter.format(detail.user.wallet?.pending || 0)} />
              </div>
            </section>

            <form onSubmit={handleSave} className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <div>
                <h3 className="font-medium">Access controls</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Changes are enforced immediately by the backend.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Role</span>
                  <NativeSelect
                    className="w-full"
                    value={formData.role}
                    disabled={isSelf}
                    onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))}
                  >
                    <NativeSelectOption value="client">Client</NativeSelectOption>
                    <NativeSelectOption value="freelancer">Freelancer</NativeSelectOption>
                    <NativeSelectOption value="admin">Admin</NativeSelectOption>
                  </NativeSelect>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Status</span>
                  <NativeSelect
                    className="w-full"
                    value={formData.status}
                    disabled={isSelf}
                    onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                  >
                    <NativeSelectOption value="active">Active</NativeSelectOption>
                    <NativeSelectOption value="suspended">Suspended</NativeSelectOption>
                  </NativeSelect>
                </label>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-background px-3 py-2.5 text-sm">
                <span>
                  <span className="block font-medium">Email verified</span>
                  <span className="block text-xs text-muted-foreground">Allow this account to appear as verified.</span>
                </span>
                <input
                  type="checkbox"
                  checked={formData.isEmailVerified}
                  onChange={(event) => setFormData((current) => ({ ...current, isEmailVerified: event.target.checked }))}
                  className="size-4 accent-primary"
                />
              </label>
              {isSelf && (
                <p className="text-xs text-muted-foreground">Your own role and status cannot be changed here.</p>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>

            <HistoryList title="Contracts" summary={detail.contracts} type="contract" />
            <HistoryList title="Transactions" summary={detail.transactions} type="transaction" />

            <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <h3 className="font-medium text-destructive">Permanent deletion unavailable</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The current backend does not protect every profile and proposal reference. Suspend the account above instead of deleting it.
              </p>
              <Button
                variant="destructive"
                className="mt-3"
                disabled
                title="User deletion is disabled until all backend references are protected."
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                Delete user
              </Button>
            </section>
          </div>
        ) : (
          <div className="p-4">
            <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error || "This user could not be loaded."}
            </div>
            <Button variant="outline" className="mt-3" onClick={loadDetail}>Try again</Button>
          </div>
        )}
      </SheetContent>

    </Sheet>
  )
}

function UsersSection({ currentAdminId, onAccessDenied, onNotice }) {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [sort, setSort] = useState("-createdAt")
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const listRequestSequence = useRef(0)

  const loadUsers = useCallback(async () => {
    const requestId = ++listRequestSequence.current
    setLoading(true)
    setError("")

    try {
      const response = await getAdminUsers({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        sort,
        page,
        limit: 10,
      })
      if (requestId !== listRequestSequence.current) return
      setUsers(response.users || [])
      setPagination(response.pagination || { page, limit: 10, total: 0, totalPages: 0 })
    } catch (requestError) {
      if (requestId !== listRequestSequence.current) return
      if (requestError?.response?.status === 403) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, "Could not load users."))
    } finally {
      if (requestId === listRequestSequence.current) setLoading(false)
    }
  }, [onAccessDenied, page, role, search, sort, status])

  useEffect(() => {
    // Server-side filters and explicit refreshes intentionally reload this table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
    return () => {
      listRequestSequence.current += 1
    }
  }, [loadUsers])

  const filtered = Boolean(search || role || status)
  const resultLabel = useMemo(() => {
    if (loading) return "Loading users…"
    if (pagination.total === 1) return "1 user"
    return `${pagination.total || 0} users`
  }, [loading, pagination.total])

  function submitSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function clearFilters() {
    setSearchInput("")
    setSearch("")
    setRole("")
    setStatus("")
    setSort("-createdAt")
    setPage(1)
  }

  function handleUserUpdated(updatedUser, message) {
    setUsers((current) => current.map((user) => (user._id === updatedUser._id ? { ...user, ...updatedUser } : user)))
    onNotice?.(message || "User updated.")
    loadUsers()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Account management</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search accounts, review marketplace history, and manage access.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Marketplace users</CardTitle>
          <CardDescription>{resultLabel}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
            <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
              <div className="relative min-w-0 flex-1">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by name or email"
                  aria-label="Search users"
                  className="pl-8"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <NativeSelect
                className="w-full sm:w-36"
                value={role}
                aria-label="Filter by role"
                onChange={(event) => { setRole(event.target.value); setPage(1) }}
              >
                <NativeSelectOption value="">All roles</NativeSelectOption>
                <NativeSelectOption value="client">Clients</NativeSelectOption>
                <NativeSelectOption value="freelancer">Freelancers</NativeSelectOption>
                <NativeSelectOption value="admin">Admins</NativeSelectOption>
              </NativeSelect>
              <NativeSelect
                className="w-full sm:w-36"
                value={status}
                aria-label="Filter by status"
                onChange={(event) => { setStatus(event.target.value); setPage(1) }}
              >
                <NativeSelectOption value="">All statuses</NativeSelectOption>
                <NativeSelectOption value="active">Active</NativeSelectOption>
                <NativeSelectOption value="suspended">Suspended</NativeSelectOption>
              </NativeSelect>
              <NativeSelect
                className="col-span-2 w-full sm:w-44"
                value={sort}
                aria-label="Sort users"
                onChange={(event) => { setSort(event.target.value); setPage(1) }}
              >
                <NativeSelectOption value="-createdAt">Newest first</NativeSelectOption>
                <NativeSelectOption value="createdAt">Oldest first</NativeSelectOption>
                <NativeSelectOption value="name">Name A–Z</NativeSelectOption>
                <NativeSelectOption value="-name">Name Z–A</NativeSelectOption>
                <NativeSelectOption value="email">Email A–Z</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>

          {error ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              </span>
              <p className="font-medium">Could not load users</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadUsers}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
                Try again
              </Button>
            </div>
          ) : !loading && users.length === 0 ? (
            <EmptyUsers filtered={filtered} onClear={clearFilters} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-14 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 6 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell className="pl-4"><div className="flex items-center gap-3"><Skeleton className="size-8 rounded-full" /><div className="space-y-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-40" /></div></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                  : users.map((user) => (
                    <TableRow key={user._id} className="cursor-pointer" onClick={() => setSelectedUserId(user._id)}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                            <AvatarFallback>{initials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="max-w-52 truncate font-medium">{user.name}</p>
                              {user._id === currentAdminId && <Badge variant="outline" className="hidden sm:inline-flex">You</Badge>}
                            </div>
                            <p className="max-w-64 truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell><StatusBadge status={user.status} /></TableCell>
                      <TableCell>
                        {user.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-chart-5">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4" /> Unverified
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`View ${user.name}`}
                          onClick={(event) => { event.stopPropagation(); setSelectedUserId(user._id) }}
                        >
                          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}

          {!error && pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs text-muted-foreground">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={loading || pagination.page <= 1}
                  aria-label="Previous page"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={loading || pagination.page >= pagination.totalPages}
                  aria-label="Next page"
                  onClick={() => setPage((current) => current + 1)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailSheet
        key={selectedUserId || "closed"}
        userId={selectedUserId}
        currentAdminId={currentAdminId}
        onClose={() => setSelectedUserId(null)}
        onUserUpdated={handleUserUpdated}
        onAccessDenied={onAccessDenied}
      />
    </div>
  )
}

export default UsersSection
