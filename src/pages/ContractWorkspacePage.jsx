import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'

import UserLink from '@/components/UserLink'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import {
  addContractMilestone,
  approveMilestone,
  cancelContract,
  createContractReview,
  deliverMilestone,
  fundMilestone,
  getContractWorkspace,
  requestMilestoneRevision,
  sendContractMessage,
  startMilestone,
  updateContractMilestone,
} from '@/services/contractService'

const MONEY_FORMATTERS = new Map()

const DATE_FORMATTER = new Intl.DateTimeFormat('en-BH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const STATUS_LABELS = {
  pending: 'Awaiting funding',
  funded: 'Funded',
  in_progress: 'In progress',
  delivered: 'Delivered',
  revision_requested: 'Revision requested',
  approved: 'Approved',
  disputed: 'Disputed',
  refunded: 'Refunded',
  split: 'Split',
  cancelled: 'Cancelled',
}

function requestError(error, fallback) {
  return error?.response?.data?.message || fallback
}

function formatMoney(value, currency = 'BHD') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'

  const code = typeof currency === 'string' && currency.trim() ? currency.toUpperCase() : 'BHD'
  if (!MONEY_FORMATTERS.has(code)) {
    MONEY_FORMATTERS.set(code, new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'BHD' ? 3 : 2,
      maximumFractionDigits: code === 'BHD' ? 3 : 2,
    }))
  }
  return MONEY_FORMATTERS.get(code).format(amount)
}

function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not set' : DATE_FORMATTER.format(date)
}

function randomKey() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function statusVariant(status) {
  if (status === 'approved' || status === 'completed') return 'default'
  if (['cancelled', 'disputed'].includes(status)) return 'destructive'
  return 'secondary'
}

function ContractWorkspacePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [deliveryForms, setDeliveryForms] = useState({})
  const [revisionForms, setRevisionForms] = useState({})
  const [messageBody, setMessageBody] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [review, setReview] = useState({ rating: '5', comment: '' })
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', amount: '', dueDate: '' })
  const [editingMilestone, setEditingMilestone] = useState(null)
  const mutationAttempts = useRef(new Map())

  const loadWorkspace = useCallback(async () => {
    setError('')
    try {
      const data = await getContractWorkspace(id)
      setWorkspace(data)
    } catch (loadError) {
      setError(requestError(loadError, 'We could not load this contract workspace.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // The external API response initializes this route's workspace state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWorkspace()
  }, [loadWorkspace])

  const contract = workspace?.contract
  const currentUserId = String(user?._id || user?.id || '')
  const clientId = String(contract?.client?._id || contract?.client || '')
  const freelancerId = String(contract?.freelancer?._id || contract?.freelancer || '')
  const isClient = currentUserId && currentUserId === clientId
  const isFreelancer = currentUserId && currentUserId === freelancerId
  const counterpart = isClient ? contract?.freelancer : contract?.client
  const isEnded = ['completed', 'cancelled'].includes(contract?.status)

  const activity = useMemo(
    () => [...(contract?.activity || [])].sort((left, right) => new Date(right.at) - new Date(left.at)),
    [contract?.activity],
  )

  async function runAction(key, action, successMessage) {
    setBusyAction(key)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(successMessage)
      await loadWorkspace()
      return true
    } catch (actionError) {
      setError(requestError(actionError, 'That action could not be completed.'))
      return false
    } finally {
      setBusyAction('')
    }
  }

  function updateDeliveryForm(milestoneId, field, value) {
    setDeliveryForms((current) => ({
      ...current,
      [milestoneId]: { ...current[milestoneId], [field]: value },
    }))
  }

  function mutationKey(operation, payload = '') {
    const signature = `${operation}:${payload}`
    if (!mutationAttempts.current.has(signature)) mutationAttempts.current.set(signature, randomKey())
    return mutationAttempts.current.get(signature)
  }

  async function submitDelivery(event, milestoneId) {
    event.preventDefault()
    const form = deliveryForms[milestoneId] || {}
    const attachments = form.attachmentUrl?.trim()
      ? [{ url: form.attachmentUrl.trim(), name: form.attachmentName?.trim() || 'Delivery attachment' }]
      : []

    await runAction(
      `deliver:${milestoneId}`,
      () => deliverMilestone(id, milestoneId, { message: form.message || '', attachments }),
      'Delivery submitted.',
    )
  }

  async function submitMessage(event) {
    event.preventDefault()
    const body = messageBody.trim()
    if (!body) return

    const sent = await runAction('message', () => sendContractMessage(id, { body }), 'Message sent.')
    if (sent) setMessageBody('')
  }

  async function submitReview(event) {
    event.preventDefault()
    await runAction(
      'review',
      () => createContractReview(id, { rating: Number(review.rating), comment: review.comment }),
      'Review submitted.',
    )
  }

  async function submitNewMilestone(event) {
    event.preventDefault()
    const added = await runAction(
      'add-milestone',
      () => addContractMilestone(id, { ...newMilestone, amount: Number(newMilestone.amount) }),
      'Milestone added.',
    )
    if (added) setNewMilestone({ title: '', description: '', amount: '', dueDate: '' })
  }

  function beginMilestoneEdit(milestone) {
    const dueDate = milestone.dueDate ? new Date(milestone.dueDate).toISOString().slice(0, 10) : ''
    setEditingMilestone({
      id: milestone._id,
      title: milestone.title || '',
      description: milestone.description || '',
      amount: String(milestone.amount ?? ''),
      dueDate,
    })
  }

  async function submitMilestoneEdit(event) {
    event.preventDefault()
    const milestoneId = editingMilestone.id
    const updated = await runAction(
      `edit:${milestoneId}`,
      () => updateContractMilestone(id, milestoneId, {
        title: editingMilestone.title,
        description: editingMilestone.description,
        amount: Number(editingMilestone.amount),
        dueDate: editingMilestone.dueDate,
      }),
      'Milestone updated.',
    )
    if (updated) setEditingMilestone(null)
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[65vh] w-full max-w-7xl gap-4 px-4 py-10 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-[34rem] rounded-xl" />
        <Skeleton className="h-[24rem] rounded-xl" />
      </main>
    )
  }

  if (!contract) {
    return (
      <main className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-4 py-10">
        <Alert variant="destructive">
          <AlertTitle>Contract unavailable</AlertTitle>
          <AlertDescription>{error || 'This contract could not be found.'}</AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="link" className="mb-2 px-0" nativeButton={false} render={<Link to="/contracts" />}>
            Back to contracts
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{contract.title}</h1>
            <Badge variant={statusVariant(contract.status)}>{contract.status}</Badge>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Working with <UserLink user={counterpart} className="inline-flex font-medium text-foreground" />
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Started {formatDate(contract.startedAt || contract.createdAt)}</p>
          {contract.endedAt && <p>Ended {formatDate(contract.endedAt)}</p>}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Action needed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert className="mb-5">
          <AlertTitle>Updated</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Funding, work, delivery, feedback, and release stay together here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {isClient && contract.status === 'active' && (
                <form className="grid gap-3 rounded-xl border border-dashed p-4 sm:grid-cols-2" onSubmit={submitNewMilestone}>
                  <div className="sm:col-span-2">
                    <h2 className="font-heading text-base font-medium">Add a milestone</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Define the outcome before funds are held.</p>
                  </div>
                  <div>
                    <Label htmlFor="new-milestone-title">Title</Label>
                    <Input
                      id="new-milestone-title"
                      required
                      value={newMilestone.title}
                      onChange={(event) => setNewMilestone((current) => ({ ...current, title: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-milestone-amount">Amount (BHD)</Label>
                    <Input
                      id="new-milestone-amount"
                      type="number"
                      min="0.001"
                      step="0.001"
                      required
                      value={newMilestone.amount}
                      onChange={(event) => setNewMilestone((current) => ({ ...current, amount: event.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="new-milestone-description">Description</Label>
                    <Textarea
                      id="new-milestone-description"
                      required
                      value={newMilestone.description}
                      onChange={(event) => setNewMilestone((current) => ({ ...current, description: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-milestone-due">Due date</Label>
                    <Input
                      id="new-milestone-due"
                      type="date"
                      required
                      value={newMilestone.dueDate}
                      onChange={(event) => setNewMilestone((current) => ({ ...current, dueDate: event.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" type="submit" disabled={Boolean(busyAction)}>
                      {busyAction === 'add-milestone' ? 'Adding…' : 'Add milestone'}
                    </Button>
                  </div>
                </form>
              )}

              {contract.milestones.map((milestone, index) => {
                const form = deliveryForms[milestone._id] || {}
                const canDeliver = isFreelancer && ['funded', 'in_progress', 'revision_requested'].includes(milestone.status)
                return (
                  <section key={milestone._id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Milestone {index + 1}</p>
                        <h2 className="mt-1 font-heading text-lg font-medium">{milestone.title}</h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{milestone.description || 'No description supplied.'}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusVariant(milestone.status)}>{STATUS_LABELS[milestone.status] || milestone.status}</Badge>
                        <p className="mt-2 font-medium">{formatMoney(milestone.amount, contract.currency)}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(milestone.dueDate)}</p>
                        {isClient && milestone.status === 'pending' && contract.status === 'active' && (
                          <Button className="mt-2" size="xs" variant="ghost" onClick={() => beginMilestoneEdit(milestone)}>
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingMilestone?.id === milestone._id && (
                      <form className="mt-4 grid gap-3 rounded-lg bg-muted/45 p-3 sm:grid-cols-2" onSubmit={submitMilestoneEdit}>
                        <div>
                          <Label htmlFor={`edit-title-${milestone._id}`}>Title</Label>
                          <Input
                            id={`edit-title-${milestone._id}`}
                            required
                            value={editingMilestone.title}
                            onChange={(event) => setEditingMilestone((current) => ({ ...current, title: event.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-amount-${milestone._id}`}>Amount (BHD)</Label>
                          <Input
                            id={`edit-amount-${milestone._id}`}
                            type="number"
                            min="0.001"
                            step="0.001"
                            required
                            value={editingMilestone.amount}
                            onChange={(event) => setEditingMilestone((current) => ({ ...current, amount: event.target.value }))}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor={`edit-description-${milestone._id}`}>Description</Label>
                          <Textarea
                            id={`edit-description-${milestone._id}`}
                            required
                            value={editingMilestone.description}
                            onChange={(event) => setEditingMilestone((current) => ({ ...current, description: event.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-due-${milestone._id}`}>Due date</Label>
                          <Input
                            id={`edit-due-${milestone._id}`}
                            type="date"
                            required
                            value={editingMilestone.dueDate}
                            onChange={(event) => setEditingMilestone((current) => ({ ...current, dueDate: event.target.value }))}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button type="submit" disabled={Boolean(busyAction)}>
                            {busyAction === `edit:${milestone._id}` ? 'Saving…' : 'Save'}
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setEditingMilestone(null)}>Cancel</Button>
                        </div>
                      </form>
                    )}

                    {milestone.deliveries?.length > 0 && (
                      <div className="mt-4 space-y-3 rounded-lg bg-muted/45 p-3">
                        {milestone.deliveries.map((delivery, deliveryIndex) => (
                          <div key={`${milestone._id}:${deliveryIndex}`} className="text-sm">
                            <p className="font-medium">Delivery {deliveryIndex + 1}</p>
                            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{delivery.message}</p>
                            {delivery.attachments?.map((attachment) => (
                              <a key={attachment.url} className="mt-1 block text-primary underline" href={attachment.url} target="_blank" rel="noreferrer">
                                {attachment.name}
                              </a>
                            ))}
                            {delivery.responseNote && <p className="mt-2 rounded-md border px-3 py-2">Feedback: {delivery.responseNote}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {isClient && milestone.status === 'pending' && contract.status === 'active' && (
                      <Button
                        className="mt-4"
                        disabled={Boolean(busyAction)}
                        onClick={() => runAction(
                          `fund:${milestone._id}`,
                          () => fundMilestone(id, milestone._id, mutationKey(`fund:${milestone._id}`)),
                          'Milestone funded.',
                        )}
                      >
                        {busyAction === `fund:${milestone._id}` ? 'Funding…' : `Fund ${formatMoney(milestone.amount, contract.currency)}`}
                      </Button>
                    )}

                    {isFreelancer && milestone.status === 'funded' && contract.status === 'active' && (
                      <Button
                        className="mt-4"
                        disabled={Boolean(busyAction)}
                        onClick={() => runAction(`start:${milestone._id}`, () => startMilestone(id, milestone._id), 'Milestone started.')}
                      >
                        {busyAction === `start:${milestone._id}` ? 'Starting…' : 'Start work'}
                      </Button>
                    )}

                    {canDeliver && contract.status === 'active' && (
                      <form className="mt-4 space-y-3 border-t pt-4" onSubmit={(event) => submitDelivery(event, milestone._id)}>
                        <Label htmlFor={`delivery-${milestone._id}`}>Delivery message</Label>
                        <Textarea
                          id={`delivery-${milestone._id}`}
                          required
                          value={form.message || ''}
                          onChange={(event) => updateDeliveryForm(milestone._id, 'message', event.target.value)}
                          placeholder="Describe the completed work and what the client should review."
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            aria-label="Attachment URL"
                            type="url"
                            value={form.attachmentUrl || ''}
                            onChange={(event) => updateDeliveryForm(milestone._id, 'attachmentUrl', event.target.value)}
                            placeholder="Optional attachment URL"
                          />
                          <Input
                            aria-label="Attachment name"
                            value={form.attachmentName || ''}
                            onChange={(event) => updateDeliveryForm(milestone._id, 'attachmentName', event.target.value)}
                            placeholder="Attachment name"
                          />
                        </div>
                        <Button type="submit" disabled={Boolean(busyAction)}>
                          {busyAction === `deliver:${milestone._id}` ? 'Submitting…' : 'Submit delivery'}
                        </Button>
                      </form>
                    )}

                    {isClient && milestone.status === 'delivered' && contract.status === 'active' && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        <Textarea
                          aria-label="Revision feedback"
                          value={revisionForms[milestone._id] || ''}
                          onChange={(event) => setRevisionForms((current) => ({ ...current, [milestone._id]: event.target.value }))}
                          placeholder="Explain what should be revised."
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            disabled={Boolean(busyAction) || !(revisionForms[milestone._id] || '').trim()}
                            onClick={() => runAction(
                              `revise:${milestone._id}`,
                              () => requestMilestoneRevision(id, milestone._id, revisionForms[milestone._id]),
                              'Revision requested.',
                            )}
                          >
                            {busyAction === `revise:${milestone._id}` ? 'Sending…' : 'Request revision'}
                          </Button>
                          <Button
                            disabled={Boolean(busyAction)}
                            onClick={() => runAction(
                              `approve:${milestone._id}`,
                              () => approveMilestone(id, milestone._id, mutationKey(`approve:${milestone._id}`)),
                              'Milestone approved and funds released.',
                            )}
                          >
                            {busyAction === `approve:${milestone._id}` ? 'Approving…' : 'Approve & release'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </section>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Only contract participants and administrators can access this thread.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {workspace.messages?.length ? workspace.messages.map((message) => {
                  const mine = String(message.sender?._id || message.sender) === currentUserId
                  return (
                    <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <UserLink
                          user={message.sender}
                          className={`inline-flex text-xs font-medium ${mine ? 'text-primary-foreground hover:!text-primary-foreground' : ''}`}
                        />
                        <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                        <p className="mt-1 text-[11px] opacity-70">{formatDate(message.createdAt)}</p>
                      </div>
                    </div>
                  )
                }) : <p className="py-6 text-center text-sm text-muted-foreground">No messages yet.</p>}
              </div>
              <form className="mt-4 flex gap-2 border-t pt-4" onSubmit={submitMessage}>
                <Textarea
                  className="min-h-16"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Write a contract message…"
                  maxLength={4000}
                  required
                />
                <Button type="submit" disabled={Boolean(busyAction) || !messageBody.trim()}>
                  {busyAction === 'message' ? 'Sending…' : 'Send'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Money</CardTitle>
              <CardDescription>All values use the platform currency, BHD.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ['Contract total', workspace.moneySummary?.totalAmount],
                ['Held in escrow', workspace.moneySummary?.escrowHeld],
                ['Approved', workspace.moneySummary?.approvedAmount],
                ['Remaining', workspace.moneySummary?.remainingAmount],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{formatMoney(value, contract.currency)}</span>
                </div>
              ))}
              <Button className="mt-2 w-full" variant="outline" nativeButton={false} render={<Link to="/wallet" />}>
                Open wallet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.length ? activity.map((entry, index) => (
                <div key={`${entry.type}:${entry.at}:${index}`}>
                  {index > 0 && <Separator className="mb-4" />}
                  <p className="text-sm">{entry.message || entry.type.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.by?.name || 'System'} · {formatDate(entry.at)}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No activity yet.</p>}
            </CardContent>
          </Card>

          {contract.status === 'active' && (isClient || isFreelancer) && (
            <Card>
              <CardHeader>
                <CardTitle>Cancel contract</CardTitle>
                <CardDescription>Funded work is refunded when cancellation is allowed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Reason for cancellation"
                  maxLength={1000}
                />
                <Button
                  className="w-full"
                  variant="destructive"
                  disabled={Boolean(busyAction) || !cancelReason.trim()}
                  onClick={() => runAction(
                    'cancel',
                    () => cancelContract(id, cancelReason, mutationKey('cancel', cancelReason.trim())),
                    'Contract cancelled.',
                  )}
                >
                  {busyAction === 'cancel' ? 'Cancelling…' : 'Cancel contract'}
                </Button>
              </CardContent>
            </Card>
          )}

          {isEnded && !workspace.myReview && (isClient || isFreelancer) && (
            <Card>
              <CardHeader>
                <CardTitle>Leave a review</CardTitle>
                <CardDescription>Each participant can review the other once after the contract ends.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={submitReview}>
                  <div>
                    <Label htmlFor="review-rating">Rating</Label>
                    <select
                      id="review-rating"
                      className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm"
                      value={review.rating}
                      onChange={(event) => setReview((current) => ({ ...current, rating: event.target.value }))}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="review-comment">Comment</Label>
                    <Textarea
                      id="review-comment"
                      required
                      maxLength={2000}
                      value={review.comment}
                      onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))}
                      placeholder="Describe your experience."
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={Boolean(busyAction) || !review.comment.trim()}>
                    {busyAction === 'review' ? 'Submitting…' : 'Submit review'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {workspace.myReview && (
            <Alert>
              <AlertTitle>Your review was submitted</AlertTitle>
              <AlertDescription>{workspace.myReview.rating}/5 · {workspace.myReview.comment}</AlertDescription>
            </Alert>
          )}
        </aside>
      </div>
    </main>
  )
}

export default ContractWorkspacePage
