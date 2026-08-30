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
  UserIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '@/context/AuthContext'
import { getJob, getMyProposalForJob, submitProposal } from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

function avatarFallback(name) {
  return name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'GT'
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

function ProposalForm({ job, onSubmitted }) {
  const [formData, setFormData] = useState({ coverLetter: '', amount: '', deliveryDays: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setRequestError('')
  }

  function validate() {
    const errors = {}
    const amount = Number(formData.amount)
    const deliveryDays = Number(formData.deliveryDays)

    if (!formData.coverLetter.trim()) {
      errors.coverLetter = 'Write a short cover letter for the client.'
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

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setRequestError('')

    try {
      const proposal = await submitProposal(job._id, {
        coverLetter: formData.coverLetter.trim(),
        amount: Number(formData.amount),
        deliveryDays: Number(formData.deliveryDays),
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
  return (
    <Card className="border-primary/20 bg-primary/[0.03] shadow-sm ring-primary/15">
      <CardContent className="flex flex-col items-center px-6 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-6" />
        </div>
        <Badge className="mt-4" variant="secondary">Proposal sent</Badge>
        <h2 className="mt-3 text-xl font-semibold">The client has your proposal</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          You proposed {BUDGET_FORMATTER.format(Number(proposal.amount))} with delivery in{' '}
          {proposal.deliveryDays} {proposal.deliveryDays === 1 ? 'day' : 'days'}.
        </p>
        <Button className="mt-5" variant="outline" nativeButton={false} render={<Link to="/jobs" />}>
          Browse more jobs
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittedProposal, setSubmittedProposal] = useState(null)
  const [proposalLookup, setProposalLookup] = useState({
    jobId: null,
    loading: true,
    proposal: null,
  })
  const requestSequence = useRef(0)

  const loadJob = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError('')

    try {
      const result = await getJob(jobId)
      if (requestId !== requestSequence.current) return
      setJob(result)
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      setJob(null)
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
          setProposalLookup({ jobId, loading: false, proposal })
        }
      } catch {
        if (!cancelled) {
          setProposalLookup({ jobId, loading: false, proposal: null })
        }
      }
    }

    loadExistingProposal()

    return () => {
      cancelled = true
    }
  }, [authLoading, jobId, user?.role])

  function handleProposalSubmitted(proposal) {
    setSubmittedProposal(proposal)
    setProposalLookup({ jobId, loading: false, proposal })
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
  const existingProposal = submittedProposal || proposalLookup.proposal
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

        {existingProposal ? (
          <Alert className="mb-6 border-primary/20 bg-primary/[0.03]">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="text-primary" />
            <AlertTitle>Proposal submitted successfully</AlertTitle>
            <AlertDescription>The client can now review your offer.</AlertDescription>
          </Alert>
        ) : null}

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
                    <Avatar>
                      {job.client?.avatarUrl ? <AvatarImage src={job.client.avatarUrl} alt="" /> : null}
                      <AvatarFallback>{avatarFallback(job.client?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{job.client?.name || 'GCC Talents client'}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
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

                <section className="mt-8 grid gap-4 border-t pt-7 sm:grid-cols-2">
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
      </div>
    </main>
  )
}

export default JobDetailsPage
