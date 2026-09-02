import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Hero from '@/components/landing/Hero'
import PopularServices from '@/components/landing/PopularServices'
import PromoBanner from '@/components/landing/PromoBanner'
import FeaturedFreelancers from '@/components/landing/FeaturedFreelancers'
import BestClientMatches from '@/components/landing/BestClientMatches'
import CallToAction from '@/components/landing/CallToAction'
import Footer from '@/components/landing/Footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getHome } from '@/services/generalService'

function Homepage() {
  const { t } = useTranslation()
  const [requestVersion, setRequestVersion] = useState(0)
  const [result, setResult] = useState({ version: null, data: null, error: '', failed: false })

  useEffect(() => {
    let cancelled = false

    getHome()
      .then((data) => {
        if (!cancelled) setResult({ version: requestVersion, data, error: '', failed: false })
      })
      .catch((error) => {
        if (cancelled) return
        setResult({
          version: requestVersion,
          data: null,
          error: error?.response?.data?.message || '',
          failed: true,
        })
      })

    return () => {
      cancelled = true
    }
  }, [requestVersion])

  const retry = useCallback(() => setRequestVersion((version) => version + 1), [])
  const loading = result.version !== requestVersion
  const currentResult = loading ? { data: null, error: '', failed: false } : result
  const home = currentResult.data || {}

  return (
    <div>
      <Hero />
      {currentResult.failed ? (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <Alert>
            <AlertTitle>{t('home.highlightsUnavailable')}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{currentResult.error || t('home.highlightsError')}</span>
              <Button type="button" variant="outline" size="sm" onClick={retry}>{t('common.tryAgain')}</Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
      <PopularServices categories={home.categories} loading={loading} />
      <PromoBanner
        eyebrow={t('home.proEyebrow')}
        title={t('home.proTitle')}
        description={t('home.proDescription')}
        actionLabel={t('home.proAction')}
        actionTo="/sign-up"
        ramp="teal"
      />
      <FeaturedFreelancers services={home.services} loading={loading} />
      <PromoBanner
        eyebrow={t('home.clientEyebrow')}
        title={t('home.clientTitle')}
        description={t('home.clientDescription')}
        actionLabel={t('home.clientAction')}
        actionTo="/jobs/new"
        ramp="clay"
      />
      <BestClientMatches jobs={home.jobs} loading={loading} />
      <CallToAction />
      <Footer />
    </div>
  )
}

export default Homepage
