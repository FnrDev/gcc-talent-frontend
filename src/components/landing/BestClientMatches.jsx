import { HugeiconsIcon } from '@hugeicons/react'
import { Location01Icon } from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const jobs = [
  {
    postedAt: 'Posted yesterday — Less than 5 proposals',
    title: 'Simple Thumbnail and YouTube Upload',
    price: 'Fixed Price · Est. 25 BHD',
    description:
      'Looking for a video editor to design an eye-catching thumbnail and upload a short video to our YouTube channel.',
    location: 'Saudi Arabia',
    client: 'KA',
  },
  {
    postedAt: 'Posted yesterday — Less than 5 proposals',
    title: 'Landing Page for a Local Bakery',
    price: 'Fixed Price · Est. 60 BHD',
    description:
      'Need a single-page responsive website with an order form and a gallery of our products, ready in a week.',
    location: 'Bahrain',
    client: 'RN',
  },
]

function BestClientMatches() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Best Client Matches</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.title} className="gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-muted-foreground">{job.postedAt}</p>
              <Avatar size="sm">
                <AvatarFallback>{job.client}</AvatarFallback>
              </Avatar>
            </div>

            <h3 className="font-medium text-foreground">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.price}</p>
            <p className="text-sm text-muted-foreground">{job.description}</p>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Badge variant="outline" className="gap-1">
                <HugeiconsIcon icon={Location01Icon} strokeWidth={2} />
                {job.location}
              </Badge>
              <Button variant="outline">View Job</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default BestClientMatches
