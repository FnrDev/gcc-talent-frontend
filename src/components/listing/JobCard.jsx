import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Location01Icon, UserMultipleIcon, Time04Icon } from '@hugeicons/core-free-icons'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { categoryImage } from '@/lib/placeholders'
import {
  BUDGET_TYPE_LABELS,
  EXPERIENCE_LABELS,
  formatBudget,
  timeAgo,
} from '@/lib/format'
import UserLink from '@/components/UserLink'

// A job posting carries no imagery of its own, so the preview uses artwork
// derived from its category and then leads with the numbers a freelancer
// actually decides on: budget, level, and competition. Like GigCard, the title
// link is stretched across the card so the whole surface is clickable.
function JobCard({ job }) {
  return (
    <Card className="group/job relative gap-0 overflow-hidden py-0">
      <div className="relative aspect-16/9 overflow-hidden bg-muted">
        <img
          src={categoryImage(job.category?.slug)}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover/job:scale-105"
        />
        <Badge variant="outline" className="absolute top-2 left-2 bg-background/90 shadow-sm">
          {job.category?.name}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/jobs/${job._id}`}
            className="line-clamp-2 font-heading text-base leading-snug font-medium text-foreground after:absolute after:inset-0 hover:text-primary focus-visible:outline-none group-focus-within/job:underline"
          >
            {job.title}
          </Link>
          <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{timeAgo(job.createdAt)}</span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 3).map((skill) => (
            <Badge key={skill._id} variant="secondary">{skill.name}</Badge>
          ))}
          {job.skills.length > 3 && <Badge variant="ghost">+{job.skills.length - 3}</Badge>}
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1 text-xs">
          <div className="col-span-2 flex items-baseline gap-1.5">
            <dt className="sr-only">Budget</dt>
            <dd className="text-sm font-semibold text-foreground">{formatBudget(job)}</dd>
            <span className="text-muted-foreground">· {BUDGET_TYPE_LABELS[job.budgetType]}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HugeiconsIcon icon={Time04Icon} strokeWidth={2} className="size-3.5" />
            <dt className="sr-only">Experience level</dt>
            <dd>{EXPERIENCE_LABELS[job.experienceLevel] ?? 'Any level'}</dd>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} className="size-3.5" />
            <dt className="sr-only">Proposals</dt>
            <dd>{job.proposalsCount} proposals</dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <UserLink user={job.client} showAvatar raised nameClassName="text-sm font-medium" />
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" />
          {job.client?.country}
        </span>
      </CardFooter>
    </Card>
  )
}

export default JobCard
