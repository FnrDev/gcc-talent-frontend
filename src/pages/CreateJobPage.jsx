import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Briefcase02Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Money03Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import {
  createJob,
  getCategories,
  getMyJob,
  getSkills,
  publishJob,
  updateMyJob,
} from '@/services/jobService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

const BUDGET_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

function createEmptyForm() {
  return {
    title: '',
    description: '',
    category: '',
    skills: [],
    budgetType: 'fixed',
    budgetMin: '',
    budgetMax: '',
    experienceLevel: '',
    duration: '',
    deadline: '',
  }
}

function dateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''

  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 10)
}

function formFromJob(job) {
  return {
    title: job.title || '',
    description: job.description || '',
    category: job.category?._id || job.category || '',
    skills: (job.skills || []).map((skill) => skill?._id || skill).filter(Boolean),
    budgetType: job.budgetType || 'fixed',
    budgetMin: job.budgetMin ?? '',
    budgetMax: job.budgetMax ?? '',
    experienceLevel: job.experienceLevel || '',
    duration: job.duration || '',
    deadline: dateInputValue(job.deadline),
  }
}

function getTomorrowDateValue() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const localTime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000)

  return localTime.toISOString().slice(0, 10)
}

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function budgetValidationMessage(formData) {
  const minimum = formData.budgetMin === '' ? undefined : Number(formData.budgetMin)
  const maximum = formData.budgetMax === '' ? undefined : Number(formData.budgetMax)

  if (minimum !== undefined && (!Number.isFinite(minimum) || minimum < 0)) {
    return 'Enter a valid minimum budget.'
  }

  if (maximum !== undefined && (!Number.isFinite(maximum) || maximum < 0)) {
    return 'Enter a valid maximum budget.'
  }

  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    return 'The minimum budget cannot be greater than the maximum.'
  }

  return ''
}

