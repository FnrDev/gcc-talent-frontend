import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  PackageAddIcon,
} from '@hugeicons/core-free-icons'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { createPackage, createService, uploadServiceImage } from '@/services/serviceService'

const IMAGE_TYPES = new Set(['image/gif', 'image/jpeg', 'image/png', 'image/webp'])
const IMAGE_ACCEPT = Array.from(IMAGE_TYPES).join(',')
const MAX_SERVICE_IMAGES = 5
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const TIER_DEFINITIONS = [
  {
    key: 'package1',
    position: 1,
    sortOrder: 0,
    required: true,
    namePlaceholder: 'Starter',
    helper: 'Your first package option.',
  },
  {
    key: 'package2',
    position: 2,
    sortOrder: 1,
    required: false,
    namePlaceholder: 'Growth',
    helper: 'Add another option with different scope, timing, or price.',
  },
  {
    key: 'package3',
    position: 3,
    sortOrder: 2,
    required: false,
    namePlaceholder: 'Complete',
    helper: 'Add a third option for buyers who need something different.',
  },
]

function createEmptyTiers() {
  return Object.fromEntries(
    TIER_DEFINITIONS.map((definition) => [
      definition.key,
      {
        enabled: definition.required,
        name: '',
        title: '',
        description: '',
        price: '',
        currency: 'BHD',
        deliveryDays: '',
        revisions: '1',
        features: '',
      },
    ]),
  )
}

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getFieldId(errorKey) {
  if (errorKey === 'serviceName') return 'service-name'

  return errorKey.replace('.', '-')
}

function isWholeNumber(value, minimum) {
  if (!/^\d+$/.test(value)) return false

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= minimum
}

function getPackageLabel(definition, tier) {
  return tier?.name?.trim() || `Package ${definition.position}`
}

function validateForm(serviceName, tiers) {
  const errors = {}

  if (!serviceName.trim()) {
    errors.serviceName = 'Enter a name for your service.'
  }

  const enabledTiers = TIER_DEFINITIONS
    .map((definition) => ({ definition, tier: tiers[definition.key] }))
    .filter(({ tier }) => tier.enabled)
  const packageNameCounts = enabledTiers.reduce((counts, { tier }) => {
    const normalizedName = tier.name.trim().toLocaleLowerCase()
    if (normalizedName) counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1)
    return counts
  }, new Map())

  for (const { definition, tier } of enabledTiers) {
    const packageName = tier.name.trim()

    if (!packageName) {
      errors[`${definition.key}.name`] = `Name package ${definition.position}.`
    } else if (packageNameCounts.get(packageName.toLocaleLowerCase()) > 1) {
      errors[`${definition.key}.name`] = 'Give each package a different name.'
    }

    if (!tier.title.trim()) {
      errors[`${definition.key}.title`] = `Enter a title for ${getPackageLabel(definition, tier)}.`
    }

    if (tier.price === '' || !Number.isFinite(Number(tier.price)) || Number(tier.price) < 0) {
      errors[`${definition.key}.price`] = 'Enter a price of 0 or more.'
    }

    if (!isWholeNumber(tier.deliveryDays, 1)) {
      errors[`${definition.key}.deliveryDays`] = 'Enter at least 1 delivery day.'
    }

    if (!isWholeNumber(tier.revisions, 0)) {
      errors[`${definition.key}.revisions`] = 'Enter 0 or more revisions.'
    }
  }

  return errors
}

function buildPackagePayload(definition, tier) {
  return {
    name: tier.name.trim(),
    title: tier.title.trim(),
    description: tier.description.trim(),
    price: Number(tier.price),
    currency: tier.currency,
    deliveryDays: Number(tier.deliveryDays),
    revisions: Number(tier.revisions),
    features: tier.features
      .split('\n')
      .map((feature) => feature.trim())
      .filter(Boolean),
    sortOrder: definition.sortOrder,
  }
}

