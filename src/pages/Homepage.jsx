import { useCallback, useEffect, useState } from 'react'

import Hero from '@/components/landing/Hero'
import PopularServices from '@/components/landing/PopularServices'
import HowItWorks from '@/components/landing/HowItWorks'
import PromoBanner from '@/components/landing/PromoBanner'
import FeaturedFreelancers from '@/components/landing/FeaturedFreelancers'
import BestClientMatches from '@/components/landing/BestClientMatches'
import CallToAction from '@/components/landing/CallToAction'
import Footer from '@/components/landing/Footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getHome } from '@/services/generalService'

function Homepage() {
  const [requestVersion, setRequestVersion] = useState(0)
  const [result, setResult] = useState({ version: null, data: null, error: '' })

  useEffect(() => {
    let cancelled = false

    getHome()
      .then((data) => {
        if (!cancelled) setResult({ version: requestVersion, data, error: '' })
      })
      .catch((error) => {
        if (cancelled) return
        setResult({
          version: requestVersion,
          data: null,
          error: error?.response?.data?.message || 'Marketplace highlights are unavailable right now.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [requestVersion])

  const retry = useCallback(() => setRequestVersion((version) => version + 1), [])
  const loading = result.version !== requestVersion
  const currentResult = loading ? { data: null, error: '' } : result
  const home = currentResult.data || {}

  return (
    <div>
      <Hero />
      {currentResult.error ? (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <Alert>
            <AlertTitle>Marketplace highlights are unavailable</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{currentResult.error}</span>
              <Button type="button" variant="outline" size="sm" onClick={retry}>Try again</Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
      <PopularServices categories={home.categories} loading={loading} />
      <HowItWorks />
      <PromoBanner
        eyebrow="For Freelancers"
        title="Grow your business with GCC Talents Pro"
        description="Get featured placement and priority support to win more clients."
        actionLabel="Learn More"
        actionTo="/sign-up"
      />
      <FeaturedFreelancers services={home.services} loading={loading} />
      <PromoBanner
        eyebrow="For Clients"
        title="Post a job and get proposals within 24 hours"
        description="Describe what you need and let qualified freelancers come to you."
        actionLabel="Post a Job"
        actionTo="/jobs/new"
      />
      <BestClientMatches jobs={home.jobs} loading={loading} />
      <CallToAction />
      <Footer />
    </div>
  )
}

export default Homepage
