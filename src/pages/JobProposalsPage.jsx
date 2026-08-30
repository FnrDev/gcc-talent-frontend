import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  File02Icon,
  Location01Icon,
  Money03Icon,
  StarIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  acceptProposal,
  getJobProposals,
  getMyJob,
  updateProposalStatus,
} from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
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

function normalizeJob(result) {
  return result?.data?.job || result?.job || result?.data || result
}

function normalizeProposals(result) {
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

function normalizeUpdatedProposal(result) {
  return result?.data?.proposal || result?.proposal || result?.data || result
}

function isPopulatedRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function mergeUpdatedProposal(current, update) {
  const merged = { ...current, ...update }

  if (isPopulatedRecord(current.freelancer) && !isPopulatedRecord(update?.freelancer)) {
    merged.freelancer = current.freelancer
  }

  if (isPopulatedRecord(current.freelancerProfile) && !isPopulatedRecord(update?.freelancerProfile)) {
    merged.freelancerProfile = current.freelancerProfile
  }

  return merged
}

function formatDate(value) {
  if (!value) return 'Not set'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'

  return new Intl.DateTimeFormat('en-BH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatBudget(job) {
  const minimum = Number.isFinite(job?.budgetMin) ? job.budgetMin : null
  const maximum = Number.isFinite(job?.budgetMax) ? job.budgetMax : null

  if (minimum !== null && maximum !== null) {
    return `${BHD_FORMATTER.format(minimum)} – ${BHD_FORMATTER.format(maximum)}`
  }

  if (minimum !== null) return `From ${BHD_FORMATTER.format(minimum)}`
  if (maximum !== null) return `Up to ${BHD_FORMATTER.format(maximum)}`

  return 'Budget not specified'
}

function statusVariant(status) {
  if (status === 'accepted') return 'default'
  if (status === 'declined' || status === 'withdrawn') return 'destructive'
  if (status === 'shortlisted') return 'secondary'
  return 'outline'
}

function initials(name) {
  return (name || 'Freelancer')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-label="Loading job proposals">
      <Skeleton className="h-40 w-full rounded-xl" />
      {[0, 1].map((item) => (
        <Card key={item}>
          <CardContent className="space-y-5">
            <div className="flex gap-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function JobProposalsPage() {
  const { id: jobId } = useParams()
  const [job, setJob] = useState(null)
  const [proposals, setProposals] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionState, setActionState] = useState(null)
  const mutationLock = useRef(false)
  const [declineTarget, setDeclineTarget] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [acceptTarget, setAcceptTarget] = useState('')

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [jobResult, proposalsResult] = await Promise.all([
        getMyJob(jobId),
        getJobProposals(jobId, {
          page,
          limit: 10,
          ...(status ? { status } : {}),
        }),
      ])
      const normalizedProposals = normalizeProposals(proposalsResult)

      setJob(normalizeJob(jobResult))
      setProposals(normalizedProposals.proposals)
      setPagination(normalizedProposals.pagination)
      return normalizedProposals
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not load this job or its proposals.'))
      return null
    } finally {
      setLoading(false)
    }
  }, [jobId, page, status])

  useEffect(() => {
    // Loading remote page data is the external synchronization handled by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage()
  }, [loadPage])

  function updateLocalProposal(proposalId, update) {
    setProposals((current) => current.map((proposal) => (
      proposal._id === proposalId ? mergeUpdatedProposal(proposal, update) : proposal
    )))
  }

  function resetMessages() {
    setActionError('')
    setActionSuccess('')
  }

  function beginAction(proposalId, type) {
    if (mutationLock.current) return false

    mutationLock.current = true
    resetMessages()
    setActionState({ proposalId, type })
    return true
  }

  function finishAction() {
    mutationLock.current = false
    setActionState(null)
  }

  async function refreshAfterMutation(successMessage) {
    const refreshed = await loadPage()
    const totalPages = Number(refreshed?.pagination?.totalPages) || 0
    const lastPage = Math.max(totalPages, 1)

    if (page > lastPage) {
      setPage(lastPage)
    }

    setActionSuccess(successMessage)
  }

  async function handleShortlist(proposalId) {
    if (!beginAction(proposalId, 'shortlist')) return

    try {
      const updated = normalizeUpdatedProposal(await updateProposalStatus(proposalId, {
        status: 'shortlisted',
      }))
      updateLocalProposal(proposalId, { ...updated, status: 'shortlisted' })
      setDeclineTarget('')
      setAcceptTarget('')
      await refreshAfterMutation('Proposal added to your shortlist.')
    } catch (requestError) {
      setActionError(getRequestError(requestError, 'We could not shortlist this proposal.'))
    } finally {
      finishAction()
    }
  }

  async function handleDecline(proposalId) {
    if (!beginAction(proposalId, 'decline')) return

    try {
      const payload = {
        status: 'declined',
        ...(declineReason.trim() ? { declineReason: declineReason.trim() } : {}),
      }
      const updated = normalizeUpdatedProposal(await updateProposalStatus(proposalId, payload))
      updateLocalProposal(proposalId, {
        ...updated,
        status: 'declined',
        ...(declineReason.trim() ? { declineReason: declineReason.trim() } : {}),
      })
      setDeclineTarget('')
      setDeclineReason('')
      setAcceptTarget('')
      await refreshAfterMutation('Proposal declined.')
    } catch (requestError) {
      setActionError(getRequestError(requestError, 'We could not decline this proposal.'))
    } finally {
      finishAction()
    }
  }

  async function handleAccept(proposalId) {
    if (!beginAction(proposalId, 'accept')) return

    try {
      const result = await acceptProposal(proposalId)
      const accepted = normalizeUpdatedProposal(result)

      setProposals((current) => current.map((proposal) => {
        if (proposal._id === proposalId) {
          return mergeUpdatedProposal(proposal, { ...accepted, status: 'accepted' })
        }

        if (['pending', 'shortlisted'].includes(proposal.status)) {
          return {
            ...proposal,
            status: 'declined',
            declineReason: 'Another proposal was accepted.',
          }
        }

        return proposal
      }))
      setJob((current) => ({ ...current, status: 'in_progress' }))
      setAcceptTarget('')
      setDeclineTarget('')
      await refreshAfterMutation('Proposal accepted. The contract is now active and the other open proposals were declined.')
    } catch (requestError) {
      setActionError(getRequestError(requestError, 'We could not accept this proposal.'))
    } finally {
      finishAction()
    }
  }

  function handleStatusChange(event) {
    setStatus(event.target.value)
    setPage(1)
    setDeclineTarget('')
    setAcceptTarget('')
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Button className="mb-5 -ml-2" variant="ghost" nativeButton={false} render={<Link to="/jobs/mine" />}>
          <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
          Back to my jobs
        </Button>

        {loading ? <LoadingState /> : null}

        {!loading && error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not open proposals</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadPage}>Try again</Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!loading && !error && job ? (
          <>
            <Card className="mb-7 bg-primary text-primary-foreground ring-0">
              <CardContent>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-white/20 bg-white/10 text-primary-foreground capitalize">
                        {job.status?.replaceAll('_', ' ')}
                      </Badge>
                      {job.category?.name ? <span className="text-sm text-primary-foreground/75">{job.category.name}</span> : null}
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{job.title}</h1>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-foreground/75">
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={Money03Icon} className="size-4" />
                        {formatBudget(job)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                        {job.duration || job.experienceLevel || 'Flexible timing'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                        Deadline {formatDate(job.deadline)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-black/10 px-4 py-3">
                    <HugeiconsIcon icon={UserGroupIcon} className="size-5" />
                    <span className="font-semibold">{job.proposalsCount || pagination.total || 0}</span>
                    <span className="text-sm text-primary-foreground/75">proposals</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Review proposals</h2>
                <p className="mt-1 text-sm text-muted-foreground">Compare candidates and choose who you want to work with.</p>
              </div>
              <NativeSelect
                className="h-9 w-full capitalize sm:w-44"
                aria-label="Filter proposals by status"
                value={status}
                onChange={handleStatusChange}
                disabled={Boolean(actionState)}
              >
                <NativeSelectOption value="">All statuses</NativeSelectOption>
                {PROPOSAL_STATUSES.map((proposalStatus) => (
                  <NativeSelectOption key={proposalStatus} value={proposalStatus}>
                    {proposalStatus}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="mb-5 space-y-3" aria-live="polite">
              {actionSuccess ? (
                <Alert className="border-primary/20 bg-primary/5">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                  <AlertTitle>Proposal updated</AlertTitle>
                  <AlertDescription>{actionSuccess}</AlertDescription>
                </Alert>
              ) : null}
              {actionError ? (
                <Alert variant="destructive">
                  <AlertTitle>Action failed</AlertTitle>
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            {proposals.length === 0 ? (
              <Card className="border-dashed py-12 text-center">
                <CardContent className="mx-auto flex max-w-md flex-col items-center">
                  <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HugeiconsIcon icon={File02Icon} className="size-6" />
                  </span>
                  <h3 className="text-lg font-semibold">{status ? `No ${status} proposals` : 'No proposals yet'}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {status ? 'Try another status or view all proposals.' : 'New proposals will appear here as freelancers apply.'}
                  </p>
                  {status ? <Button className="mt-5" variant="outline" onClick={() => setStatus('')}>View all proposals</Button> : null}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5">
                {proposals.map((proposal) => {
                  const freelancer = proposal.freelancer || {}
                  const profile = proposal.freelancerProfile || {}
                  const isActionable = job.status === 'open' && ['pending', 'shortlisted'].includes(proposal.status)
                  const isBusy = actionState?.proposalId === proposal._id

                  return (
                    <Card key={proposal._id}>
                      <CardContent>
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <Avatar size="lg">
                                {freelancer.avatarUrl ? <AvatarImage src={freelancer.avatarUrl} alt={freelancer.name || 'Freelancer'} /> : null}
                                <AvatarFallback>{initials(freelancer.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-base font-semibold sm:text-lg">{freelancer.name || 'Freelancer'}</h3>
                                  <Badge className="capitalize" variant={statusVariant(proposal.status)}>{proposal.status}</Badge>
                                </div>
                                <p className="mt-0.5 text-sm text-muted-foreground">{profile.headline || 'Independent professional'}</p>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {freelancer.ratingCount > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      <HugeiconsIcon icon={StarIcon} className="size-3.5 text-amber-500" />
                                      {Number(freelancer.ratingAvg || 0).toFixed(1)} ({freelancer.ratingCount})
                                    </span>
                                  ) : null}
                                  {freelancer.city || freelancer.country ? (
                                    <span className="inline-flex items-center gap-1">
                                      <HugeiconsIcon icon={Location01Icon} className="size-3.5" />
                                      {[freelancer.city, freelancer.country].filter(Boolean).join(', ')}
                                    </span>
                                  ) : null}
                                  {profile.hourlyRate !== undefined ? (
                                    <span>{BHD_FORMATTER.format(Number(profile.hourlyRate) || 0)}/hour</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {profile.skills?.length > 0 ? (
                              <div className="mt-4 flex flex-wrap gap-1.5">
                                {profile.skills.slice(0, 6).map((skill) => (
                                  <Badge key={skill._id || skill.name} variant="secondary">{skill.name}</Badge>
                                ))}
                              </div>
                            ) : null}

                            <div className="mt-5 rounded-xl bg-muted/55 p-4">
                              <p className="whitespace-pre-line text-sm leading-relaxed">{proposal.coverLetter}</p>
                            </div>

                            {proposal.milestones?.length > 0 ? (
                              <div className="mt-4 rounded-xl border p-4">
                                <p className="text-sm font-medium">Proposed milestones</p>
                                <div className="mt-3 grid gap-2">
                                  {proposal.milestones.map((milestone, index) => (
                                    <div key={`${milestone.title}-${index}`} className="flex items-start justify-between gap-4 text-sm">
                                      <div>
                                        <p>{milestone.title}</p>
                                        {milestone.dueDate ? <p className="text-xs text-muted-foreground">Due {formatDate(milestone.dueDate)}</p> : null}
                                      </div>
                                      <span className="shrink-0 font-medium">{BHD_FORMATTER.format(milestone.amount || 0)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {proposal.status === 'declined' && proposal.declineReason ? (
                              <p className="mt-4 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                <span className="font-medium">Decline reason:</span> {proposal.declineReason}
                              </p>
                            ) : null}
                          </div>

                          <aside className="shrink-0 border-t pt-5 lg:w-60 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                            <p className="text-2xl font-semibold tracking-tight">{BHD_FORMATTER.format(proposal.amount || 0)}</p>
                            <p className="mt-1 text-sm text-muted-foreground">in {proposal.deliveryDays || 0} {(proposal.deliveryDays || 0) === 1 ? 'day' : 'days'}</p>
                            <p className="mt-3 text-xs text-muted-foreground">Submitted {formatDate(proposal.createdAt)}</p>

                            {isActionable ? (
                              <div className="mt-5 grid gap-2">
                                {proposal.status === 'pending' ? (
                                  <Button variant="outline" disabled={Boolean(actionState)} onClick={() => handleShortlist(proposal._id)}>
                                    {isBusy && actionState.type === 'shortlist' ? 'Saving…' : 'Shortlist'}
                                  </Button>
                                ) : null}
                                <Button
                                  disabled={Boolean(actionState)}
                                  onClick={() => {
                                    resetMessages()
                                    setAcceptTarget(proposal._id)
                                    setDeclineTarget('')
                                  }}
                                >
                                  Accept proposal
                                </Button>
                                <Button
                                  variant="destructive"
                                  disabled={Boolean(actionState)}
                                  onClick={() => {
                                    resetMessages()
                                    setDeclineTarget(proposal._id)
                                    setDeclineReason('')
                                    setAcceptTarget('')
                                  }}
                                >
                                  Decline
                                </Button>
                              </div>
                            ) : null}
                          </aside>
                        </div>

                        {acceptTarget === proposal._id ? (
                          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <h4 className="font-semibold">Accept this proposal and start the contract?</h4>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              This creates an active {BHD_FORMATTER.format(proposal.amount || 0)} contract, moves the job to in progress, and declines every other pending or shortlisted proposal. This cannot be undone here.
                            </p>
                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                              <Button variant="outline" disabled={Boolean(actionState)} onClick={() => setAcceptTarget('')}>Cancel</Button>
                              <Button disabled={Boolean(actionState)} onClick={() => handleAccept(proposal._id)}>
                                {isBusy && actionState.type === 'accept' ? 'Creating contract…' : 'Accept and create contract'}
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {declineTarget === proposal._id ? (
                          <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                            <label className="font-semibold" htmlFor={`decline-reason-${proposal._id}`}>Decline proposal</label>
                            <p className="mt-1 text-sm text-muted-foreground">You can include a short reason to help the freelancer understand your decision.</p>
                            <Textarea
                              id={`decline-reason-${proposal._id}`}
                              className="mt-3 min-h-24 bg-background"
                              maxLength={500}
                              placeholder="Optional reason"
                              value={declineReason}
                              onChange={(event) => setDeclineReason(event.target.value)}
                            />
                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                              <Button
                                variant="outline"
                                disabled={Boolean(actionState)}
                                onClick={() => {
                                  setDeclineTarget('')
                                  setDeclineReason('')
                                }}
                              >
                                Cancel
                              </Button>
                              <Button variant="destructive" disabled={Boolean(actionState)} onClick={() => handleDecline(proposal._id)}>
                                {isBusy && actionState.type === 'decline' ? 'Declining…' : 'Decline proposal'}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {pagination.totalPages > 1 ? (
              <nav className="mt-7 flex items-center justify-between" aria-label="Job proposals pagination">
                <Button variant="outline" disabled={page <= 1 || Boolean(actionState)} onClick={() => setPage((current) => current - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page || page} of {pagination.totalPages}
                </span>
                <Button variant="outline" disabled={page >= pagination.totalPages || Boolean(actionState)} onClick={() => setPage((current) => current + 1)}>
                  Next
                </Button>
              </nav>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  )
}

export default JobProposalsPage