function getResourceId(resource, resourceName) {
  const unwrapped = resource?.data?.[resourceName] || resource?.[resourceName] || resource
  const id = unwrapped?._id || unwrapped?.id

  if (!id) {
    throw new Error(`The server did not return the saved ${resourceName} ID.`)
  }

  return String(id)
}

function PackageEditor({
  definition,
  tier,
  errors,
  savedId,
  busy,
  onChange,
  onToggle,
}) {
  const disabled = Boolean(savedId) || busy
  const nameError = errors[`${definition.key}.name`]
  const titleError = errors[`${definition.key}.title`]
  const priceError = errors[`${definition.key}.price`]
  const deliveryError = errors[`${definition.key}.deliveryDays`]
  const revisionsError = errors[`${definition.key}.revisions`]

  if (!tier.enabled) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Package {definition.position}
              </h2>
              <Badge variant="outline">Optional</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{definition.helper}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onToggle(definition.key)}
            disabled={busy}
          >
            Add package
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-2 border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{getPackageLabel(definition, tier)}</CardTitle>
              {definition.required ? <Badge>Required</Badge> : <Badge variant="outline">Optional</Badge>}
              {savedId ? (
                <Badge variant="secondary" className="gap-1">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" />
                  Saved
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{definition.helper}</p>
          </div>
          {!definition.required && !savedId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggle(definition.key)}
              disabled={busy}
            >
              Remove package
            </Button>
          ) : null}
        </div>
        {savedId ? (
          <p className="text-xs text-muted-foreground">
            This package is already saved and will be reused when you retry service creation.
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-5 py-5">
        <Field data-invalid={Boolean(nameError)}>
          <FieldLabel htmlFor={`${definition.key}-name`}>Package name</FieldLabel>
          <Input
            id={`${definition.key}-name`}
            name="name"
            value={tier.name}
            onChange={(event) => onChange(definition.key, event)}
            placeholder={definition.namePlaceholder}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError
              ? `${definition.key}-name-description ${definition.key}-name-error`
              : `${definition.key}-name-description`}
            disabled={disabled}
            maxLength={80}
            required
          />
          <FieldDescription id={`${definition.key}-name-description`}>
            Choose the short label buyers will see on this package tab.
          </FieldDescription>
          {nameError ? <FieldError id={`${definition.key}-name-error`}>{nameError}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(titleError)}>
          <FieldLabel htmlFor={`${definition.key}-title`}>Package title</FieldLabel>
          <Input
            id={`${definition.key}-title`}
            name="title"
            value={tier.title}
            onChange={(event) => onChange(definition.key, event)}
            placeholder="Describe what this package delivers"
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError
              ? `${definition.key}-title-description ${definition.key}-title-error`
              : `${definition.key}-title-description`}
            disabled={disabled}
            maxLength={120}
            required
          />
          <FieldDescription id={`${definition.key}-title-description`}>
            Summarize what this package delivers.
          </FieldDescription>
          {titleError ? <FieldError id={`${definition.key}-title-error`}>{titleError}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor={`${definition.key}-description`}>Description</FieldLabel>
          <Textarea
            id={`${definition.key}-description`}
            name="description"
            value={tier.description}
            onChange={(event) => onChange(definition.key, event)}
            placeholder="Explain the scope, process, and final deliverables."
            disabled={disabled}
            rows={4}
          />
          <FieldDescription>Optional. Buyers will see this inside the package.</FieldDescription>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field data-invalid={Boolean(priceError)}>
            <FieldLabel htmlFor={`${definition.key}-price`}>Price</FieldLabel>
            <Input
              id={`${definition.key}-price`}
              name="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.001"
              value={tier.price}
              onChange={(event) => onChange(definition.key, event)}
              aria-invalid={Boolean(priceError)}
              aria-describedby={priceError ? `${definition.key}-price-error` : undefined}
              disabled={disabled}
              required
            />
            {priceError ? <FieldError id={`${definition.key}-price-error`}>{priceError}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor={`${definition.key}-currency`}>Currency</FieldLabel>
            <Input
              id={`${definition.key}-currency`}
              name="currency"
              value={tier.currency}
              readOnly
              aria-readonly="true"
              disabled={disabled}
            />
            <FieldDescription>All marketplace payments use Bahraini dinar.</FieldDescription>
          </Field>

          <Field data-invalid={Boolean(deliveryError)}>
            <FieldLabel htmlFor={`${definition.key}-deliveryDays`}>Delivery days</FieldLabel>
            <Input
              id={`${definition.key}-deliveryDays`}
              name="deliveryDays"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={tier.deliveryDays}
              onChange={(event) => onChange(definition.key, event)}
              aria-invalid={Boolean(deliveryError)}
              aria-describedby={deliveryError ? `${definition.key}-deliveryDays-error` : undefined}
              disabled={disabled}
              required
            />
            {deliveryError ? (
              <FieldError id={`${definition.key}-deliveryDays-error`}>{deliveryError}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(revisionsError)}>
            <FieldLabel htmlFor={`${definition.key}-revisions`}>Revisions</FieldLabel>
            <Input
              id={`${definition.key}-revisions`}
              name="revisions"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={tier.revisions}
              onChange={(event) => onChange(definition.key, event)}
              aria-invalid={Boolean(revisionsError)}
              aria-describedby={revisionsError ? `${definition.key}-revisions-error` : undefined}
              disabled={disabled}
              required
            />
            {revisionsError ? (
              <FieldError id={`${definition.key}-revisions-error`}>{revisionsError}</FieldError>
            ) : null}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={`${definition.key}-features`}>Included features</FieldLabel>
          <Textarea
            id={`${definition.key}-features`}
            name="features"
            value={tier.features}
            onChange={(event) => onChange(definition.key, event)}
            placeholder={'Responsive layout\nSource files\nTwo design concepts'}
            disabled={disabled}
            rows={4}
          />
          <FieldDescription>Optional. Enter one included feature per line.</FieldDescription>
        </Field>
      </CardContent>
    </Card>
  )
}

function CreateServicePage() {
  const [serviceName, setServiceName] = useState('')
  const [tiers, setTiers] = useState(createEmptyTiers)
  const [fieldErrors, setFieldErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [savedPackageIds, setSavedPackageIds] = useState({})
  const [uncertainTierKey, setUncertainTierKey] = useState('')
  const [serviceImages, setServiceImages] = useState([])
  const [imageError, setImageError] = useState('')
  const [uncertainImageId, setUncertainImageId] = useState('')
  const [serviceResponseUncertain, setServiceResponseUncertain] = useState(false)
  const [submittingLabel, setSubmittingLabel] = useState('')
  const [createdService, setCreatedService] = useState(null)
  const previewUrlsRef = useRef(new Set())
  const imageInputRef = useRef(null)

  useEffect(() => () => {
    for (const previewUrl of previewUrlsRef.current) URL.revokeObjectURL(previewUrl)
    previewUrlsRef.current.clear()
  }, [])

  const enabledDefinitions = useMemo(
    () => TIER_DEFINITIONS.filter((definition) => tiers[definition.key].enabled),
    [tiers],
  )
  const savedCount = Object.keys(savedPackageIds).length

  function revokePreview(previewUrl) {
    URL.revokeObjectURL(previewUrl)
    previewUrlsRef.current.delete(previewUrl)
  }

  function clearImagePreviews() {
    for (const previewUrl of previewUrlsRef.current) URL.revokeObjectURL(previewUrl)
    previewUrlsRef.current.clear()
  }

  function clearFieldError(key) {
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function handleServiceNameChange(event) {
    setServiceName(event.target.value)
    setRequestError('')
    setServiceResponseUncertain(false)
    clearFieldError('serviceName')
  }

  function handleTierChange(tierKey, event) {
    const { name, value } = event.target
    setRequestError('')
    setServiceResponseUncertain(false)
    clearFieldError(`${tierKey}.${name}`)
    setTiers((current) => ({
      ...current,
      [tierKey]: {
        ...current[tierKey],
        [name]: value,
      },
    }))
  }

  function toggleTier(tierKey) {
    if (savedPackageIds[tierKey]) return
    setRequestError('')
    setServiceResponseUncertain(false)
    setFieldErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(`${tierKey}.`)),
    ))
    setTiers((current) => ({
      ...current,
      [tierKey]: {
        ...current[tierKey],
        enabled: !current[tierKey].enabled,
      },
    }))
  }

  function handleImageSelection(event) {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selectedFiles.length) return

    setRequestError('')
    setServiceResponseUncertain(false)
    setImageError('')

    const nextImages = [...serviceImages]
    const rejected = []

    for (const file of selectedFiles) {
      if (nextImages.length >= MAX_SERVICE_IMAGES) {
        rejected.push(`You can add up to ${MAX_SERVICE_IMAGES} images.`)
        break
      }
      if (!IMAGE_TYPES.has(file.type)) {
        rejected.push(`${file.name} must be a JPEG, PNG, WebP, or GIF image.`)
        continue
      }
      if (file.size < 1 || file.size > MAX_IMAGE_SIZE_BYTES) {
        rejected.push(`${file.name} must be 10 MB or smaller.`)
        continue
      }
      if (nextImages.some((image) => (
        image.file.name === file.name &&
        image.file.size === file.size &&
        image.file.lastModified === file.lastModified
      ))) {
        rejected.push(`${file.name} is already selected.`)
        continue
      }

      const previewUrl = URL.createObjectURL(file)
      previewUrlsRef.current.add(previewUrl)
      nextImages.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        attachment: null,
        status: 'pending',
        error: '',
      })
    }

    setServiceImages(nextImages)
    if (rejected.length) setImageError(rejected[0])
  }

  function removeImage(imageId) {
    const image = serviceImages.find((item) => item.id === imageId)
    if (!image || image.attachment || submittingLabel) return

    revokePreview(image.previewUrl)
    setServiceImages((current) => current.filter((item) => item.id !== imageId))
    setImageError('')
    setRequestError('')
    setServiceResponseUncertain(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (uncertainTierKey || uncertainImageId) return

    const validationErrors = validateForm(serviceName, tiers)
    setFieldErrors(validationErrors)
    setRequestError('')
    setServiceResponseUncertain(false)

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidField = document.getElementById(
        getFieldId(Object.keys(validationErrors)[0]),
      )
      firstInvalidField?.focus()
      firstInvalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const nextPackageIds = { ...savedPackageIds }
    const nextServiceImages = serviceImages.map((image) => ({ ...image }))

    try {
      for (let index = 0; index < nextServiceImages.length; index += 1) {
        const image = nextServiceImages[index]
        if (image.attachment) continue

        setSubmittingLabel(`Uploading ${image.file.name}…`)
        nextServiceImages[index] = { ...image, status: 'uploading', error: '' }
        setServiceImages([...nextServiceImages])

        try {
          const attachment = await uploadServiceImage(image.file)
          if (
            !attachment?.url ||
            !attachment?.name ||
            !Number.isSafeInteger(attachment?.size) ||
            !IMAGE_TYPES.has(attachment?.contentType) ||
            !attachment?.receipt
          ) {
            throw new Error('The server returned invalid image metadata.')
          }

          nextServiceImages[index] = {
            ...image,
            attachment,
            status: 'uploaded',
            error: '',
          }
          setServiceImages([...nextServiceImages])
        } catch (error) {
          const responseWasUnconfirmed = !error?.response || error.response.status === 502
          const message = responseWasUnconfirmed
            ? `We could not confirm whether ${image.file.name} was uploaded. To avoid a duplicate upload, this form will not retry it automatically.`
            : getRequestError(
              error,
              `We could not upload ${image.file.name}. Please try again.`,
            )

          nextServiceImages[index] = { ...image, status: 'error', error: message }
          setServiceImages([...nextServiceImages])
          if (responseWasUnconfirmed) setUncertainImageId(image.id)
          throw new Error(message, { cause: error })
        }
      }

      for (const definition of enabledDefinitions) {
        if (nextPackageIds[definition.key]) continue

        const packageLabel = getPackageLabel(definition, tiers[definition.key])
        setSubmittingLabel(`Saving ${packageLabel}…`)

        try {
          const savedPackage = await createPackage(
            buildPackagePayload(definition, tiers[definition.key]),
          )
          const packageId = getResourceId(savedPackage, 'package')
          nextPackageIds[definition.key] = packageId
          setSavedPackageIds({ ...nextPackageIds })
        } catch (error) {
          const responseWasUnconfirmed = !error?.response
          if (responseWasUnconfirmed) setUncertainTierKey(definition.key)
          throw new Error(
            getRequestError(
              error,
              responseWasUnconfirmed
                ? `We could not confirm whether ${packageLabel} was saved. To avoid a duplicate, this form will not retry it automatically.`
                : `We could not save ${packageLabel}. Please try again.`,
            ),
            { cause: error },
          )
        }
      }

      setSubmittingLabel('Publishing your service…')
      let service
      let serviceId
      try {
        service = await createService({
          name: serviceName.trim(),
          packages: enabledDefinitions.map((definition) => nextPackageIds[definition.key]),
          images: nextServiceImages.map((image) => image.attachment),
        })
        serviceId = getResourceId(service, 'service')
      } catch (error) {
        if (!error?.response) {
          setServiceResponseUncertain(true)
          throw new Error(
            'We could not confirm the final response. Your service may already be live, so check the marketplace before retrying.',
            { cause: error },
          )
        }

        throw error
      }
      clearImagePreviews()
      setCreatedService({ ...service, _id: serviceId })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setRequestError(
        getRequestError(error, error.message || 'We could not create your service. Please try again.'),
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmittingLabel('')
    }
  }

  function retryUnconfirmedTier() {
    setUncertainTierKey('')
    setRequestError('')
  }

  function retryUnconfirmedImage() {
    setUncertainImageId('')
    setRequestError('')
    setServiceImages((current) => current.map((image) => (
      image.id === uncertainImageId
        ? { ...image, status: 'pending', error: '' }
        : image
    )))
  }

  function retryUnconfirmedService() {
    setServiceResponseUncertain(false)
    setRequestError('')
  }

  function startAnotherService() {
    clearImagePreviews()
    setServiceName('')
    setTiers(createEmptyTiers())
    setFieldErrors({})
    setRequestError('')
    setSavedPackageIds({})
    setUncertainTierKey('')
    setServiceImages([])
    setImageError('')
    setUncertainImageId('')
    setServiceResponseUncertain(false)
    setCreatedService(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (createdService) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl items-center px-4 py-12">
        <Card className="w-full shadow-sm">
          <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-7" />
            </span>
            <div>
              <Badge variant="secondary">Service published</Badge>
              <h1 className="mt-3 font-heading text-3xl font-semibold text-foreground">
                {serviceName.trim()}
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Your service and {enabledDefinitions.length}{' '}
                {enabledDefinitions.length === 1 ? 'package are' : 'packages are'} now live in the marketplace.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button nativeButton={false} render={<Link to={`/services/${createdService._id}`} />}>
                View service
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link to="/services" />}>
                Browse services
              </Button>
              <Button type="button" variant="ghost" onClick={startAnotherService}>
                Create another
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  const uncertainDefinition = TIER_DEFINITIONS.find(
    (definition) => definition.key === uncertainTierKey,
  )
  const uncertainPackageLabel = uncertainDefinition
    ? getPackageLabel(uncertainDefinition, tiers[uncertainDefinition.key])
    : ''
  const uncertainImage = serviceImages.find((image) => image.id === uncertainImageId)

  return (
    <main className="bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <div className="mb-8">
            <Badge variant="outline">Freelancer service</Badge>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Create a service
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Give buyers a clear service name, then name and define one required package and up to two optional packages.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {Object.keys(fieldErrors).length > 0 ? (
              <Alert variant="destructive">
                <AlertTitle>Check the highlighted fields</AlertTitle>
                <AlertDescription>Complete the required details before publishing your service.</AlertDescription>
              </Alert>
            ) : null}

            {requestError ? (
              <Alert variant="destructive">
                <AlertTitle>
                  {uncertainImage
                    ? 'Upload could not be confirmed'
                    : uncertainDefinition
                    ? 'Save could not be confirmed'
                    : serviceResponseUncertain
                      ? 'Publication could not be confirmed'
                      : 'Service not published'}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>{requestError}</p>
                  {uncertainImage ? (
                    <div>
                      <p className="mb-2 text-xs">
                        Retrying may upload {uncertainImage.file.name} twice if the first request reached storage.
                      </p>
                      <Button type="button" size="sm" variant="outline" onClick={retryUnconfirmedImage}>
                        Retry this image anyway
                      </Button>
                    </div>
                  ) : null}
                  {uncertainDefinition ? (
                    <div>
                      <p className="mb-2 text-xs">
                        Retrying may create a duplicate {uncertainPackageLabel} package if the first request reached the server.
                      </p>
                      <Button type="button" size="sm" variant="outline" onClick={retryUnconfirmedTier}>
                        Retry this package anyway
                      </Button>
                    </div>
                  ) : null}
                  {serviceResponseUncertain ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={retryUnconfirmedService}
                      >
                        Retry publication
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        nativeButton={false}
                        render={(
                          <Link
                            to={`/services?search=${encodeURIComponent(serviceName.trim())}`}
                            target="_blank"
                            rel="noreferrer"
                          />
                        )}
                      >
                        Check marketplace in a new tab
                      </Button>
                    </div>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            {savedCount > 0 && !createdService ? (
              <Alert>
                <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                <AlertTitle>{savedCount} {savedCount === 1 ? 'package' : 'packages'} saved</AlertTitle>
                <AlertDescription>
                  Confirmed packages are locked and reused on retry while this page stays open. You can still change the service name.
                </AlertDescription>
              </Alert>
            ) : null}

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Service details</CardTitle>
              </CardHeader>
              <CardContent>
                <Field data-invalid={Boolean(fieldErrors.serviceName)}>
                  <FieldLabel htmlFor="service-name">Service name</FieldLabel>
                  <Input
                    id="service-name"
                    value={serviceName}
                    onChange={handleServiceNameChange}
                    placeholder="I will design and build your business website"
                    aria-invalid={Boolean(fieldErrors.serviceName)}
                    aria-describedby={fieldErrors.serviceName
                      ? 'service-name-description service-name-error'
                      : 'service-name-description'}
                    disabled={Boolean(submittingLabel)}
                    maxLength={120}
                    autoFocus
                    required
                  />
                  <FieldDescription id="service-name-description">
                    Use a specific, outcome-focused name. A service is published as soon as creation succeeds.
                  </FieldDescription>
                  {fieldErrors.serviceName ? (
                    <FieldError id="service-name-error">{fieldErrors.serviceName}</FieldError>
                  ) : null}
                </Field>

                <Separator className="my-6" />

                <Field data-invalid={Boolean(imageError)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FieldLabel htmlFor="service-images">Service images</FieldLabel>
                    <span className="text-xs text-muted-foreground">
                      {serviceImages.length}/{MAX_SERVICE_IMAGES}
                    </span>
                  </div>
                  <Input
                    ref={imageInputRef}
                    id="service-images"
                    type="file"
                    accept={IMAGE_ACCEPT}
                    multiple
                    onChange={handleImageSelection}
                    aria-invalid={Boolean(imageError)}
                    aria-describedby={imageError
                      ? 'service-images-description service-images-error'
                      : 'service-images-description'}
                    disabled={
                      Boolean(submittingLabel) ||
                      Boolean(uncertainImageId) ||
                      serviceResponseUncertain ||
                      serviceImages.length >= MAX_SERVICE_IMAGES
                    }
                    className="sr-only"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={
                      Boolean(submittingLabel) ||
                      Boolean(uncertainImageId) ||
                      serviceResponseUncertain ||
                      serviceImages.length >= MAX_SERVICE_IMAGES
                    }
                  >
                    Add images
                  </Button>
                  <FieldDescription id="service-images-description">
                    Optional. Add up to five JPEG, PNG, WebP, or GIF images, each no larger than 10 MB. The first image is the cover.
                  </FieldDescription>
                  {imageError ? <FieldError id="service-images-error">{imageError}</FieldError> : null}
                </Field>

                {serviceImages.length > 0 ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {serviceImages.map((image, index) => (
                      <div key={image.id} className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="relative aspect-16/9 overflow-hidden bg-muted">
                          <img
                            src={image.previewUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                          {index === 0 ? (
                            <Badge className="absolute top-2 left-2">Cover</Badge>
                          ) : null}
                          {image.status === 'uploading' ? (
                            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-sm font-medium text-white">
                              <Spinner />
                              Uploading…
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-start justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{image.file.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatFileSize(image.file.size)} · {image.attachment ? 'Uploaded' : 'Ready to upload'}
                            </p>
                            {image.error ? (
                              <p className="mt-1 text-xs text-destructive" role="alert">{image.error}</p>
                            ) : null}
                          </div>
                          {!image.attachment ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              onClick={() => removeImage(image.id)}
                              disabled={Boolean(submittingLabel) || image.id === uncertainImageId}
                            >
                              Remove
                            </Button>
                          ) : (
                            <Badge variant="secondary">Saved</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {TIER_DEFINITIONS.map((definition) => (
              <PackageEditor
                key={definition.key}
                definition={definition}
                tier={tiers[definition.key]}
                errors={fieldErrors}
                savedId={savedPackageIds[definition.key]}
                busy={Boolean(submittingLabel)}
                onChange={handleTierChange}
                onToggle={toggleTier}
              />
            ))}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {submittingLabel ? (
                <Button type="button" variant="ghost" disabled>Cancel</Button>
              ) : (
                <Button variant="ghost" nativeButton={false} render={<Link to="/services" />}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={
                  Boolean(submittingLabel) ||
                  Boolean(uncertainImageId) ||
                  Boolean(uncertainTierKey) ||
                  serviceResponseUncertain
                }
              >
                {submittingLabel ? (
                  <>
                    <Spinner />
                    {submittingLabel}
                  </>
                ) : savedCount === enabledDefinitions.length ? (
                  'Retry publishing service'
                ) : (
                  'Create service'
                )}
              </Button>
            </div>
          </form>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={PackageAddIcon} strokeWidth={2} className="size-5" />
              </div>
              <CardTitle className="mt-2">Before you publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Buyers compare your packages by price, delivery time, revisions, and included features.</p>
              <Separator />
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-primary" />
                  Your first package is required; add up to two more if they help buyers compare options.
                </li>
                <li className="flex gap-2">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-primary" />
                  Each feature should describe one concrete deliverable.
                </li>
                <li className="flex gap-2">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-primary" />
                  Your service becomes visible immediately after publishing.
                </li>
              </ul>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Packages included</span>
                <Badge variant="secondary">{enabledDefinitions.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}

export default CreateServicePage
