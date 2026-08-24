import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon } from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const freelancers = [
  {
    name: 'Sara Ahmed',
    service: 'Logo & Brand Identity Design',
    rating: 4.8,
    reviews: 314,
    price: 10,
  },
  {
    name: 'Mohammed Al-Farsi',
    service: 'React & Node.js Development',
    rating: 4.9,
    reviews: 201,
    price: 25,
  },
  {
    name: 'Lina Yousef',
    service: 'Arabic & English Voice Over',
    rating: 4.7,
    reviews: 158,
    price: 8,
  },
]

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function FeaturedFreelancers() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Featured Freelancers &amp; Services</h2>
        <Button variant="outline">Browse More</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {freelancers.map((freelancer) => (
          <Card key={freelancer.name} className="gap-3 p-4">
            <div className="flex h-28 items-center justify-center rounded-lg bg-muted">
              <Avatar size="lg">
                <AvatarFallback>{initials(freelancer.name)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{initials(freelancer.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{freelancer.name}</span>
            </div>

            <p className="text-sm text-muted-foreground">{freelancer.service}</p>

            <div className="flex items-center gap-1 text-sm">
              <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-4 text-primary" />
              <span className="font-medium text-foreground">{freelancer.rating}</span>
              <span className="text-muted-foreground">({freelancer.reviews})</span>
            </div>

            <p className="text-sm font-medium text-foreground">
              Starts from {freelancer.price} BHD
            </p>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default FeaturedFreelancers
