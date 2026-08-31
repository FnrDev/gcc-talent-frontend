import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Briefcase02Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  InformationCircleIcon,
  Location01Icon,
  Money03Icon,
  PlusSignIcon,
  Delete02Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '@/context/AuthContext'
import {
  getJob,
  getMyProposalForJob,
  getSimilarJobs,
  submitProposal,
  uploadProposalAttachment,
} from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UserLink from '@/components/UserLink'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

const BUDGET_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

const DATE_FORMATTER = new Intl.DateTimeFormat('en-BH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const minimumMilestoneDate = (() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().slice(0, 10)
})()

function hasAmount(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

function formatBudget(job) {
  const hasMinimum = hasAmount(job.budgetMin)
  const hasMaximum = hasAmount(job.budgetMax)
  const suffix = job.budgetType === 'hourly' ? ' / hour' : ''

  if (hasMinimum && hasMaximum) {
    return `${BUDGET_FORMATTER.format(Number(job.budgetMin))} – ${BUDGET_FORMATTER.format(Number(job.budgetMax))}${suffix}`
  }

  if (hasMinimum) return `From ${BUDGET_FORMATTER.format(Number(job.budgetMin))}${suffix}`
  if (hasMaximum) return `Up to ${BUDGET_FORMATTER.format(Number(job.budgetMax))}${suffix}`
  return 'Budget to be discussed'
}

function formatDate(value, fallback) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? DATE_FORMATTER.format(date) : fallback
}

function deadlineHasPassed(value) {
  if (!value) return false
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) && timestamp <= Date.now()
}

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function DetailsSkeleton() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-6 h-5 w-28" />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <Card>
            <CardContent className="space-y-5 py-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-5 w-48" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </main>
  )
}

