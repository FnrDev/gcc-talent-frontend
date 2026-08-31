import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Delete02Icon,
  Edit02Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import {
  createPortfolioItem,
  deletePortfolioItem,
  getMyProfile,
  getProfileSkills,
  updateMyProfile,
  updatePortfolioItem,
  uploadPortfolioImage,
} from '@/services/profileService'

const EMPTY_PORTFOLIO = {
  id: '',
  title: '',
  description: '',
  imageUrl: '',
  link: '',
  file: null,
}

function getRequestError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.err || fallback
}

function normalizeForm(user, profile) {
  return {
    country: user?.country || '',
    city: user?.city || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    skills: Array.isArray(profile?.skills)
      ? profile.skills.map((skill) => (typeof skill === 'object' ? skill._id : skill)).filter(Boolean)
      : [],
    hourlyRate: profile?.hourlyRate ?? '',
    currency: profile?.currency || 'BHD',
    availability: profile?.availability || 'full_time',
    languages: Array.isArray(profile?.languages)
      ? profile.languages.map((language) => ({
          name: language?.name || '',
          level: language?.level || '',
        }))
      : [],
    companyName: profile?.companyName || '',
    isCompany: Boolean(profile?.isCompany),
    description: profile?.description || '',
    website: profile?.website || '',
    portfolio: Array.isArray(profile?.portfolio) ? profile.portfolio : [],
  }
}

function ProfileEditSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10" aria-label="Loading profile editor">
      <Skeleton className="h-10 w-64" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-[38rem] rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </main>
  )
}

