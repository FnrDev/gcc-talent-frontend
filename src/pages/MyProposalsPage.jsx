import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Briefcase02Icon,
  Calendar03Icon,
  Clock01Icon,
  Delete02Icon,
  Edit02Icon,
  File02Icon,
  Money03Icon,
  PlusSignIcon,
  SentIcon,
} from '@hugeicons/core-free-icons'
import {
  getMyProposals,
  updateProposal,
  uploadProposalAttachment,
  withdrawProposal,
} from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

const PROPOSAL_STATUSES = ['pending', 'shortlisted', 'accepted', 'declined', 'withdrawn']

const BHD_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function formatDate(value) {
  if (!value) return 'Unknown date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return new Intl.DateTimeFormat('en-BH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function statusVariant(status) {
  if (status === 'accepted') return 'default'
  if (status === 'declined' || status === 'withdrawn') return 'destructive'
  if (status === 'shortlisted') return 'secondary'
  return 'outline'
}

function normalizeResult(result) {
  const data = result?.data || result || {}

  return {
    proposals: Array.isArray(data) ? data : data.proposals || [],
    pagination: data.pagination || {
      page: 1,
      total: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
    },
  }
}

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function proposalEditForm(proposal) {
  return {
    coverLetter: proposal.coverLetter || '',
    amount: proposal.amount ?? '',
    deliveryDays: proposal.deliveryDays ?? '',
    milestones: Array.isArray(proposal.milestones)
      ? proposal.milestones.map((milestone) => ({
          title: milestone.title || '',
          description: milestone.description || '',
          amount: milestone.amount ?? '',
          dueDate: toDateInput(milestone.dueDate),
        }))
      : [],
    attachments: Array.isArray(proposal.attachments) ? proposal.attachments : [],
    files: [],
  }
}

function PendingProposalActions({ proposal, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => proposalEditForm(proposal))
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function addMilestone() {
    if (form.milestones.length >= 20) return
    setForm((current) => ({
      ...current,
      milestones: [...current.milestones, { title: '', description: '', amount: '', dueDate: '' }],
    }))
  }

  function updateMilestone(index, field, value) {
    setForm((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, milestoneIndex) => (
        milestoneIndex === index ? { ...milestone, [field]: value } : milestone
      )),
    }))
    setErrors((current) => ({ ...current, milestones: '' }))
  }

  function removeMilestone(index) {
    setForm((current) => ({
      ...current,
      milestones: current.milestones.filter((_, milestoneIndex) => milestoneIndex !== index),
    }))
  }

  function removeAttachment(index) {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
    }))
  }

  function validate() {
    const nextErrors = {}
    const amount = Number(form.amount)
    const days = Number(form.deliveryDays)

    if (!form.coverLetter.trim()) nextErrors.coverLetter = 'Cover letter is required.'
    else if (form.coverLetter.trim().length > 5000) nextErrors.coverLetter = 'Keep the cover letter to 5000 characters or fewer.'
    if (form.amount === '' || !Number.isFinite(amount) || amount <= 0) nextErrors.amount = 'Enter a positive amount.'
    if (!Number.isInteger(days) || days < 1) nextErrors.deliveryDays = 'Enter a positive whole number.'

    if (form.milestones.length > 0) {
      const invalid = form.milestones.some((milestone) => (
        !milestone.title.trim() ||
        !milestone.description.trim() ||
        milestone.amount === '' ||
        Number(milestone.amount) <= 0 ||
        !Number.isFinite(Number(milestone.amount)) ||
        (milestone.dueDate && new Date(`${milestone.dueDate}T23:59:59`).getTime() <= Date.now())
      ))
      const total = form.milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0)
      if (invalid) nextErrors.milestones = 'Each milestone needs a title, description, positive amount, and future due date when provided.'
      else if (Math.round(total * 100) !== Math.round(amount * 100)) nextErrors.milestones = 'Milestones must total the proposal amount.'
    }

    if (form.attachments.length + form.files.length > 5) nextErrors.attachments = 'Keep no more than five attachments.'
    if (form.files.some((file) => file.size > 10 * 1024 * 1024)) nextErrors.attachments = 'Each attachment must be 10 MB or smaller.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!validate()) return

    setBusy('save')
    setRequestError('')
    setSuccess('')
    try {
      const uploaded = await Promise.all(form.files.map(async (file) => {
        const attachment = await uploadProposalAttachment(file)
        return { url: attachment.url, name: attachment.name || file.name }
      }))
      const payload = {
        coverLetter: form.coverLetter.trim(),
        amount: Number(form.amount),
        deliveryDays: Number(form.deliveryDays),
        milestones: form.milestones.map((milestone) => ({
          title: milestone.title.trim(),
          description: milestone.description.trim(),
          amount: Number(milestone.amount),
          ...(milestone.dueDate ? { dueDate: new Date(`${milestone.dueDate}T23:59:59`).toISOString() } : {}),
        })),
        attachments: [...form.attachments, ...uploaded].map((attachment) => ({
          url: attachment.url,
          name: attachment.name,
        })),
      }
      const updated = await updateProposal(proposal._id, payload)
      onUpdated(updated)
      setForm(proposalEditForm(updated))
      setEditing(false)
      setSuccess('Proposal updated.')
    } catch (error) {
      setRequestError(getRequestError(error, 'We could not update this proposal.'))
    } finally {
      setBusy('')
    }
  }

  async function handleWithdraw() {
    if (!window.confirm('Withdraw this proposal? The client will no longer be able to accept it.')) return

    setBusy('withdraw')
    setRequestError('')
    setSuccess('')
    try {
      const updated = await withdrawProposal(proposal._id)
      onUpdated(updated)
    } catch (error) {
      setRequestError(getRequestError(error, 'We could not withdraw this proposal.'))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="mt-5 border-t pt-5">
      {requestError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Proposal action failed</AlertTitle>
          <AlertDescription>{requestError}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="mb-4 border-primary/20 bg-primary/5">
          <AlertTitle>Proposal saved</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {!editing ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)} disabled={Boolean(busy)}>
            <HugeiconsIcon icon={Edit02Icon} /> Edit proposal
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleWithdraw} disabled={Boolean(busy)}>
            {busy === 'withdraw' ? <Spinner /> : <HugeiconsIcon icon={Delete02Icon} />}
            Withdraw
          </Button>
        </div>
      ) : (
        <form className="grid gap-5 rounded-xl border bg-muted/20 p-4" onSubmit={handleSave}>
          <div>
            <h3 className="font-semibold">Edit pending proposal</h3>
            <p className="mt-1 text-xs text-muted-foreground">Changes are available only until the client shortlists or decides on the proposal.</p>
          </div>
          <Field data-invalid={Boolean(errors.coverLetter) || undefined}>
            <FieldLabel htmlFor={`edit-cover-${proposal._id}`}>Cover letter</FieldLabel>
            <Textarea id={`edit-cover-${proposal._id}`} name="coverLetter" className="min-h-32" value={form.coverLetter} onChange={updateField} maxLength={5000} />
            {errors.coverLetter ? <FieldError>{errors.coverLetter}</FieldError> : null}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.amount) || undefined}>
              <FieldLabel htmlFor={`edit-amount-${proposal._id}`}>Amount (BHD)</FieldLabel>
              <Input id={`edit-amount-${proposal._id}`} name="amount" type="number" min="0.001" step="0.001" value={form.amount} onChange={updateField} />
              {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}
            </Field>
            <Field data-invalid={Boolean(errors.deliveryDays) || undefined}>
              <FieldLabel htmlFor={`edit-days-${proposal._id}`}>Delivery days</FieldLabel>
              <Input id={`edit-days-${proposal._id}`} name="deliveryDays" type="number" min="1" step="1" value={form.deliveryDays} onChange={updateField} />
              {errors.deliveryDays ? <FieldError>{errors.deliveryDays}</FieldError> : null}
            </Field>
          </div>

          <Field data-invalid={Boolean(errors.milestones) || undefined}>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel>Milestones</FieldLabel>
              <Button type="button" size="sm" variant="outline" onClick={addMilestone} disabled={form.milestones.length >= 20}>
                <HugeiconsIcon icon={PlusSignIcon} /> Add
              </Button>
            </div>
            <div className="grid gap-3">
              {form.milestones.map((milestone, index) => (
                <div key={index} className="grid gap-3 rounded-lg border bg-background p-3">
                  <div className="flex justify-end">
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeMilestone(index)} aria-label={`Remove milestone ${index + 1}`}>
                      <HugeiconsIcon icon={Delete02Icon} />
                    </Button>
                  </div>
                  <Input aria-label={`Milestone ${index + 1} title`} placeholder="Title" value={milestone.title} onChange={(event) => updateMilestone(index, 'title', event.target.value)} maxLength={200} />
                  <Textarea aria-label={`Milestone ${index + 1} description`} placeholder="Description" value={milestone.description} onChange={(event) => updateMilestone(index, 'description', event.target.value)} maxLength={2000} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input aria-label={`Milestone ${index + 1} amount`} type="number" min="0.001" step="0.001" placeholder="Amount" value={milestone.amount} onChange={(event) => updateMilestone(index, 'amount', event.target.value)} />
                    <Input aria-label={`Milestone ${index + 1} due date`} type="date" value={milestone.dueDate} onChange={(event) => updateMilestone(index, 'dueDate', event.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            {errors.milestones ? <FieldError>{errors.milestones}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.attachments) || undefined}>
            <FieldLabel htmlFor={`edit-files-${proposal._id}`}>Attachments</FieldLabel>
            {form.attachments.length > 0 ? (
              <div className="grid gap-2">
                {form.attachments.map((attachment, index) => (
                  <div key={`${attachment.url}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
                    <span className="truncate">{attachment.name || `Attachment ${index + 1}`}</span>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeAttachment(index)} aria-label={`Remove ${attachment.name || 'attachment'}`}>
                      <HugeiconsIcon icon={Delete02Icon} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            <Input id={`edit-files-${proposal._id}`} type="file" multiple onChange={(event) => setForm((current) => ({ ...current, files: Array.from(event.target.files || []).slice(0, 5) }))} />
            <FieldDescription>Keep up to five files, 10 MB each.</FieldDescription>
            {errors.attachments ? <FieldError>{errors.attachments}</FieldError> : null}
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" disabled={Boolean(busy)} onClick={() => {
              setEditing(false)
              setForm(proposalEditForm(proposal))
              setErrors({})
              setRequestError('')
            }}>Cancel</Button>
            <Button type="submit" disabled={Boolean(busy)}>
              {busy === 'save' ? <><Spinner /> Saving…</> : 'Save proposal'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function LoadingProposals() {
  return (
    <div className="grid gap-4" aria-label="Loading your proposals">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MyProposalsPage() {
  const [proposals, setProposals] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestSequence = useRef(0)

  const loadProposals = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError('')

    try {
      const result = normalizeResult(await getMyProposals({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      }))
      if (requestId !== requestSequence.current) return
      setProposals(result.proposals)
      setPagination(result.pagination)
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      setError(getRequestError(requestError, 'We could not load your proposals. Please try again.'))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    // Loading remote page data is the external synchronization handled by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProposals()
    return () => {
      requestSequence.current += 1
    }
  }, [loadProposals])

  const resultSummary = useMemo(() => {
    const total = pagination.total ?? proposals.length
    if (total === 0) return 'No proposals'
    return `${total} ${total === 1 ? 'proposal' : 'proposals'}`
  }, [pagination.total, proposals.length])

  function handleStatusChange(event) {
    setStatus(event.target.value)
    setPage(1)
  }

  function handleProposalUpdated(proposalId, update) {
    setProposals((current) => {
      const next = current.map((proposal) => proposal._id === proposalId
        ? {
            ...proposal,
            ...update,
            job: typeof update?.job === 'object' ? update.job : proposal.job,
          }
        : proposal)

      return status && update?.status && update.status !== status
        ? next.filter((proposal) => proposal._id !== proposalId)
        : next
    })

    if (status && update?.status && update.status !== status) {
      setPagination((current) => ({ ...current, total: Math.max(0, (current.total || 1) - 1) }))
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-primary">Freelancer workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">My proposals</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Follow every proposal from submission to the client&apos;s final decision.
          </p>
        </header>

        <section className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <HugeiconsIcon icon={SentIcon} className="size-4" />
            <span>{loading ? 'Loading proposals…' : resultSummary}</span>
          </div>
          <NativeSelect
            className="h-9 w-full capitalize sm:w-44"
            aria-label="Filter proposals by status"
            value={status}
            onChange={handleStatusChange}
          >
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            {PROPOSAL_STATUSES.map((proposalStatus) => (
              <NativeSelectOption key={proposalStatus} value={proposalStatus}>
                {proposalStatus}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </section>

        {error ? (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Could not load proposals</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadProposals}>Try again</Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? <LoadingProposals /> : null}

        {!loading && !error && proposals.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent className="mx-auto flex max-w-md flex-col items-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={File02Icon} className="size-6" />
              </span>
              <h2 className="text-lg font-semibold">
                {status ? `No ${status} proposals` : 'No proposals yet'}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {status
                  ? 'Try another status or view all of your proposals.'
                  : 'Browse available jobs and send a tailored proposal when you find the right fit.'}
              </p>
              {status ? (
                <Button className="mt-5" variant="outline" onClick={() => setStatus('')}>View all proposals</Button>
              ) : (
                <Button className="mt-5" nativeButton={false} render={<Link to="/jobs" />}>
                  <HugeiconsIcon icon={Briefcase02Icon} data-icon="inline-start" />
                  Browse jobs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && proposals.length > 0 ? (
          <div className="grid gap-4">
            {proposals.map((proposal) => {
              const job = proposal.job
              const jobId = typeof job === 'object' ? job?._id : job
              const jobStatus = typeof job === 'object' ? job?.status : ''
              const isJobOpen = jobStatus === 'open'

              return (
                <Card key={proposal._id} className="transition-shadow hover:shadow-sm">
                  <CardContent>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="capitalize" variant={statusVariant(proposal.status)}>
                            {proposal.status}
                          </Badge>
                          {job?.status ? (
                            <span className="text-xs capitalize text-muted-foreground">
                              Job {job.status.replaceAll('_', ' ')}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">
                          {job?.title || 'Job proposal'}
                        </h2>
                        <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {proposal.coverLetter}
                        </p>

                        {proposal.status === 'declined' && proposal.declineReason ? (
                          <div className="mt-4 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            <span className="font-medium">Client note:</span> {proposal.declineReason}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Money03Icon} className="size-4" />
                            {BHD_FORMATTER.format(proposal.amount || 0)} proposed
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                            {proposal.deliveryDays || 0} {(proposal.deliveryDays || 0) === 1 ? 'day' : 'days'} delivery
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                            Sent {formatDate(proposal.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 border-t pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                        {jobId && isJobOpen ? (
                          <Button
                            className="w-full sm:w-auto"
                            variant="outline"
                            nativeButton={false}
                            render={<Link to={`/jobs/${jobId}`} />}
                          >
                            View job
                            <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                          </Button>
                        ) : (
                          <span className="text-sm capitalize text-muted-foreground">
                            {jobStatus ? `Job ${jobStatus.replaceAll('_', ' ')}` : 'Job unavailable'}
                          </span>
                        )}
                      </div>
                    </div>
                    {proposal.status === 'pending' ? (
                      <PendingProposalActions
                        proposal={proposal}
                        onUpdated={(updated) => handleProposalUpdated(proposal._id, updated)}
                      />
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : null}

        {!loading && !error && pagination.totalPages > 1 ? (
          <nav className="mt-7 flex items-center justify-between" aria-label="Proposals pagination">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page || page} of {pagination.totalPages}
            </span>
            <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </nav>
        ) : null}
      </div>
    </main>
  )
}

export default MyProposalsPage
