import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkBadge01Icon,
  Search01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'

import { Card } from '@/components/ui/card'

const STEPS = [
  {
    icon: Search01Icon,
    number: '01',
    title: 'Find the right match',
    description: 'Search services, open jobs, or freelancer profiles and compare the details that matter.',
  },
  {
    icon: Shield01Icon,
    number: '02',
    title: 'Agree on clear terms',
    description: 'Choose a package or proposal, confirm the scope, and protect funded work with milestones.',
  },
  {
    icon: CheckmarkBadge01Icon,
    number: '03',
    title: 'Deliver with confidence',
    description: 'Keep progress in one place, approve completed work, and leave useful marketplace feedback.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10">
      <div className="mx-auto mb-7 max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">How it works</p>
        <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          From first search to finished work
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          A straightforward workflow for clients hiring talent and freelancers finding their next project.
        </p>
      </div>

      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.number}>
            <Card className="h-full gap-4 p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={step.icon} strokeWidth={2} className="size-5" />
                </span>
                <span className="font-heading text-2xl font-semibold text-muted-foreground/35">
                  {step.number}
                </span>
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default HowItWorks