function StepHeading({ number, title, description }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {number}
      </span>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function CreateJobPage() {
  const routeParams = useParams()
  const jobId = routeParams.jobId || routeParams.id
  const isEditing = Boolean(jobId)
  const [formData, setFormData] = useState(createEmptyForm)
  const [categories, setCategories] = useState([])
  const [skills, setSkills] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')
  const [skillsError, setSkillsError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [submittingIntent, setSubmittingIntent] = useState('')
  const [createdResult, setCreatedResult] = useState(null)
  const [retryingPublish, setRetryingPublish] = useState(false)
  const [jobLoading, setJobLoading] = useState(isEditing)
  const [jobLoadError, setJobLoadError] = useState('')
  const [editingStatus, setEditingStatus] = useState('')
  const minimumDeadline = useMemo(getTomorrowDateValue, [])

  useEffect(() => {
    let cancelled = false

    if (!isEditing) return undefined

    async function loadJob() {
      setJobLoading(true)
      setJobLoadError('')

      try {
        const job = await getMyJob(jobId)

        if (!['draft', 'open'].includes(job.status)) {
          throw new Error('Only draft or open jobs can be edited.')
        }

        if (!cancelled) {
          setFormData(formFromJob(job))
          setEditingStatus(job.status)
        }
      } catch (error) {
        if (!cancelled) {
          setJobLoadError(
            error?.response
              ? getRequestError(error, 'We could not load this job for editing.')
              : error.message,
          )
        }
      } finally {
        if (!cancelled) setJobLoading(false)
      }
    }

    loadJob()
    return () => {
      cancelled = true
    }
  }, [isEditing, jobId])

  const loadCategories = useCallback(async () => {
    setCategoriesError('')
    setCategoriesLoading(true)

    try {
      const availableCategories = await getCategories()
      setCategories(availableCategories)
    } catch (error) {
      setCategoriesError(
        getRequestError(error, 'We could not load job categories. Please try again.'),
      )
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    let cancelled = false

    if (!formData.category) {
      setSkills([])
      setSkillsError('')
      return undefined
    }

    async function loadSkills() {
      setSkills([])
      setSkillsError('')
      setSkillsLoading(true)

      try {
        const availableSkills = await getSkills(formData.category)

        if (!cancelled) {
          setSkills(availableSkills)
        }
      } catch (error) {
        if (!cancelled) {
          setSkillsError(
            getRequestError(error, 'Skills are unavailable right now. You can still post without them.'),
          )
        }
      } finally {
        if (!cancelled) {
          setSkillsLoading(false)
        }
      }
    }

    loadSkills()

    return () => {
      cancelled = true
    }
  }, [formData.category])

  const budgetError = budgetValidationMessage(formData)
  const deadlineError = formData.deadline && formData.deadline < minimumDeadline
    ? 'Choose a future deadline.'
    : ''
  const selectedCategory = categories.find((category) => category._id === formData.category)
  const selectedSkillNames = skills
    .filter((skill) => formData.skills.includes(skill._id))
    .map((skill) => skill.name)
  const isFormInvalid =
    jobLoading ||
    !formData.title.trim() ||
    !formData.description.trim() ||
    !formData.category ||
    Boolean(budgetError) ||
    Boolean(deadlineError)

  const budgetSummary = useMemo(() => {
    const minimum = formData.budgetMin === '' ? null : Number(formData.budgetMin)
    const maximum = formData.budgetMax === '' ? null : Number(formData.budgetMax)

    if (minimum === null && maximum === null) return 'Not set yet'
    if (minimum !== null && maximum !== null) {
      return `${BUDGET_FORMATTER.format(minimum)} – ${BUDGET_FORMATTER.format(maximum)}`
    }

    return minimum !== null
      ? `From ${BUDGET_FORMATTER.format(minimum)}`
      : `Up to ${BUDGET_FORMATTER.format(maximum)}`
  }, [formData.budgetMax, formData.budgetMin])

  function handleChange(event) {
    const { name, value } = event.target
    setRequestError('')
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'category' ? { skills: [] } : null),
    }))
  }

  function toggleSkill(skillId) {
    setFormData((current) => ({
      ...current,
      skills: current.skills.includes(skillId)
        ? current.skills.filter((id) => id !== skillId)
        : [...current.skills, skillId],
    }))
  }

  function buildPayload() {
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      skills: formData.skills,
      budgetType: formData.budgetType,
    }

    if (formData.budgetMin !== '') payload.budgetMin = Number(formData.budgetMin)
    else if (isEditing) payload.budgetMin = null

    if (formData.budgetMax !== '') payload.budgetMax = Number(formData.budgetMax)
    else if (isEditing) payload.budgetMax = null

    if (formData.experienceLevel) payload.experienceLevel = formData.experienceLevel
    else if (isEditing) payload.experienceLevel = null

    if (formData.duration || isEditing) payload.duration = formData.duration

    if (formData.deadline) {
      payload.deadline = new Date(`${formData.deadline}T23:59:59`).toISOString()
    } else if (isEditing) payload.deadline = null

    return payload
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isFormInvalid) return

    const requestedIntent = event.nativeEvent.submitter?.value
    const intent = isEditing
      ? (requestedIntent === 'publish' ? 'publish' : 'save')
      : (requestedIntent === 'draft' ? 'draft' : 'publish')
    setRequestError('')
    setSubmittingIntent(intent)

    try {
      const savedJob = isEditing
        ? await updateMyJob(jobId, buildPayload())
        : await createJob(buildPayload())

      if (intent === 'draft' || intent === 'save') {
        if (isEditing) setEditingStatus(savedJob.status)
        setCreatedResult({ job: savedJob, publishError: '' })
      } else {
        try {
          const publishedJob = await publishJob(savedJob._id)
          if (isEditing) setEditingStatus(publishedJob.status)
          setCreatedResult({
            job: { ...savedJob, status: publishedJob.status },
            publishError: '',
          })
        } catch (error) {
          setCreatedResult({
            job: savedJob,
            publishError: getRequestError(
              error,
              'Your job was saved as a draft, but it could not be published.',
            ),
          })
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setRequestError(getRequestError(
        error,
        isEditing
          ? 'We could not save your changes. Please try again.'
          : 'We could not create your job. Please try again.',
      ))
    } finally {
      setSubmittingIntent('')
    }
  }

  async function retryPublish() {
    setRetryingPublish(true)

    try {
      const publishedJob = await publishJob(createdResult.job._id)
      if (isEditing) setEditingStatus(publishedJob.status)
      setCreatedResult((current) => ({
        job: { ...current.job, status: publishedJob.status },
        publishError: '',
      }))
    } catch (error) {
      setCreatedResult((current) => ({
        ...current,
        publishError: getRequestError(error, 'Your draft could not be published. Please try again.'),
      }))
    } finally {
      setRetryingPublish(false)
    }
  }

  function startAnotherJob() {
    setFormData(createEmptyForm())
    setCreatedResult(null)
    setRequestError('')
    setSkills([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (jobLoading) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-12">
        <Card className="mx-auto max-w-xl shadow-sm">
          <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Spinner />
            Loading job details…
          </CardContent>
        </Card>
      </main>
    )
  }

  if (jobLoadError) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-12">
        <Alert variant="destructive" className="mx-auto max-w-xl">
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
          <AlertTitle>Job cannot be edited</AlertTitle>
          <AlertDescription className="grid gap-4">
            <span>{jobLoadError}</span>
            <Button variant="outline" nativeButton={false} render={<Link to="/jobs/mine" />}>
              Back to my jobs
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  if (createdResult) {
    const isPublished = createdResult.job.status === 'open'

    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-12">
        <Card className="mx-auto max-w-2xl shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-7" />
            </div>
            <Badge className="mt-5" variant={isPublished ? 'default' : 'secondary'}>
              {isPublished ? 'Open for proposals' : 'Saved as draft'}
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {isEditing
                ? (isPublished ? 'Your changes are live' : 'Your changes are saved')
                : (isPublished ? 'Your job is live' : 'Your draft is saved')}
            </h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              <span className="font-medium text-foreground">{createdResult.job.title}</span>{' '}
              {isPublished
                ? 'is now visible to freelancers with the latest details.'
                : 'is ready for you to review and publish later.'}
            </p>

            {createdResult.publishError ? (
              <Alert variant="destructive" className="mt-6 text-left">
                <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                <AlertTitle>Publishing did not finish</AlertTitle>
                <AlertDescription>
                  {createdResult.publishError} The job was saved, so retrying will not create a duplicate.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-7 flex w-full flex-col justify-center gap-2 sm:flex-row">
              {createdResult.publishError ? (
                <Button onClick={retryPublish} disabled={retryingPublish}>
                  {retryingPublish ? (
                    <>
                      <Spinner />
                      Publishing…
                    </>
                  ) : (
                    'Try publishing again'
                  )}
                </Button>
              ) : null}
              <Button variant={createdResult.publishError ? 'outline' : 'default'} nativeButton={false} render={<Link to="/jobs/mine" />}>
                View my jobs
              </Button>
              {isEditing ? (
                <Button variant="outline" onClick={() => setCreatedResult(null)}>
                  Continue editing
                </Button>
              ) : (
                <Button variant="outline" onClick={startAnotherJob}>
                  Create another job
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <span aria-hidden="true">/</span>
              <span className="text-foreground">{isEditing ? 'Edit job' : 'Create a job'}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isEditing ? 'Edit your job' : 'Create a job'}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {isEditing
                ? 'Update the scope, expertise, budget, or timing shown to freelancers.'
                : 'Tell freelancers what you need, set expectations, and choose whether to save or publish.'}
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1">
            <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />
            Client workspace
          </Badge>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <Card className="gap-0 py-0 shadow-sm">
            <CardHeader className="border-b bg-card px-5 py-5 sm:px-7">
              <CardTitle className="text-lg">Job details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fields marked with an asterisk are required.
              </p>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit}>
                <section className="grid gap-5 border-b px-5 py-6 sm:px-7">
                  <StepHeading
                    number="1"
                    title="Describe the work"
                    description="Start with a clear outcome so the right people can find you."
                  />

                  <Field>
                    <FieldLabel htmlFor="title">Job title *</FieldLabel>
                    <Input
                      id="title"
                      name="title"
                      className="h-10"
                      placeholder="e.g. Build a bilingual landing page"
                      value={formData.title}
                      onChange={handleChange}
                      autoFocus
                      required
                    />
                    <FieldDescription>Use one sentence that describes the result you need.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description">Description *</FieldLabel>
                    <Textarea
                      id="description"
                      name="description"
                      className="min-h-40 resize-y"
                      placeholder="Describe the scope, deliverables, timeline, and what a successful result looks like."
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                    <FieldDescription>
                      Include enough detail for freelancers to submit an accurate proposal.
                    </FieldDescription>
                  </Field>
                </section>

                <section className="grid gap-5 border-b px-5 py-6 sm:px-7">
                  <StepHeading
                    number="2"
                    title="Choose the expertise"
                    description="Select a category, then add the skills that matter most."
                  />

                  {categoriesError ? (
                    <Alert variant="destructive">
                      <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                      <AlertTitle>Categories are unavailable</AlertTitle>
                      <AlertDescription className="flex flex-wrap items-center gap-2">
                        <span>{categoriesError}</span>
                        <Button type="button" size="sm" variant="outline" onClick={loadCategories}>
                          Try again
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <Field>
                    <FieldLabel htmlFor="category">Category *</FieldLabel>
                    <NativeSelect
                      id="category"
                      name="category"
                      className="w-full [&_[data-slot=native-select]]:h-10"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={categoriesLoading || Boolean(categoriesError)}
                      required
                    >
                      <NativeSelectOption value="">
                        {categoriesLoading ? 'Loading categories…' : 'Select a category'}
                      </NativeSelectOption>
                      {categories.map((category) => (
                        <NativeSelectOption key={category._id} value={category._id}>
                          {category.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>

                  <Field>
                    <FieldLabel>Skills</FieldLabel>
                    {!formData.category ? (
                      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                        Choose a category to see matching skills.
                      </div>
                    ) : skillsLoading ? (
                      <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground" aria-live="polite">
                        <Spinner />
                        Loading skills…
                      </div>
                    ) : skillsError ? (
                      <Alert>
                        <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                        <AlertDescription>{skillsError}</AlertDescription>
                      </Alert>
                    ) : skills.length ? (
                      <div className="flex flex-wrap gap-2" aria-label="Choose skills">
                        {skills.map((skill) => {
                          const selected = formData.skills.includes(skill._id)

                          return (
                            <button
                              key={skill._id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleSkill(skill._id)}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                            >
                              {selected ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5" /> : null}
                              {skill.name}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                        No skills are listed for this category yet.
                      </div>
                    )}
                    <FieldDescription>Skills are optional and help match your post with relevant freelancers.</FieldDescription>
                  </Field>
                </section>

                <section className="grid gap-5 px-5 py-6 sm:px-7">
                  <StepHeading
                    number="3"
                    title="Set budget and timing"
                    description="Give freelancers enough context to decide whether the job is a fit."
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="budgetType">Budget type *</FieldLabel>
                      <NativeSelect
                        id="budgetType"
                        name="budgetType"
                        className="w-full [&_[data-slot=native-select]]:h-10"
                        value={formData.budgetType}
                        onChange={handleChange}
                        required
                      >
                        <NativeSelectOption value="fixed">Fixed price</NativeSelectOption>
                        <NativeSelectOption value="hourly">Hourly rate</NativeSelectOption>
                      </NativeSelect>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="experienceLevel">Experience level</FieldLabel>
                      <NativeSelect
                        id="experienceLevel"
                        name="experienceLevel"
                        className="w-full [&_[data-slot=native-select]]:h-10"
                        value={formData.experienceLevel}
                        onChange={handleChange}
                      >
                        <NativeSelectOption value="">No preference</NativeSelectOption>
                        <NativeSelectOption value="entry">Entry level</NativeSelectOption>
                        <NativeSelectOption value="intermediate">Intermediate</NativeSelectOption>
                        <NativeSelectOption value="expert">Expert</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field data-invalid={Boolean(budgetError) || undefined}>
                      <FieldLabel htmlFor="budgetMin">Minimum budget</FieldLabel>
                      <InputGroup className="h-10">
                        <InputGroupInput
                          id="budgetMin"
                          name="budgetMin"
                          type="number"
                          min="0"
                          step="0.001"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.budgetMin}
                          onChange={handleChange}
                          aria-invalid={Boolean(budgetError)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>BHD</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>

                    <Field data-invalid={Boolean(budgetError) || undefined}>
                      <FieldLabel htmlFor="budgetMax">Maximum budget</FieldLabel>
                      <InputGroup className="h-10">
                        <InputGroupInput
                          id="budgetMax"
                          name="budgetMax"
                          type="number"
                          min="0"
                          step="0.001"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.budgetMax}
                          onChange={handleChange}
                          aria-invalid={Boolean(budgetError)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>BHD</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  </div>
                  {budgetError ? <FieldError>{budgetError}</FieldError> : null}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="duration">Expected duration</FieldLabel>
                      <NativeSelect
                        id="duration"
                        name="duration"
                        className="w-full [&_[data-slot=native-select]]:h-10"
                        value={formData.duration}
                        onChange={handleChange}
                      >
                        <NativeSelectOption value="">Not sure yet</NativeSelectOption>
                        <NativeSelectOption value="Less than 1 month">Less than 1 month</NativeSelectOption>
                        <NativeSelectOption value="1-3 months">1–3 months</NativeSelectOption>
                        <NativeSelectOption value="3-6 months">3–6 months</NativeSelectOption>
                        <NativeSelectOption value="More than 6 months">More than 6 months</NativeSelectOption>
                      </NativeSelect>
                    </Field>

                    <Field data-invalid={Boolean(deadlineError) || undefined}>
                      <FieldLabel htmlFor="deadline">Proposal deadline</FieldLabel>
                      <Input
                        id="deadline"
                        name="deadline"
                        className="h-10"
                        type="date"
                        min={minimumDeadline}
                        value={formData.deadline}
                        onChange={handleChange}
                        aria-invalid={Boolean(deadlineError)}
                      />
                      {deadlineError ? <FieldError>{deadlineError}</FieldError> : null}
                    </Field>
                  </div>
                </section>

                <div className="border-t bg-muted/30 px-5 py-5 sm:px-7">
                  {requestError ? (
                    <Alert variant="destructive" className="mb-4">
                      <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                      <AlertTitle>
                        {isEditing ? 'We could not save this job' : 'We could not create this job'}
                      </AlertTitle>
                      <AlertDescription>{requestError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      {isEditing
                        ? 'Saved changes take effect immediately for an open job.'
                        : 'You can publish now or keep editing later from your dashboard.'}
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      {isEditing ? (
                        <>
                          <Button
                            type="submit"
                            name="intent"
                            value="save"
                            variant={editingStatus === 'draft' ? 'outline' : 'default'}
                            disabled={Boolean(submittingIntent) || isFormInvalid}
                          >
                            {submittingIntent === 'save' ? (
                              <>
                                <Spinner />
                                Saving…
                              </>
                            ) : (
                              'Save changes'
                            )}
                          </Button>
                          {editingStatus === 'draft' ? (
                            <Button
                              type="submit"
                              name="intent"
                              value="publish"
                              disabled={Boolean(submittingIntent) || isFormInvalid}
                            >
                              {submittingIntent === 'publish' ? (
                                <>
                                  <Spinner />
                                  Publishing…
                                </>
                              ) : (
                                'Save and publish'
                              )}
                            </Button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <Button
                            type="submit"
                            name="intent"
                            value="draft"
                            variant="outline"
                            disabled={Boolean(submittingIntent) || isFormInvalid}
                          >
                            {submittingIntent === 'draft' ? (
                              <>
                                <Spinner />
                                Saving…
                              </>
                            ) : (
                              'Save draft'
                            )}
                          </Button>
                          <Button
                            type="submit"
                            name="intent"
                            value="publish"
                            disabled={Boolean(submittingIntent) || isFormInvalid}
                          >
                            {submittingIntent === 'publish' ? (
                              <>
                                <Spinner />
                                Publishing…
                              </>
                            ) : (
                              'Publish job'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <aside className="grid gap-4 lg:sticky lg:top-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your post</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <p className="line-clamp-2 font-medium">
                    {formData.title.trim() || 'Untitled job'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedCategory?.name || 'No category selected'}
                  </p>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{budgetSummary}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {formData.budgetType === 'hourly' ? 'Hourly rate' : 'Fixed price'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formData.duration || 'Duration not set'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formData.deadline ? `Deadline ${formData.deadline}` : 'No proposal deadline'}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedSkillNames.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkillNames.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground ring-primary/20">
              <CardHeader>
                <CardTitle className="text-sm text-primary-foreground">A strong job post</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm text-primary-foreground/85">
                  <li className="flex gap-2">
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                    Defines concrete deliverables and success criteria.
                  </li>
                  <li className="flex gap-2">
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                    Shares a realistic budget and timeline.
                  </li>
                  <li className="flex gap-2">
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                    Avoids private or sensitive information.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CreateJobPage
