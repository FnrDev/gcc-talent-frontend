import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Award01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  DashboardSquare02Icon,
  Edit02Icon,
  Globe02Icon,
  Money01Icon,
  StarIcon,
  TranslateIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'

import Footer from '@/components/landing/Footer'
import JobCard from '@/components/listing/JobCard'
import ServiceCard from '@/components/listing/ServiceCard'
import SpecList from '@/components/listing/SpecList'
import useResource from '@/components/listing/useResource'
import UserLink from '@/components/UserLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatDate, initials, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getPublicProfile } from '@/services/profileService'

const AVAILABILITY_LABELS = {
  full_time: 'Available full time',
  part_time: 'Available part time',
  unavailable: 'Not currently available',
}

const COMPANY_SIZE_LABELS = {
  solo: 'Self-employed',
  '2_10': '2–10 employees',
  '11_50': '11–50 employees',
  '51_200': '51–200 employees',
  '201_500': '201–500 employees',
  '501_plus': '501+ employees',
}

function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''

  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.toString()
      : ''
  } catch {
    return ''
  }
}

function Stars({ rating, className }) {
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0

  return (
    <span
      className={cn('flex items-center gap-0.5', className)}
      aria-label={`${safeRating.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <HugeiconsIcon
          key={step}
          icon={StarIcon}
          strokeWidth={2}
          className={cn(
            'size-3.5',
            step <= Math.round(safeRating) ? 'text-primary' : 'text-muted-foreground/35',
          )}
        />
      ))}
    </span>
  )
}

function ProfileSkeleton() {
  return (
    <main aria-label="Loading profile">
      <Skeleton className="h-48 w-full rounded-none sm:h-56" />
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Skeleton className="-mt-14 h-52 rounded-xl" />
        <Skeleton className="mt-6 h-72 rounded-xl" />
      </div>
    </main>
  )
}

function CollapsibleBio({ text }) {
  const [expanded, setExpanded] = useState(false)
  const safeText = typeof text === 'string' ? text.trim() : ''
  const paragraphs = safeText ? safeText.split(/\n\s*\n/) : []
  const canCollapse = safeText.length > 240 || paragraphs.length > 2

  if (!safeText) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        This member has not added an introduction yet.
      </p>
    )
  }

  return (
    <div>
      <div
        className={cn(
          'space-y-3 text-sm leading-relaxed text-muted-foreground',
          canCollapse && !expanded && 'line-clamp-3',
        )}
      >
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
      {canCollapse ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-1 px-0"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </Button>
      ) : null}
    </div>
  )
}

function EmptyTab({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function ProfilePage() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const { data: payload, loading, error } = useResource(getPublicProfile, id)

  if (loading) return <ProfileSkeleton />

  const user = payload?.user
  const profile = payload?.profile

  if (error || !user || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold text-foreground">Profile unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error || 'This profile could not be found.'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          nativeButton={false}
          render={<Link to="/services" />}
        >
          Back to marketplace
        </Button>
      </main>
    )
  }

  const isFreelancer = user.role === 'freelancer'
  const isCompanyClient = !isFreelancer && Boolean(profile.isCompany)
  const isOwner = currentUser?._id === user._id
  const listings = Array.isArray(payload.listings) ? payload.listings : []
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : []
  const stats = payload.stats || {}
  const languages = Array.isArray(profile.languages) ? profile.languages : []
  const skills = Array.isArray(profile.skills) ? profile.skills : []
  const portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : []
  const displayName = isCompanyClient && profile.companyName ? profile.companyName : user.name
  const personName = isCompanyClient && profile.companyName ? user.name : null
  const location = [user.city, user.country].filter(Boolean).join(', ')
  const rating = Number(user.ratingAvg || 0)
  const reviewCount = Number(stats.reviewCount ?? user.ratingCount ?? 0)
  const activityCount = Number(stats.completed || 0)
  const about = isFreelancer ? profile.bio : profile.description
  const companySizeLabel = COMPANY_SIZE_LABELS[profile.companySize] || ''
  const headline = isFreelancer
    ? profile.headline
    : isCompanyClient
      ? [profile.industry, companySizeLabel].filter(Boolean).join(' · ') || 'Hiring company'
      : 'Marketplace client'
  const profileTypeLabel = isFreelancer
    ? 'Freelancer'
    : isCompanyClient
      ? 'Company client'
      : 'Client'
  const companyUrl = safeHttpUrl(profile.website)

  const aboutRows = isFreelancer
    ? [
        Number.isFinite(profile.hourlyRate) && {
          icon: Money01Icon,
          label: 'Hourly rate',
          value: formatCurrency(profile.hourlyRate, profile.currency),
        },
        profile.availability && {
          icon: Clock01Icon,
          label: 'Availability',
          value: AVAILABILITY_LABELS[profile.availability] || profile.availability,
        },
        languages.length > 0 && {
          icon: TranslateIcon,
          label: 'Languages',
          value: languages.map((language) => language.name).filter(Boolean).join(', '),
        },
        {
          icon: Award01Icon,
          label: 'Completed orders',
          value: activityCount.toLocaleString(),
        },
      ]
    : [
        Number.isFinite(profile.totalSpent) && {
          icon: Money01Icon,
          label: 'Total spent',
          value: formatCurrency(profile.totalSpent),
        },
        {
          icon: Award01Icon,
          label: 'Jobs posted',
          value: activityCount.toLocaleString(),
        },
        Number.isFinite(Number(stats.hireRate)) && {
          icon: CheckmarkBadge01Icon,
          label: 'Hire rate',
          value: `${Number(stats.hireRate)}%`,
        },
        isCompanyClient && profile.industry && {
          icon: DashboardSquare02Icon,
          label: 'Industry',
          value: profile.industry,
        },
        isCompanyClient && profile.companySize && {
          icon: UserIcon,
          label: 'Company size',
          value: COMPANY_SIZE_LABELS[profile.companySize] || profile.companySize,
        },
        isCompanyClient
          && profile.foundedYear !== null
          && profile.foundedYear !== ''
          && Number.isInteger(Number(profile.foundedYear)) && {
          icon: Clock01Icon,
          label: 'Founded',
          value: Number(profile.foundedYear).toString(),
        },
        profile.website && {
          icon: Globe02Icon,
          label: isCompanyClient ? 'Company URL' : 'Website',
          value: companyUrl ? (
            <a
              href={companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block max-w-40 truncate align-bottom text-primary hover:underline"
              title={profile.website}
            >
              {profile.website}
            </a>
          ) : profile.website,
        },
      ]

  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <div className="relative h-44 overflow-hidden bg-primary/10 sm:h-56">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/35 via-primary/10 to-background" />
        <div className="absolute -top-24 right-[8%] size-72 rounded-full border border-primary/20 bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-28 left-[12%] size-64 rounded-full border border-primary/15 bg-background/40 blur-xl" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/35 to-transparent" />
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12">
        <section className="relative -mt-14 rounded-xl bg-card p-4 pt-16 text-center shadow-sm ring-1 ring-foreground/10 sm:p-6 sm:pt-16">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <Avatar className="size-28 bg-card ring-4 ring-card shadow-sm">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-2xl">{initials(displayName)}</AvatarFallback>
            </Avatar>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary" className="h-7 px-3">
              {activityCount.toLocaleString()} {isFreelancer ? 'orders completed' : 'jobs posted'}
            </Badge>
            {reviewCount > 0 ? (
              <Badge variant="secondary" className="h-7 bg-primary/10 px-3 text-primary">
                {Math.round((rating / 5) * 100)}% rating
              </Badge>
            ) : (
              <Badge variant="outline" className="h-7 px-3">New profile</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline">{profileTypeLabel}</Badge>
            {isOwner ? <Badge variant="secondary">Your public profile</Badge> : null}
          </div>

          {isOwner || (isCompanyClient && companyUrl) ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {isOwner ? (
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link to="/profile/edit" />}
                >
                  <HugeiconsIcon icon={Edit02Icon} />
                  Edit profile
                </Button>
              ) : null}
              {isCompanyClient && companyUrl ? (
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<a href={companyUrl} target="_blank" rel="noopener noreferrer" />}
                >
                  <HugeiconsIcon icon={Globe02Icon} />
                  Visit company website
                </Button>
              ) : null}
            </div>
          ) : null}

          <h1 className="mt-3 flex items-center justify-center gap-1.5 font-heading text-2xl font-semibold text-foreground">
            {displayName}
            {user.isEmailVerified ? (
              <HugeiconsIcon
                icon={CheckmarkBadge01Icon}
                strokeWidth={2}
                className="size-5 text-primary"
                aria-label="Email verified"
              />
            ) : null}
          </h1>

          {personName ? <p className="mt-1 text-sm text-muted-foreground">Managed by {personName}</p> : null}
          {headline ? <p className="mt-1 text-sm text-muted-foreground">{headline}</p> : null}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            <Stars rating={rating} />
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
            {location ? (
              <>
                <span className="text-muted-foreground/40" aria-hidden="true">•</span>
                <span className="text-muted-foreground">{location}</span>
              </>
            ) : null}
          </div>
        </section>

        <section className="mt-6">
          <Tabs defaultValue="about">
            <TabsList className="grid h-auto w-full grid-cols-3">
              <TabsTrigger value="about">
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} data-icon="inline-start" />
                About
              </TabsTrigger>
              <TabsTrigger value="listings">
                <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2} data-icon="inline-start" />
                {isFreelancer ? 'Services' : 'Jobs'}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <HugeiconsIcon icon={StarIcon} strokeWidth={2} data-icon="inline-start" />
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <div className="grid gap-6 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    About {displayName}
                  </h2>
                  <div className="mt-3"><CollapsibleBio text={about} /></div>

                  {skills.length > 0 ? (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-foreground">Skills</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {skills.map((skill) => (
                          <Badge key={skill._id || skill.name} variant="secondary">{skill.name}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isFreelancer && portfolio.length > 0 ? (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-foreground">Portfolio</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {portfolio.map((item) => (
                          <article key={item._id || item.title} className="overflow-hidden rounded-lg border bg-background">
                            {safeHttpUrl(item.imageUrl) ? (
                              <img
                                src={safeHttpUrl(item.imageUrl)}
                                alt={item.title ? `${item.title} portfolio preview` : 'Portfolio preview'}
                                className="aspect-video w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                            <div className="p-3">
                              <p className="text-sm font-medium text-foreground">{item.title || 'Project'}</p>
                              {item.description ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                              ) : null}
                              {safeHttpUrl(item.link) ? (
                                <a
                                  href={safeHttpUrl(item.link)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
                                >
                                  View project
                                </a>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <p className="mt-6 text-xs text-muted-foreground">
                    Member since {formatDate(user.createdAt || profile.createdAt)}
                  </p>
                </div>

                <SpecList className="h-fit" rows={aboutRows} />
              </div>
            </TabsContent>

            <TabsContent value="listings">
              {listings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((item) => (
                    isFreelancer
                      ? <ServiceCard key={item._id} service={item} />
                      : <JobCard key={item._id} job={item} />
                  ))}
                </div>
              ) : (
                <EmptyTab
                  title={isFreelancer ? 'No active services' : 'No open jobs'}
                  description={isFreelancer
                    ? 'This freelancer does not have an active service package right now.'
                    : 'This client does not have an open job right now.'}
                />
              )}
            </TabsContent>

            <TabsContent value="reviews">
              {reviews.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {reviews.map((review) => (
                    <li key={review._id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                      <div className="flex flex-wrap items-center gap-2">
                        <UserLink
                          user={review.reviewer}
                          showAvatar
                          nameClassName="text-sm font-medium text-foreground"
                        />
                        <span className="ml-auto flex shrink-0 items-center gap-2">
                          <Stars rating={review.rating} />
                          <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
                        </span>
                      </div>
                      {review.contract?.title ? (
                        <p className="mt-3 text-xs font-medium text-muted-foreground">
                          For {review.contract.title}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {review.comment || 'Rating submitted without a written review.'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyTab title="No reviews yet" description="Completed-work feedback will appear here." />
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ProfilePage
