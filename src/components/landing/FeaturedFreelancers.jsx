import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ServiceCard from '@/components/listing/ServiceCard'

function FeaturedFreelancers({ services = [], loading = false }) {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t('home.featuredTitle')}</h2>
        <Button variant="outline" nativeButton={false} render={<Link to="/services" />}>
          {t('home.browseMore')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl" />
            ))
          : services.length > 0
            ? services.map((service) => <ServiceCard key={service._id} service={service} />)
            : <p className="col-span-full py-8 text-center text-sm text-muted-foreground">{t('home.noFeaturedServices')}</p>}
      </div>
    </section>
  )
}

export default FeaturedFreelancers
