import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  StarIcon,
  Wallet01Icon,
  Time04Icon,
  Calendar01Icon,
  UserMultipleIcon,
  Location01Icon,
  Attachment01Icon,
  Briefcase01Icon,
  Shield01Icon,
  Message01Icon,
} from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import SpecList from '@/components/listing/SpecList'
import SimilarGrid from '@/components/listing/SimilarGrid'
import JobCard from '@/components/listing/JobCard'
import useResource from '@/components/listing/useResource'
import PromoBanner from '@/components/landing/PromoBanner'
import Footer from '@/components/landing/Footer'
import { getJob, getSimilarJobs } from '@/services/jobService'
import {
  BUDGET_TYPE_LABELS,
  EXPERIENCE_LABELS,
  formatBudget,
  formatDate,
  timeAgo,
} from '@/lib/format'
import UserLink from '@/components/UserLink'

const TRUST_ROWS = [
  { icon: Shield01Icon, label: 'Milestone escrow on every contract' },
  { icon: Message01Icon, label: 'Message the client before you commit' },
]

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

function JobDetailPage() {
  const { id } = useParams()
  const { data: job, loading, error } = useResource(getJob, id, 'job')
  const { data: similar } = useResource(getSimilarJobs, id, 'jobs')

  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/jobs" />}>Jobs</BreadcrumbLink>
            </BreadcrumbItem>
            {job && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">{job.category?.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {loading && <DetailSkeleton />}

        {error && !loading && (
          <div className="rounded-xl p-8 text-center ring-1 ring-foreground/10">
            <h1 className="font-heading text-lg font-semibold text-foreground">Job unavailable</h1>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" nativeButton={false} render={<Link to="/jobs" />}>
              Back to jobs
            </Button>
          </div>
        )}

        {job && !loading && (
          <>
            <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
              <div className="flex min-w-0 flex-col gap-6">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{job.category?.name}</Badge>
                    <Badge variant="secondary">{BUDGET_TYPE_LABELS[job.budgetType]}</Badge>
                    <span className="text-xs text-muted-foreground">Posted {timeAgo(job.createdAt)}</span>
                  </div>
                  <h1 className="font-heading text-2xl leading-snug font-semibold text-foreground">{job.title}</h1>
                </div>

                <section>
                  <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Job description</h2>
                  <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {job.description.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Skills required</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <Badge key={skill._id} variant="secondary">{skill.name}</Badge>
                    ))}
                  </div>
                </section>

                {job.attachments.length > 0 && (
                  <section>
                    <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Attachments</h2>
                    <ul className="flex flex-col gap-2">
                      {job.attachments.map((attachment) => (
                        <li key={attachment.name}>
                          <a
                            href={attachment.url}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted"
                          >
                            <HugeiconsIcon
                              icon={Attachment01Icon}
                              strokeWidth={2}
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                            <span className="truncate">{attachment.name}</span>
                            {attachment.size && (
                              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                {Math.round(attachment.size / 1024)} KB
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                <div className="flex flex-col gap-4 rounded-xl p-4 ring-1 ring-foreground/10">
                  <div>
                    <p className="text-xs text-muted-foreground">Client budget</p>
                    <p className="font-heading text-2xl font-semibold text-foreground">{formatBudget(job)}</p>
                  </div>

                  <SpecList
                    rows={[
                      { icon: Wallet01Icon, label: 'Budget type', value: BUDGET_TYPE_LABELS[job.budgetType] },
                      {
                        icon: Briefcase01Icon,
                        label: 'Experience',
                        value: EXPERIENCE_LABELS[job.experienceLevel] ?? 'Any',
                      },
                      { icon: Time04Icon, label: 'Duration', value: job.duration ?? '—' },
                      job.deadline && {
                        icon: Calendar01Icon,
                        label: 'Deadline',
                        value: formatDate(job.deadline),
                      },
                      { icon: UserMultipleIcon, label: 'Proposals', value: job.proposalsCount },
                    ]}
                  />

                  <Button size="lg" className="w-full">
                    Submit a proposal
                  </Button>
                </div>

                <div className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10">
                  <p className="text-xs text-muted-foreground">About the client</p>
                  <UserLink user={job.client} showAvatar nameClassName="text-sm font-medium" />
                  <div className="flex items-center gap-1 text-sm">
                    <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-4 text-primary" />
                    <span className="font-medium text-foreground">{job.client?.ratingAvg?.toFixed(1)}</span>
                    <span className="text-muted-foreground">({job.client?.ratingCount} reviews)</span>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
                    {job.client?.city}, {job.client?.country}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link to={`/profile/${job.client?._id}`} />}
                  >
                    View client profile
                  </Button>
                </div>

                <ul className="flex flex-col gap-2 rounded-xl p-3 ring-1 ring-foreground/10">
                  {TRUST_ROWS.map((row) => (
                    <li key={row.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={row.icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
                      {row.label}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>

            <SimilarGrid
              title="Similar jobs"
              items={similar ?? []}
              renderItem={(item) => <JobCard key={item._id} job={item} />}
              moreTo="/jobs"
              moreLabel="See more"
            />
          </>
        )}
      </main>

      <PromoBanner
        eyebrow="For Clients"
        title="Post a job and get proposals within 24 hours"
        description="Describe what you need and let qualified freelancers come to you."
        actionLabel="Post a Job"
        actionTo="/sign-up"
      />
      <Footer />
    </div>
  )
}

export default JobDetailPage
