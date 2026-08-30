import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  CreditCardIcon,
  SecurityLockIcon,
} from '@hugeicons/core-free-icons'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/format'
import { createServiceOrder } from '@/services/serviceService'

const SUCCESS_CARD = '4242 4242 4242 4242'
const DECLINED_CARD = '4000 0000 0000 0002'
const EMPTY_FORM = {
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function validateForm(form) {
  const errors = {}
  const cardDigits = form.cardNumber.replace(/\D/g, '')

  if (form.cardholderName.trim().length < 2) {
    errors.cardholderName = 'Enter the demo cardholder name.'
  }
  if (cardDigits.length < 13) {
    errors.cardNumber = 'Enter a complete test card number.'
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)) {
    errors.expiry = 'Enter the expiry as MM/YY.'
  }
  if (!/^\d{3,4}$/.test(form.cvc)) {
    errors.cvc = 'Enter a 3 or 4 digit CVC.'
  }

  return errors
}

function fieldId(field) {
  return `service-checkout-${field}`
}

function ServiceCheckoutDialog({ open, onOpenChange, service, pack }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [requestState, setRequestState] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  function handleOpenChange(nextOpen) {
    if (!nextOpen && submitting) return
    onOpenChange(nextOpen)
  }

  function handleChange(event) {
    const { name } = event.target
    let { value } = event.target

    if (name === 'cardNumber') value = formatCardNumber(value)
    if (name === 'expiry') value = formatExpiry(value)
    if (name === 'cvc') value = value.replace(/\D/g, '').slice(0, 4)

    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
    if (requestState?.type !== 'uncertain') setRequestState(null)
  }

  function applyTestCard(cardNumber) {
    setForm((current) => ({ ...current, cardNumber }))
    setFieldErrors((current) => {
      if (!current.cardNumber) return current
      const next = { ...current }
      delete next.cardNumber
      return next
    })
    setRequestState(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!service?._id || !pack?._id || submitting) return

    const errors = validateForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      document.getElementById(fieldId(Object.keys(errors)[0]))?.focus()
      return
    }

    setSubmitting(true)
    setRequestState(null)

    try {
      const result = await createServiceOrder(
        service._id,
        {
          packageId: pack._id,
          payment: {
            cardholderName: form.cardholderName.trim(),
            cardNumber: form.cardNumber,
            expiry: form.expiry,
            cvc: form.cvc,
          },
        },
        idempotencyKey,
      )

      setSuccess(result)
      setForm(EMPTY_FORM)
    } catch (error) {
      const status = error?.response?.status
      const code = error?.response?.data?.code
      const responseMessage = error?.response?.data?.message
      const uncertain = !error?.response || (status >= 500 && code !== 'MOCK_CHECKOUT_DISABLED')

      if (uncertain) {
        setRequestState({
          type: 'uncertain',
          title: 'Order could not be confirmed',
          message: 'The demo order may have been created. Retry the same payment to check safely without creating a duplicate.',
        })
      } else {
        setRequestState({
          type: code === 'MOCK_CARD_DECLINED' ? 'declined' : 'error',
          title: code === 'MOCK_CARD_DECLINED' ? 'Payment declined' : 'Order not placed',
          message: responseMessage || 'The demo order could not be created. Check the form and try again.',
        })
        setIdempotencyKey(crypto.randomUUID())
        setForm((current) => ({ ...current, cvc: '' }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!pack || !service) return null

  const inputsDisabled = submitting || requestState?.type === 'uncertain'
  const confirmedPackage = success?.contract?.source?.packageSnapshot
  const confirmedAmount = success?.contract?.totalAmount ?? pack.price
  const confirmedCurrency = success?.contract?.currency ?? pack.currency

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        {success ? (
          <div className="flex flex-col gap-5 py-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-6" />
            </div>
            <DialogHeader>
              <Badge variant="secondary" className="w-fit">Demo payment approved</Badge>
              <DialogTitle className="text-xl">Order confirmed</DialogTitle>
              <DialogDescription>
                Your funded contract is ready. The freelancer can now start the package work.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {confirmedPackage?.packageName || pack.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {confirmedPackage?.serviceName || service.name}
                  </p>
                </div>
                <p className="shrink-0 font-heading text-lg font-semibold">
                  {formatCurrency(confirmedAmount, confirmedCurrency)}
                </p>
              </div>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                Contract reference: {success.contract?._id || 'Created'}
              </p>
            </div>

            <Alert>
              <HugeiconsIcon icon={SecurityLockIcon} strokeWidth={2} />
              <AlertTitle>No real card was charged</AlertTitle>
              <AlertDescription>
                This checkout only created internal demo contract and escrow records.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="contents">
            <DialogHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-5" />
              </div>
              <DialogTitle className="text-lg">Demo card checkout</DialogTitle>
              <DialogDescription>
                Use test details only. This form never charges or stores a real card.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{pack.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pack.deliveryDays} day delivery · {pack.revisions} revisions
                  </p>
                </div>
                <p className="shrink-0 font-heading text-lg font-semibold text-foreground">
                  {formatCurrency(pack.price, pack.currency)}
                </p>
              </div>
            </div>

            {requestState ? (
              <Alert variant={requestState.type === 'uncertain' ? 'default' : 'destructive'}>
                <AlertTitle>{requestState.title}</AlertTitle>
                <AlertDescription>{requestState.message}</AlertDescription>
              </Alert>
            ) : null}

            <FieldGroup>
              <Field data-invalid={Boolean(fieldErrors.cardholderName)}>
                <FieldLabel htmlFor={fieldId('cardholderName')}>Cardholder name</FieldLabel>
                <Input
                  id={fieldId('cardholderName')}
                  name="cardholderName"
                  value={form.cardholderName}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="Demo Client"
                  disabled={inputsDisabled}
                  aria-invalid={Boolean(fieldErrors.cardholderName)}
                  required
                />
                {fieldErrors.cardholderName ? <FieldError>{fieldErrors.cardholderName}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.cardNumber)}>
                <FieldLabel htmlFor={fieldId('cardNumber')}>Test card number</FieldLabel>
                <Input
                  id={fieldId('cardNumber')}
                  name="cardNumber"
                  value={form.cardNumber}
                  onChange={handleChange}
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder={SUCCESS_CARD}
                  disabled={inputsDisabled}
                  aria-invalid={Boolean(fieldErrors.cardNumber)}
                  required
                />
                {fieldErrors.cardNumber ? <FieldError>{fieldErrors.cardNumber}</FieldError> : null}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={Boolean(fieldErrors.expiry)}>
                  <FieldLabel htmlFor={fieldId('expiry')}>Expiry</FieldLabel>
                  <Input
                    id={fieldId('expiry')}
                    name="expiry"
                    value={form.expiry}
                    onChange={handleChange}
                    autoComplete="off"
                    inputMode="numeric"
                    placeholder="12/30"
                    disabled={inputsDisabled}
                    aria-invalid={Boolean(fieldErrors.expiry)}
                    required
                  />
                  {fieldErrors.expiry ? <FieldError>{fieldErrors.expiry}</FieldError> : null}
                </Field>

                <Field data-invalid={Boolean(fieldErrors.cvc)}>
                  <FieldLabel htmlFor={fieldId('cvc')}>CVC</FieldLabel>
                  <Input
                    id={fieldId('cvc')}
                    name="cvc"
                    value={form.cvc}
                    onChange={handleChange}
                    autoComplete="off"
                    inputMode="numeric"
                    placeholder="123"
                    disabled={inputsDisabled}
                    aria-invalid={Boolean(fieldErrors.cvc)}
                    required
                  />
                  {fieldErrors.cvc ? <FieldError>{fieldErrors.cvc}</FieldError> : null}
                </Field>
              </div>
            </FieldGroup>

            <div className="rounded-xl border border-dashed border-border p-3">
              <p className="text-sm font-medium text-foreground">Test card scenarios</p>
              <FieldDescription className="mt-1">
                Pick a card below, then enter any future expiry and a 3-digit CVC.
              </FieldDescription>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" size="sm" onClick={() => applyTestCard(SUCCESS_CARD)} disabled={inputsDisabled}>
                  Use success card
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyTestCard(DECLINED_CARD)} disabled={inputsDisabled}>
                  Use declined card
                </Button>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <code>{SUCCESS_CARD} — succeeds</code>
                <code>{DECLINED_CARD} — rejected</code>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                {submitting
                  ? 'Confirming…'
                  : requestState?.type === 'uncertain'
                    ? 'Retry same payment'
                    : 'Confirm demo payment'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ServiceCheckoutDialog
