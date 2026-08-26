import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Alert02Icon,
  BookOpen01Icon,
  Delete02Icon,
  Edit02Icon,
  FolderLibraryIcon,
  RefreshIcon,
  Search01Icon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
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
  createAdminCategory,
  createAdminSkill,
  deleteAdminCategory,
  getAdminCategories,
  getAdminSkills,
  getApiErrorMessage,
  updateAdminCategory,
  updateAdminSkill,
} from "@/services/adminService"

function ResourceDialog({ editor, categories, onClose, onSaved, onAccessDenied }) {
  const isSkill = editor?.resource === "skill"
  const isEditing = editor?.action === "edit"
  const [name, setName] = useState(editor?.item?.name || "")
  const [slug, setSlug] = useState(editor?.item?.slug || "")
  const [category, setCategory] = useState(editor?.item?.category?._id || categories[0]?._id || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      let response
      if (isSkill) {
        const payload = { name: name.trim(), category }
        response = isEditing
          ? await updateAdminSkill(editor.item._id, payload)
          : await createAdminSkill(payload)
      } else {
        const payload = { name: name.trim(), ...(slug.trim() ? { slug: slug.trim() } : {}) }
        response = isEditing
          ? await updateAdminCategory(editor.item._id, payload)
          : await createAdminCategory(payload)
      }

      onSaved(response.message || `${isSkill ? "Skill" : "Category"} saved.`)
      onClose()
    } catch (requestError) {
      if (requestError?.response?.status === 403) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, `Could not save this ${isSkill ? "skill" : "category"}.`))
    } finally {
      setSaving(false)
    }
  }

  if (!editor) return null

  const resourceLabel = isSkill ? "skill" : "category"

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} {resourceLabel}</DialogTitle>
          <DialogDescription>
            {isSkill
              ? "Maintain the master list people use on profiles and jobs."
              : "Categories keep jobs and skills organised across the marketplace."}
          </DialogDescription>
        </DialogHeader>
        <form id="resource-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
          </label>
          {isSkill ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Category</span>
              <NativeSelect
                className="w-full"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              >
                {categories.map((item) => (
                  <NativeSelectOption key={item._id} value={item._id}>{item.name}</NativeSelectOption>
                ))}
              </NativeSelect>
              {categories.length === 0 && (
                <span className="text-xs text-destructive">Create a category before adding skills.</span>
              )}
            </label>
          ) : (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Slug <span className="font-normal text-muted-foreground">(optional)</span></span>
              <Input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="Generated from the name"
              />
              <span className="text-xs text-muted-foreground">Used in URLs and API filters.</span>
            </label>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="resource-form" disabled={saving || !name.trim() || (isSkill && !category)}>
            {saving ? "Saving…" : isEditing ? "Save changes" : `Add ${resourceLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TaxonomySection({ mode, onAccessDenied, onNotice }) {
  const isSkills = mode === "skills"
  const [categories, setCategories] = useState([])
  const [skills, setSkills] = useState([])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [editor, setEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const dataRequestSequence = useRef(0)

  const loadData = useCallback(async () => {
    const requestId = ++dataRequestSequence.current
    setLoading(true)
    setError("")

    try {
      const [categoryResponse, skillResponse] = await Promise.all([
        getAdminCategories(),
        getAdminSkills({
          search: isSkills && search ? search : undefined,
          category: isSkills && categoryFilter ? categoryFilter : undefined,
        }),
      ])
      if (requestId !== dataRequestSequence.current) return
      setCategories(categoryResponse.categories || [])
      setSkills(skillResponse.skills || [])
    } catch (requestError) {
      if (requestId !== dataRequestSequence.current) return
      if (requestError?.response?.status === 403) {
        onAccessDenied?.()
        return
      }
      setError(getApiErrorMessage(requestError, `Could not load ${isSkills ? "skills" : "categories"}.`))
    } finally {
      if (requestId === dataRequestSequence.current) setLoading(false)
    }
  }, [categoryFilter, isSkills, onAccessDenied, search])

  useEffect(() => {
    // Server-side search and category filters intentionally reload this list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    return () => {
      dataRequestSequence.current += 1
    }
  }, [loadData])

  const categorySkillCounts = useMemo(() => {
    return skills.reduce((counts, skill) => {
      const categoryId = skill.category?._id || skill.category
      if (categoryId) counts[categoryId] = (counts[categoryId] || 0) + 1
      return counts
    }, {})
  }, [skills])

  const visibleCategories = useMemo(() => {
    if (isSkills || !search) return categories
    const query = search.toLowerCase()
    return categories.filter((item) => item.name.toLowerCase().includes(query) || item.slug?.toLowerCase().includes(query))
  }, [categories, isSkills, search])

  function submitSearch(event) {
    event.preventDefault()
    setSearch(searchInput.trim())
  }

  function openCreate() {
    setEditor({ resource: isSkills ? "skill" : "category", action: "create", item: null })
  }

  function openEdit(item) {
    setEditor({ resource: isSkills ? "skill" : "category", action: "edit", item })
  }

  async function handleDelete() {
    if (!deleteTarget || isSkills) return
    setDeleting(true)
    setError("")

    try {
      const response = await deleteAdminCategory(deleteTarget._id)
      setDeleteTarget(null)
      onNotice?.(response.message || "Category deleted.")
      await loadData()
    } catch (requestError) {
      if (requestError?.response?.status === 403) {
        setDeleteTarget(null)
        onAccessDenied?.()
        return
      }
      const references = requestError?.response?.data?.references
      let message = getApiErrorMessage(requestError, "Could not delete this category.")
      if (references) {
        message += ` References: ${references.skills || 0} skills and ${references.jobs || 0} jobs.`
      }
      setError(message)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleSaved(message) {
    onNotice?.(message)
    await loadData()
  }

  const items = isSkills ? skills : visibleCategories

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">Marketplace taxonomy</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{isSkills ? "Skills" : "Categories"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSkills
              ? "Maintain the consistent skill list used across jobs and freelancer profiles."
              : "Organise marketplace work into clear, discoverable categories."}
          </p>
        </div>
        <Button onClick={openCreate} disabled={isSkills && categories.length === 0}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Add {isSkills ? "skill" : "category"}
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isSkills && categories.length === 0 && !loading && !error && (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          Create at least one category before adding skills.
        </div>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{isSkills ? "Master skills list" : "Job categories"}</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${items.length} ${items.length === 1 ? "item" : "items"}`}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
            <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
              <div className="relative min-w-0 flex-1">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={`Search ${isSkills ? "skills" : "categories"}`}
                  aria-label={`Search ${isSkills ? "skills" : "categories"}`}
                  className="pl-8"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
            {isSkills && (
              <NativeSelect
                className="w-full sm:w-52"
                value={categoryFilter}
                aria-label="Filter skills by category"
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <NativeSelectOption value="">All categories</NativeSelectOption>
                {categories.map((category) => (
                  <NativeSelectOption key={category._id} value={category._id}>{category.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            )}
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading} aria-label="Refresh list">
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 px-2 py-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-36" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-7 w-16" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={isSkills ? BookOpen01Icon : FolderLibraryIcon} strokeWidth={1.8} className="size-5" />
              </span>
              <h3 className="font-medium">No {isSkills ? "skills" : "categories"} found</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {search || categoryFilter ? "Try a different search or filter." : `Add the first ${isSkills ? "skill" : "category"} to get started.`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>{isSkills ? "Category" : "Slug"}</TableHead>
                  {!isSkills && <TableHead>Skills</TableHead>}
                  <TableHead className="w-28 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
                          <HugeiconsIcon icon={isSkills ? BookOpen01Icon : FolderLibraryIcon} strokeWidth={2} />
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSkills ? (
                        <Badge variant="outline">{item.category?.name || "Uncategorised"}</Badge>
                      ) : (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{item.slug}</code>
                      )}
                    </TableCell>
                    {!isSkills && <TableCell className="text-muted-foreground">{categorySkillCounts[item._id] || 0}</TableCell>}
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)}>
                          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={isSkills ? `Skill deletion unavailable for ${item.name}` : `Delete ${item.name}`}
                          title={isSkills ? "Skill deletion is disabled until backend reference checks are available." : undefined}
                          disabled={isSkills}
                          onClick={() => !isSkills && setDeleteTarget(item)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isSkills && (
        <p className="text-xs text-muted-foreground">
          Skill deletion is disabled because the current backend does not protect references from jobs or freelancer profiles. Skills can still be added or edited safely.
        </p>
      )}

      {editor && (
        <ResourceDialog
          key={`${editor.resource}-${editor.action}-${editor.item?._id || "new"}`}
          editor={editor}
          categories={categories}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
          onAccessDenied={onAccessDenied}
        />
      )}

      <AlertDialog open={!isSkills && Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This category can only be deleted when no skills or jobs reference it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default TaxonomySection
