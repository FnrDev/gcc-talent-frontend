import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import JobCard from '@/components/listing/JobCard'
import { Skeleton } from '@/components/ui/skeleton'

function BestClientMatches({ jobs = [], loading = false }) {
  const { t } = useTranslation()

  return (
    <section id="jobs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t('home.matchesTitle')}</h2>
        <Button variant="outline" nativeButton={false} render={<Link to="/jobs" />}>
          {t('home.browseJobs')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl" />
            ))
          : jobs.length > 0
            ? jobs.map((job) => <JobCard key={job._id} job={job} />)
            : <p className="col-span-full py-8 text-center text-sm text-muted-foreground">{t('home.noOpenJobs')}</p>}
      </div>
    </section>
  )
}

export default BestClientMatches
