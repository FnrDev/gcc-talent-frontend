import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ServiceCard from '@/components/listing/ServiceCard'
import useListingPreview from '@/components/listing/useListingPreview'
import { getServices } from '@/services/serviceService'

const PARAMS = { sort: 'rating', limit: 3 }

function FeaturedFreelancers() {
  const { items, loading } = useListingPreview(getServices, PARAMS, 'services')

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Featured Freelancers &amp; Services</h2>
        <Button variant="outline" nativeButton={false} render={<Link to="/services" />}>
          Browse More
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl" />
            ))
          : items.length > 0
            ? items.map((service) => <ServiceCard key={service._id} service={service} />)
            : <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No featured services yet.</p>}
      </div>
    </section>
  )
}

export default FeaturedFreelancers