function SimilarJobCard({ job }) {
  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{job.category?.name || 'General'}</Badge>
          <span>{formatDate(job.createdAt, 'Recently posted')}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug">
          <Link to={`/jobs/${job._id}`} className="transition-colors hover:text-primary">
            {job.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
          <span className="text-sm font-medium">{formatBudget(job)}</span>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/jobs/${job._id}`} />}>
            View job
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProposalForm({ job, onSubmitted }) {
  const [formData, setFormData] = useState({ coverLetter: '', amount: '', deliveryDays: '' })
  const [milestones, setMilestones] = useState([])
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setRequestError('')
  }

  function addMilestone() {
    if (milestones.length >= 20) return
    setMilestones((current) => [
      ...current,
      { title: '', description: '', amount: '', dueDate: '' },
    ])
  }

  function updateMilestone(index, field, value) {
    setMilestones((current) => current.map((milestone, milestoneIndex) => (
      milestoneIndex === index ? { ...milestone, [field]: value } : milestone
    )))
    setFieldErrors((current) => ({ ...current, milestones: '' }))
  }

  function removeMilestone(index) {
    setMilestones((current) => current.filter((_, milestoneIndex) => milestoneIndex !== index))
    setFieldErrors((current) => ({ ...current, milestones: '' }))
  }

  function handleAttachmentChange(event) {
    const files = Array.from(event.target.files || [])
    setAttachmentFiles(files.slice(0, 5))
    setFieldErrors((current) => ({ ...current, attachments: '' }))
  }

  function validate() {
    const errors = {}
    const amount = Number(formData.amount)
    const deliveryDays = Number(formData.deliveryDays)

    if (!formData.coverLetter.trim()) {
      errors.coverLetter = 'Write a short cover letter for the client.'
    } else if (formData.coverLetter.trim().length > 5000) {
      errors.coverLetter = 'Keep the cover letter to 5000 characters or fewer.'
    }

    if (formData.amount === '' || !Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Enter an amount greater than zero.'
    }

    if (
      formData.deliveryDays === '' ||
      !Number.isInteger(deliveryDays) ||
      deliveryDays < 1
    ) {
      errors.deliveryDays = 'Enter a positive whole number of days.'
    }

    if (milestones.length > 0) {
      const invalidMilestone = milestones.some((milestone) => (
        !milestone.title.trim() ||
        !milestone.description.trim() ||
        milestone.amount === '' ||
        !Number.isFinite(Number(milestone.amount)) ||
        Number(milestone.amount) <= 0 ||
        (milestone.dueDate && new Date(`${milestone.dueDate}T23:59:59`).getTime() <= Date.now())
      ))
      const milestoneTotal = milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0)

      if (invalidMilestone) {
        errors.milestones = 'Each milestone needs a title, description, positive amount, and future due date when provided.'
      } else if (Math.round(milestoneTotal * 100) !== Math.round(amount * 100)) {
        errors.milestones = 'Milestone amounts must add up to your proposed amount.'
      }
    }

    if (attachmentFiles.some((file) => file.size > 10 * 1024 * 1024)) {
      errors.attachments = 'Each attachment must be 10 MB or smaller.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setRequestError('')

    try {
      const attachments = await Promise.all(attachmentFiles.map(async (file) => {
        const uploaded = await uploadProposalAttachment(file)
        return { url: uploaded.url, name: uploaded.name || file.name }
      }))

      const proposal = await submitProposal(job._id, {
        coverLetter: formData.coverLetter.trim(),
        amount: Number(formData.amount),
        deliveryDays: Number(formData.deliveryDays),
        milestones: milestones.map((milestone) => ({
          title: milestone.title.trim(),
          description: milestone.description.trim(),
          amount: Number(milestone.amount),
          ...(milestone.dueDate
            ? { dueDate: new Date(`${milestone.dueDate}T23:59:59`).toISOString() }
            : {}),
        })),
        attachments,
      })
      onSubmitted(proposal)
    } catch (error) {
      setRequestError(
        getRequestError(error, 'We could not submit your proposal. Please try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Send a proposal</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">
          Introduce your approach and set a clear price and delivery window.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
          {requestError ? (
            <Alert variant="destructive">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
              <AlertTitle>Proposal not submitted</AlertTitle>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={Boolean(fieldErrors.coverLetter) || undefined}>
            <FieldLabel htmlFor="coverLetter">Cover letter</FieldLabel>
            <Textarea
              id="coverLetter"
              name="coverLetter"
              className="min-h-40 resize-y"
              placeholder="Explain how you would approach the work and why you are a strong fit."
              value={formData.coverLetter}
              onChange={handleChange}
              maxLength={5000}
              aria-invalid={Boolean(fieldErrors.coverLetter)}
              required
            />
            <div className="flex items-start justify-between gap-3">
              {fieldErrors.coverLetter ? (
                <FieldError>{fieldErrors.coverLetter}</FieldError>
              ) : (
                <FieldDescription>Keep it specific to this project.</FieldDescription>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                {formData.coverLetter.length} characters
              </span>
            </div>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.amount) || undefined}>
            <FieldLabel htmlFor="amount">Your proposed amount</FieldLabel>
            <InputGroup className="h-10">
              <InputGroupInput
                id="amount"
                name="amount"
                type="number"
                min="0.001"
                step="0.001"
                inputMode="decimal"
                placeholder="0.000"
                value={formData.amount}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.amount)}
                required
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>BHD</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            {fieldErrors.amount ? (
              <FieldError>{fieldErrors.amount}</FieldError>
            ) : (
              <FieldDescription>Client budget: {formatBudget(job)}</FieldDescription>
            )}
          </Field>

          <Field data-invalid={Boolean(fieldErrors.deliveryDays) || undefined}>
            <FieldLabel htmlFor="deliveryDays">Delivery time</FieldLabel>
            <Input
              id="deliveryDays"
              name="deliveryDays"
              type="number"
              className="h-10"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="e.g. 14"
              value={formData.deliveryDays}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.deliveryDays)}
              required
            />
            {fieldErrors.deliveryDays ? (
              <FieldError>{fieldErrors.deliveryDays}</FieldError>
            ) : (
              <FieldDescription>Enter the total number of calendar days.</FieldDescription>
            )}
          </Field>

          <Field data-invalid={Boolean(fieldErrors.milestones) || undefined}>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel>Milestones (optional)</FieldLabel>
              <Button type="button" size="sm" variant="outline" onClick={addMilestone} disabled={milestones.length >= 20}>
                <HugeiconsIcon icon={PlusSignIcon} />
                Add
              </Button>
            </div>
            <FieldDescription>
              Break the project into funded stages. Their amounts must total your proposal.
            </FieldDescription>
            {milestones.length > 0 ? (
              <div className="grid gap-3">
                {milestones.map((milestone, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Milestone {index + 1}</span>
                      <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeMilestone(index)} aria-label={`Remove milestone ${index + 1}`}>
                        <HugeiconsIcon icon={Delete02Icon} />
                      </Button>
                    </div>
                    <Input
                      aria-label={`Milestone ${index + 1} title`}
                      placeholder="e.g. First design review"
                      maxLength={200}
                      value={milestone.title}
                      onChange={(event) => updateMilestone(index, 'title', event.target.value)}
                    />
                    <Textarea
                      aria-label={`Milestone ${index + 1} description`}
                      className="min-h-20"
                      placeholder="Describe what will be delivered at this stage."
                      maxLength={2000}
                      value={milestone.description}
                      onChange={(event) => updateMilestone(index, 'description', event.target.value)}
                    />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <InputGroup>
                        <InputGroupInput
                          aria-label={`Milestone ${index + 1} amount`}
                          type="number"
                          min="0.001"
                          step="0.001"
                          placeholder="Amount"
                          value={milestone.amount}
                          onChange={(event) => updateMilestone(index, 'amount', event.target.value)}
                        />
                        <InputGroupAddon align="inline-end"><InputGroupText>BHD</InputGroupText></InputGroupAddon>
                      </InputGroup>
                      <Input
                        aria-label={`Milestone ${index + 1} due date`}
                        type="date"
                        min={minimumMilestoneDate}
                        value={milestone.dueDate}
                        onChange={(event) => updateMilestone(index, 'dueDate', event.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {fieldErrors.milestones ? <FieldError>{fieldErrors.milestones}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(fieldErrors.attachments) || undefined}>
            <FieldLabel htmlFor="proposalAttachments">Attachments (optional)</FieldLabel>
            <Input
              id="proposalAttachments"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
              onChange={handleAttachmentChange}
            />
            <FieldDescription>Up to five files, 10 MB each.</FieldDescription>
            {attachmentFiles.length > 0 ? (
              <ul className="grid gap-1 text-xs text-muted-foreground">
                {attachmentFiles.map((file) => <li key={`${file.name}-${file.size}`}>{file.name}</li>)}
              </ul>
            ) : null}
            {fieldErrors.attachments ? <FieldError>{fieldErrors.attachments}</FieldError> : null}
          </Field>

          <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner />
                Submitting…
              </>
            ) : (
              'Submit proposal'
            )}
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            You can submit one proposal for this job. Review it carefully before sending.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function ProposalSuccess({ proposal }) {
  const statusContent = {
    accepted: {
      badge: 'Proposal accepted',
      title: 'The client accepted your proposal',
      description: 'Your active contract contains the agreed amount, delivery window, and milestones.',
    },
    declined: {
      badge: 'Proposal declined',
      title: 'The client chose another proposal',
      description: proposal.declineReason || 'This proposal is no longer active.',
    },
    shortlisted: {
      badge: 'Shortlisted',
      title: 'The client shortlisted your proposal',
      description: 'Your offer is still under consideration.',
    },
    withdrawn: {
      badge: 'Proposal withdrawn',
      title: 'You withdrew this proposal',
      description: 'A withdrawn proposal cannot be submitted again for the same job.',
    },
  }[proposal.status]

  return (
    <Card className="border-primary/20 bg-primary/[0.03] shadow-sm ring-primary/15">
      <CardContent className="flex flex-col items-center px-6 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-6" />
        </div>
        <Badge className="mt-4" variant="secondary">{statusContent?.badge || 'Proposal sent'}</Badge>
        <h2 className="mt-3 text-xl font-semibold">{statusContent?.title || 'The client has your proposal'}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {statusContent?.description || (
            <>You proposed {BUDGET_FORMATTER.format(Number(proposal.amount))} with delivery in{' '}
              {proposal.deliveryDays} {proposal.deliveryDays === 1 ? 'day' : 'days'}.</>
          )}
        </p>
        <Button className="mt-5" variant="outline" nativeButton={false} render={<Link to="/proposals" />}>
          View my proposals
        </Button>
      </CardContent>
    </Card>
  )
}

function ProposalDeadlineClosed() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Proposals are closed</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">
          The client&apos;s proposal deadline has passed, so this job is no longer accepting offers.
        </p>
      </CardHeader>
      <CardContent>
        <Button variant="outline" nativeButton={false} render={<Link to="/jobs" />} className="w-full">
          Browse open jobs
        </Button>
      </CardContent>
    </Card>
  )
}

function AccountCallout({ user, job, isOwner }) {
  if (!user) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Interested in this job?</CardTitle>
          <p className="text-sm leading-5 text-muted-foreground">
            Sign in with a freelancer account to send the client a proposal.
          </p>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button
            nativeButton={false}
            render={<Link to="/sign-in" state={{ from: `/jobs/${job._id}` }} />}
            className="w-full"
          >
            Sign in to propose
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link to="/sign-up" />} className="w-full">
            Create an account
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isOwner) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">This is your job</CardTitle>
          <p className="text-sm leading-5 text-muted-foreground">
            Open your dashboard to manage the job and review incoming proposals.
          </p>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link to="/dashboard" />} className="w-full">
            Manage this job
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Client account</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">
          Proposals are sent from freelancer accounts. You can create a job to hire for your own project.
        </p>
      </CardHeader>
      <CardContent>
        <Button nativeButton={false} render={<Link to="/jobs/new" />} className="w-full">
          Post a job
        </Button>
      </CardContent>
    </Card>
  )
}

function JobDetailsPage() {
  const routeParams = useParams()
  const jobId = routeParams.jobId || routeParams.id
  const { user, loading: authLoading } = useAuth()
  const [job, setJob] = useState(null)
  const [similarJobs, setSimilarJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [proposalLookup, setProposalLookup] = useState({
    jobId: null,
    loading: true,
    proposal: null,
    error: '',
  })
  const [proposalLookupAttempt, setProposalLookupAttempt] = useState(0)
  const requestSequence = useRef(0)

  const loadJob = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError('')

    try {
      const [result, relatedJobs] = await Promise.all([
        getJob(jobId),
        getSimilarJobs(jobId, { limit: 3 }).catch(() => []),
      ])
      if (requestId !== requestSequence.current) return
      setJob(result)
      setSimilarJobs(relatedJobs)
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      setJob(null)
      setSimilarJobs([])
      setError(getRequestError(requestError, 'We could not load this job. Please try again.'))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    // Fetching the route resource intentionally drives the page loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJob()
    return () => {
      requestSequence.current += 1
    }
  }, [loadJob])

  useEffect(() => {
    let cancelled = false

    if (authLoading || user?.role !== 'freelancer') return undefined

    async function loadExistingProposal() {
      try {
        const proposal = await getMyProposalForJob(jobId)
        if (!cancelled) {
          setProposalLookup({ jobId, loading: false, proposal, error: '' })
        }
      } catch (requestError) {
        if (!cancelled) {
          const isMissing = requestError?.response?.status === 404
          setProposalLookup({
            jobId,
            loading: false,
            proposal: null,
            error: isMissing
              ? ''
              : getRequestError(requestError, 'We could not check your existing proposal. Please try again.'),
          })
        }
      }
    }

    loadExistingProposal()

    return () => {
      cancelled = true
    }
  }, [authLoading, jobId, proposalLookupAttempt, user?.role])

  function handleProposalSubmitted(proposal) {
    setProposalLookup({ jobId, loading: false, proposal, error: '' })
    setJob((current) => current
      ? { ...current, proposalsCount: (current.proposalsCount || 0) + 1 }
      : current)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <DetailsSkeleton />

  if (error || !job) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-12">
        <Card className="mx-auto max-w-xl shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-6" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Job unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {error || 'This job is no longer available.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={loadJob}>Try again</Button>
              <Button nativeButton={false} render={<Link to="/jobs" />}>Browse jobs</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  const clientLocation = [job.client?.city, job.client?.country].filter(Boolean).join(', ')
  const clientId = job.client?._id || job.client
  const isOwner = Boolean(user?._id && clientId && String(user._id) === String(clientId))
  const isFreelancer = user?.role === 'freelancer'
  const existingProposal = proposalLookup.jobId === jobId ? proposalLookup.proposal : null
  const proposalLookupPending = isFreelancer && (
    proposalLookup.jobId !== jobId || proposalLookup.loading
  )
  const proposalDeadlinePassed = deadlineHasPassed(job.deadline)
  const safeAttachments = (job.attachments || []).filter(
    (attachment) => typeof attachment?.url === 'string' && /^https?:\/\//i.test(attachment.url),
  )

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/jobs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          Back to jobs
        </Link>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <article className="min-w-0">
            <Card className="gap-0 py-0 shadow-sm">
              <CardHeader className="gap-5 border-b px-5 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{job.category?.name || 'General'}</Badge>
                  <Badge variant="outline" className="capitalize">{job.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Posted {formatDate(job.createdAt, 'recently')}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                    {job.title}
                  </h1>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="min-w-0">
                      <UserLink
                        user={job.client}
                        showAvatar
                        avatarSize="default"
                        nameClassName="text-sm font-medium text-foreground"
                      />
                      <p className="flex items-center gap-1 pl-10 text-xs text-muted-foreground">
                        {clientLocation ? (
                          <>
                            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3" />
                            {clientLocation}
                          </>
                        ) : (
                          'Marketplace client'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-5 py-6 sm:px-7">
                <section aria-label="Job summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border bg-muted/20 p-3.5">
                    <HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="mb-2 size-5 text-primary" />
                    <p className="text-sm font-medium">{formatBudget(job)}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {job.budgetType === 'hourly' ? 'Hourly rate' : 'Fixed-price budget'}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3.5">
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="mb-2 size-5 text-primary" />
                    <p className="text-sm font-medium">{job.duration || 'Flexible'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Expected duration</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3.5">
                    <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="mb-2 size-5 text-primary" />
                    <p className="text-sm font-medium capitalize">{job.experienceLevel || 'Any level'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Experience</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3.5">
                    <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} className="mb-2 size-5 text-primary" />
                    <p className="text-sm font-medium">
                      {job.proposalsCount || 0} {(job.proposalsCount || 0) === 1 ? 'proposal' : 'proposals'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Submitted so far</p>
                  </div>
                </section>

                <section className="mt-8 border-t pt-7" aria-labelledby="description-heading">
                  <h2 id="description-heading" className="text-xl font-semibold">About the job</h2>
                  <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-7 text-muted-foreground">
                    {job.description}
                  </p>
                </section>

                {job.skills?.length ? (
                  <section className="mt-8 border-t pt-7" aria-labelledby="skills-heading">
                    <h2 id="skills-heading" className="text-xl font-semibold">Skills and expertise</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill._id || skill.name} variant="secondary" className="h-7 px-3">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="mt-8 grid gap-4 border-t pt-7 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="flex gap-3">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="text-sm font-medium">Proposal deadline</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(job.deadline, 'No deadline specified')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="text-sm font-medium">Client reputation</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {job.client?.ratingCount
                          ? `${Number(job.client.ratingAvg || 0).toFixed(1)} from ${job.client.ratingCount} ${job.client.ratingCount === 1 ? 'review' : 'reviews'}`
                          : 'New client — no reviews yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="text-sm font-medium">Client history</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {job.client?.jobsPosted || 0} {(job.client?.jobsPosted || 0) === 1 ? 'job posted' : 'jobs posted'}
                        {' · '}
                        {job.client?.isEmailVerified ? 'Email verified' : 'Email not verified'}
                      </p>
                    </div>
                  </div>
                </section>

                {safeAttachments.length ? (
                  <section className="mt-8 border-t pt-7" aria-labelledby="attachments-heading">
                    <h2 id="attachments-heading" className="text-xl font-semibold">Attachments</h2>
                    <div className="mt-3 grid gap-2">
                      {safeAttachments.map((attachment, index) => (
                        <a
                          key={`${attachment.url}-${index}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          {attachment.name || `Attachment ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </section>
                ) : null}
              </CardContent>
            </Card>
          </article>

          <aside className="lg:sticky lg:top-20">
            {authLoading || proposalLookupPending ? (
              <Skeleton className="h-96 rounded-xl" />
            ) : isFreelancer && proposalLookup.error ? (
              <Card className="shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Could not check proposal status</CardTitle>
                  <p className="text-sm leading-5 text-muted-foreground">{proposalLookup.error}</p>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" onClick={() => setProposalLookupAttempt((attempt) => attempt + 1)}>
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : existingProposal ? (
              <ProposalSuccess proposal={existingProposal} />
            ) : isFreelancer && proposalDeadlinePassed ? (
              <ProposalDeadlineClosed />
            ) : isFreelancer && !isOwner ? (
              <ProposalForm job={job} onSubmitted={handleProposalSubmitted} />
            ) : (
              <AccountCallout user={user} job={job} isOwner={isOwner} />
            )}

            <p className="mt-4 px-2 text-center text-xs leading-5 text-muted-foreground">
              Keep communication and payment on GCC Talents for a clear record of the work.
            </p>
          </aside>
        </div>

        {similarJobs.length ? (
          <section className="mt-10" aria-labelledby="similar-jobs-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="similar-jobs-heading" className="text-2xl font-semibold tracking-tight">Similar jobs</h2>
                <p className="mt-1 text-sm text-muted-foreground">More open work in {job.category?.name || 'this category'}.</p>
              </div>
              <Button variant="ghost" nativeButton={false} render={<Link to={`/jobs?category=${encodeURIComponent(job.category?._id || '')}`} />}>
                See all
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {similarJobs.map((similarJob) => <SimilarJobCard key={similarJob._id} job={similarJob} />)}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default JobDetailsPage
