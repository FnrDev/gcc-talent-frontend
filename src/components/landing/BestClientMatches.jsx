import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import JobCard from '@/components/listing/JobCard'
import useListingPreview from '@/components/listing/useListingPreview'
import { getJobs } from '@/services/jobService'

const PARAMS = { sort: 'newest', limit: 3 }

function BestClientMatches() {
  const { items, loading } = useListingPreview(getJobs, PARAMS, 'jobs')

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Best Client Matches</h2>
          <p className="text-sm text-muted-foreground">Open jobs from verified clients, posted recently.</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link to="/jobs" />}>
          Browse all jobs
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl" />
            ))
          : items.map((job) => <JobCard key={job._id} job={job} />)}
      </div>
    </section>
  )
}

export default BestClientMatches