function ProfileEditPage() {
  const { user: sessionUser, setUser: setSessionUser } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [form, setForm] = useState(null)
  const [skills, setSkills] = useState([])
  const [skillsError, setSkillsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [portfolioForm, setPortfolioForm] = useState(EMPTY_PORTFOLIO)
  const [portfolioBusy, setPortfolioBusy] = useState(false)
  const [portfolioError, setPortfolioError] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    setSkillsError('')

    try {
      const payload = await getMyProfile()
      let availableSkills = []
      if (payload.user?.role === 'freelancer') {
        try {
          availableSkills = await getProfileSkills()
        } catch (error) {
          setSkillsError(getRequestError(error, 'Skills are unavailable right now. Your other profile fields can still be updated.'))
        }
      }
      setProfileUser(payload.user)
      setForm(normalizeForm(payload.user, payload.profile))
      setSkills(availableSkills)
    } catch (error) {
      setLoadError(getRequestError(error, 'We could not load your profile. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loading the authenticated profile intentionally drives this page's remote state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile()
  }, [loadProfile])

  if (loading) return <ProfileEditSkeleton />

  if (loadError || !profileUser || !form) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Profile editor unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loadError || 'Your profile could not be loaded.'}</p>
        <Button className="mt-6" variant="outline" onClick={loadProfile}>Try again</Button>
      </main>
    )
  }

  const isFreelancer = profileUser.role === 'freelancer'

  function updateField(event) {
    const { name, value } = event.target
    setSuccess('')
    setRequestError('')
    setForm((current) => ({ ...current, [name]: value }))
  }

  function toggleSkill(skillId) {
    setForm((current) => ({
      ...current,
      skills: current.skills.includes(skillId)
        ? current.skills.filter((id) => id !== skillId)
        : [...current.skills, skillId],
    }))
  }

  function addLanguage() {
    setForm((current) => ({
      ...current,
      languages: [...current.languages, { name: '', level: '' }],
    }))
  }

  function updateLanguage(index, field, value) {
    setForm((current) => ({
      ...current,
      languages: current.languages.map((language, languageIndex) => (
        languageIndex === index ? { ...language, [field]: value } : language
      )),
    }))
  }

  function removeLanguage(index) {
    setForm((current) => ({
      ...current,
      languages: current.languages.filter((_, languageIndex) => languageIndex !== index),
    }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setRequestError('')
    setSuccess('')

    const common = {
      country: form.country.trim(),
      city: form.city.trim(),
    }
    const payload = isFreelancer
      ? {
          ...common,
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          skills: form.skills,
          hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate),
          currency: form.currency,
          availability: form.availability,
          languages: form.languages
            .filter((language) => language.name.trim())
            .map((language) => ({
              name: language.name.trim(),
              level: language.level.trim(),
            })),
        }
      : {
          ...common,
          companyName: form.companyName.trim(),
          isCompany: form.isCompany,
          description: form.description.trim(),
          website: form.website.trim(),
        }

    try {
      const result = await updateMyProfile(payload)
      setProfileUser((current) => ({ ...current, ...result.user }))
      setSessionUser((current) => current
        ? { ...current, country: result.user?.country, city: result.user?.city }
        : current)
      setForm((current) => ({
        ...current,
        ...normalizeForm(result.user, result.profile),
        portfolio: current.portfolio,
      }))
      setSuccess('Your profile has been updated.')
    } catch (error) {
      setRequestError(getRequestError(error, 'We could not save your profile. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  function beginPortfolioEdit(item) {
    setPortfolioError('')
    setPortfolioForm({
      id: item._id,
      title: item.title || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      link: item.link || '',
      file: null,
    })
  }

  function resetPortfolioForm() {
    setPortfolioForm(EMPTY_PORTFOLIO)
    setPortfolioError('')
  }

  async function handlePortfolioSave(event) {
    event.preventDefault()
    if (!portfolioForm.title.trim()) {
      setPortfolioError('Add a title for this portfolio item.')
      return
    }

    setPortfolioBusy(true)
    setPortfolioError('')

    try {
      let imageUrl = portfolioForm.imageUrl.trim()
      if (portfolioForm.file) {
        const attachment = await uploadPortfolioImage(portfolioForm.file)
        imageUrl = attachment.url
      }

      const payload = {
        title: portfolioForm.title.trim(),
        description: portfolioForm.description.trim(),
        imageUrl,
        link: portfolioForm.link.trim(),
      }
      const savedItem = portfolioForm.id
        ? await updatePortfolioItem(portfolioForm.id, payload)
        : await createPortfolioItem(payload)

      setForm((current) => ({
        ...current,
        portfolio: portfolioForm.id
          ? current.portfolio.map((item) => item._id === savedItem._id ? savedItem : item)
          : [...current.portfolio, savedItem],
      }))
      resetPortfolioForm()
    } catch (error) {
      setPortfolioError(getRequestError(error, 'We could not save this portfolio item.'))
    } finally {
      setPortfolioBusy(false)
    }
  }

  async function handlePortfolioDelete(itemId) {
    if (!window.confirm('Delete this portfolio item? This cannot be undone.')) return

    setPortfolioBusy(true)
    setPortfolioError('')
    try {
      await deletePortfolioItem(itemId)
      setForm((current) => ({
        ...current,
        portfolio: current.portfolio.filter((item) => item._id !== itemId),
      }))
      if (portfolioForm.id === itemId) resetPortfolioForm()
    } catch (error) {
      setPortfolioError(getRequestError(error, 'We could not delete this portfolio item.'))
    } finally {
      setPortfolioBusy(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <Link
          to={`/profile/${profileUser._id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          View public profile
        </Link>

        <header className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">{profileUser.role}</Badge>
            <span className="text-sm text-muted-foreground">Signed in as {sessionUser?.name || profileUser.name}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Edit your profile</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Keep the information clients and freelancers use to decide whether you are the right fit.
          </p>
        </header>

        <form className="mt-8 grid gap-6" onSubmit={handleSave}>
          {success ? (
            <Alert className="border-primary/20 bg-primary/5">
              <AlertTitle>Profile saved</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}
          {requestError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not save profile</AlertTitle>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                <Input id="country" name="country" value={form.country} onChange={updateField} maxLength={100} />
              </Field>
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" name="city" value={form.city} onChange={updateField} maxLength={100} />
              </Field>
            </CardContent>
          </Card>

          {isFreelancer ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Professional details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <Field>
                    <FieldLabel htmlFor="headline">Headline</FieldLabel>
                    <Input id="headline" name="headline" value={form.headline} onChange={updateField} placeholder="Product designer for growing GCC teams" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="bio">Bio</FieldLabel>
                    <Textarea id="bio" name="bio" className="min-h-36" value={form.bio} onChange={updateField} placeholder="Describe your experience, approach, and the work you do best." />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="hourlyRate">Hourly rate</FieldLabel>
                      <Input id="hourlyRate" name="hourlyRate" type="number" min="0" step="0.001" value={form.hourlyRate} onChange={updateField} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="currency">Currency</FieldLabel>
                      <NativeSelect id="currency" name="currency" value={form.currency} onChange={updateField}>
                        {['BHD', 'SAR', 'AED', 'USD'].map((currency) => <NativeSelectOption key={currency} value={currency}>{currency}</NativeSelectOption>)}
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="availability">Availability</FieldLabel>
                      <NativeSelect id="availability" name="availability" value={form.availability} onChange={updateField}>
                        <NativeSelectOption value="full_time">Full time</NativeSelectOption>
                        <NativeSelectOption value="part_time">Part time</NativeSelectOption>
                        <NativeSelectOption value="unavailable">Unavailable</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldDescription>Select skills from the marketplace master list.</FieldDescription>
                  {skillsError ? (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>Skills unavailable</AlertTitle>
                      <AlertDescription>{skillsError}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {skills.map((skill) => (
                      <label key={skill._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                        <Checkbox checked={form.skills.includes(skill._id)} onCheckedChange={() => toggleSkill(skill._id)} />
                        <span>{skill.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Languages</CardTitle>
                  <Button type="button" size="sm" variant="outline" onClick={addLanguage}>
                    <HugeiconsIcon icon={PlusSignIcon} /> Add language
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {form.languages.length === 0 ? <p className="text-sm text-muted-foreground">No languages added yet.</p> : null}
                  {form.languages.map((language, index) => (
                    <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
                      <Input aria-label="Language" placeholder="Arabic" value={language.name} onChange={(event) => updateLanguage(index, 'name', event.target.value)} />
                      <Input aria-label="Proficiency" placeholder="Native, fluent…" value={language.level} onChange={(event) => updateLanguage(index, 'level', event.target.value)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLanguage(index)} aria-label="Remove language">
                        <HugeiconsIcon icon={Delete02Icon} />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Client details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <span>
                    <span className="block text-sm font-medium">Company profile</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">Turn this off if you hire as an individual.</span>
                  </span>
                  <Switch checked={form.isCompany} onCheckedChange={(checked) => setForm((current) => ({ ...current, isCompany: checked }))} />
                </label>
                <Field>
                  <FieldLabel htmlFor="companyName">{form.isCompany ? 'Company name' : 'Display name (optional)'}</FieldLabel>
                  <Input id="companyName" name="companyName" value={form.companyName} onChange={updateField} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">About you</FieldLabel>
                  <Textarea id="description" name="description" className="min-h-36" value={form.description} onChange={updateField} placeholder="Describe the company, team, or kind of work you hire for." />
                </Field>
                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <Input id="website" name="website" type="url" value={form.website} onChange={updateField} placeholder="https://example.com" />
                </Field>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? <><Spinner /> Saving…</> : 'Save profile'}
            </Button>
          </div>
        </form>

        {isFreelancer ? (
          <section className="mt-10" aria-labelledby="portfolio-heading">
            <div>
              <h2 id="portfolio-heading" className="text-2xl font-semibold">Portfolio</h2>
              <p className="mt-1 text-sm text-muted-foreground">Add up to 20 examples of your work.</p>
            </div>

            {portfolioError ? (
              <Alert variant="destructive" className="mt-5">
                <AlertTitle>Portfolio action failed</AlertTitle>
                <AlertDescription>{portfolioError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="grid gap-4 sm:grid-cols-2">
                {form.portfolio.length === 0 ? (
                  <Card className="border-dashed sm:col-span-2">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">Your portfolio is empty.</CardContent>
                  </Card>
                ) : null}
                {form.portfolio.map((item) => (
                  <Card key={item._id} className="overflow-hidden py-0">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="aspect-video w-full object-cover" /> : null}
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
                      <div className="mt-4 flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => beginPortfolioEdit(item)} disabled={portfolioBusy}>
                          <HugeiconsIcon icon={Edit02Icon} /> Edit
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => handlePortfolioDelete(item._id)} disabled={portfolioBusy}>
                          <HugeiconsIcon icon={Delete02Icon} /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="lg:sticky lg:top-20">
                <CardHeader>
                  <CardTitle>{portfolioForm.id ? 'Edit portfolio item' : 'Add portfolio item'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4" onSubmit={handlePortfolioSave}>
                    <Field>
                      <FieldLabel htmlFor="portfolioTitle">Title</FieldLabel>
                      <Input id="portfolioTitle" value={portfolioForm.title} onChange={(event) => setPortfolioForm((current) => ({ ...current, title: event.target.value }))} required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="portfolioDescription">Description</FieldLabel>
                      <Textarea id="portfolioDescription" value={portfolioForm.description} onChange={(event) => setPortfolioForm((current) => ({ ...current, description: event.target.value }))} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="portfolioLink">Project URL</FieldLabel>
                      <Input id="portfolioLink" type="url" value={portfolioForm.link} onChange={(event) => setPortfolioForm((current) => ({ ...current, link: event.target.value }))} placeholder="https://…" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="portfolioImage">Image</FieldLabel>
                      <Input id="portfolioImage" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPortfolioForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
                      <FieldDescription>JPEG, PNG, WebP, or GIF up to 10 MB.</FieldDescription>
                    </Field>
                    <Button type="submit" disabled={portfolioBusy}>
                      {portfolioBusy ? <><Spinner /> Saving…</> : portfolioForm.id ? 'Save item' : 'Add item'}
                    </Button>
                    {portfolioForm.id ? <Button type="button" variant="ghost" onClick={resetPortfolioForm}>Cancel edit</Button> : null}
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default ProfileEditPage
