import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkBadge01Icon,
  PencilEdit01Icon,
  UserIcon,
  DashboardSquare02Icon,
  StarIcon,
  Clock01Icon,
  Money01Icon,
  TranslateIcon,
  Globe02Icon,
  Award01Icon,
} from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import GigCard from '@/components/listing/GigCard'
import JobCard from '@/components/listing/JobCard'
import SpecList from '@/components/listing/SpecList'
import useResource from '@/components/listing/useResource'
import Footer from '@/components/landing/Footer'
import { useAuth } from '../context/AuthContext'
import { getPublicProfile } from '@/services/profileService'
import { formatCurrency, formatDate, initials, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import UserLink from '@/components/UserLink'

const AVAILABILITY_LABELS = {
  full_time: 'Available full time',
  part_time: 'Available part time',
  unavailable: 'Not currently available',
}

function Stars({ rating, className }) {
  return (
    <span className={cn('flex items-center gap-0.5', className)} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <HugeiconsIcon
          key={step}
          icon={StarIcon}
          strokeWidth={2}
          className={cn('size-3.5', step <= Math.round(rating) ? 'text-primary' : 'text-muted-foreground/40')}
        />
      ))}
    </span>
  )
}

function ProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="mx-auto max-w-5xl px-4">
        <Skeleton className="-mt-16 h-48 rounded-xl" />
        <Skeleton className="mt-6 h-64 rounded-xl" />
      </div>
    </div>
  )
}

// The long bio is collapsed behind a "Read more" the way the reference layout
// shows it, rather than pushing the tabs below the fold.
function CollapsibleBio({ text }) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = text.split('\n\n')

  return (
    <div>
      <div className={cn('space-y-3 text-sm leading-relaxed text-muted-foreground', !expanded && 'line-clamp-2')}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {paragraphs.length > 1 && (
        <Button variant="link" size="sm" className="mt-1" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Show less' : 'Read more'}
        </Button>
      )}
    </div>
  )
}

function ProfilePage() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const { data: payload, loading, error } = useResource(getPublicProfile, id)

  const data = payload?.user
  const full = payload?.profile
  const { listings, reviews, stats } = payload ?? {}

  const isOwner = Boolean(currentUser && data && currentUser._id === data._id)
  const isFreelancer = full?.role === 'freelancer'

  if (loading) return <ProfileSkeleton />

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold text-foreground">Profile unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error ?? 'This profile could not be found.'}</p>
        <Button variant="outline" className="mt-4" nativeButton={false} render={<Link to="/services" />}>
          Back to services
        </Button>
      </div>
    )
  }

  const displayName = full?.companyName ?? data.name

  return (
    <div className="flex min-h-svh flex-col">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden bg-muted sm:h-56">
        <img src={full?.coverUrl} alt="" className="size-full object-cover" />
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/90 shadow-sm"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} data-icon="inline-start" />
            Edit cover
          </Button>
        )}
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12">
        {/* Identity card, overlapping the cover */}
        <section className="relative -mt-14 rounded-xl bg-card p-4 pt-16 text-center ring-1 ring-foreground/10 sm:p-6 sm:pt-16">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="relative">
              <Avatar className="size-28 ring-4 ring-card">
                {data.avatarUrl && <AvatarImage src={data.avatarUrl} alt="" />}
                <AvatarFallback className="text-2xl">{initials(displayName)}</AvatarFallback>
              </Avatar>
              {isOwner && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Edit profile picture"
                  className="absolute right-0 bottom-1 bg-background shadow-sm"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} />
                </Button>
              )}
            </div>
          </div>

          {/* Stat pills sit either side of the name, as in the reference */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <Badge variant="secondary" className="h-7 px-3">
              {stats?.completed?.toLocaleString()} {isFreelancer ? 'orders completed' : 'jobs posted'}
            </Badge>
            <Badge variant="secondary" className="h-7 bg-primary/10 px-3 text-primary">
              {stats?.ratingPercent}% rating
            </Badge>
          </div>

          <h1 className="flex items-center justify-center gap-1.5 font-heading text-xl font-semibold text-foreground">
            {displayName}
            {full?.isVerified && (
              <HugeiconsIcon
                icon={CheckmarkBadge01Icon}
                strokeWidth={2}
                className="size-5 text-primary"
                aria-label="Verified"
              />
            )}
          </h1>

          {full?.headline && <p className="mt-1 text-sm text-muted-foreground">{full.headline}</p>}

          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
            <Stars rating={data.ratingAvg} />
            <span className="font-medium text-foreground">{data.ratingAvg.toFixed(1)}</span>
            <span className="text-muted-foreground">({data.ratingCount} reviews)</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">{data.city}, {data.country}</span>
          </div>

          {!isOwner && (
            <div className="mt-4 flex justify-center gap-2">
              <Button>Contact {isFreelancer ? 'seller' : 'client'}</Button>
              {isFreelancer && (
                <Button variant="outline" nativeButton={false} render={<Link to="/services" />}>
                  See services
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Tabs */}
        <section className="mt-6">
          <Tabs defaultValue="about">
            <TabsList className="w-full">
              <TabsTrigger value="about">
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} data-icon="inline-start" />
                About
              </TabsTrigger>
              <TabsTrigger value="listings">
                <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2} data-icon="inline-start" />
                {isFreelancer ? 'Active services' : 'Open jobs'}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <HugeiconsIcon icon={StarIcon} strokeWidth={2} data-icon="inline-start" />
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <div className="grid gap-6 rounded-xl p-4 ring-1 ring-foreground/10 sm:p-6 lg:grid-cols-[1fr_18rem]">
                <div className="min-w-0">
                  <CollapsibleBio text={full?.bio ?? ''} />
                  <p className="mt-6 text-xs text-muted-foreground">
                    Member since {formatDate(full?.memberSince)}
                  </p>
                </div>

                <SpecList
                  className="h-fit"
                  rows={[
                    isFreelancer && {
                      icon: Money01Icon,
                      label: 'Hourly rate',
                      value: formatCurrency(full.hourlyRate, full.currency),
                    },
                    isFreelancer && {
                      icon: Clock01Icon,
                      label: 'Availability',
                      value: AVAILABILITY_LABELS[full.availability],
                    },
                    isFreelancer && {
                      icon: TranslateIcon,
                      label: 'Languages',
                      value: full.languages.map((language) => language.name).join(', '),
                    },
                    isFreelancer && {
                      icon: Clock01Icon,
                      label: 'Responds',
                      value: full.responseTime,
                    },
                    !isFreelancer && {
                      icon: Money01Icon,
                      label: 'Total spent',
                      value: formatCurrency(full.totalSpent),
                    },
                    !isFreelancer && {
                      icon: Award01Icon,
                      label: 'Hire rate',
                      value: `${full.hireRate}%`,
                    },
                    !isFreelancer && full.website && {
                      icon: Globe02Icon,
                      label: 'Website',
                      value: full.website,
                    },
                  ]}
                />
              </div>
            </TabsContent>

            <TabsContent value="listings">
              {listings?.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((item) =>
                    isFreelancer ? (
                      <GigCard key={item._id} gig={item} />
                    ) : (
                      <JobCard key={item._id} job={item} />
                    ),
                  )}
                </div>
              ) : (
                <p className="rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
                  Nothing listed right now.
                </p>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <ul className="flex flex-col gap-3">
                {reviews?.map((review) => (
                  <li key={review._id} className="rounded-xl p-4 ring-1 ring-foreground/10">
                    <div className="flex items-center gap-2">
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
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ProfilePage
