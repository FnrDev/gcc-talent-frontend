import Hero from '@/components/landing/Hero'
import PopularServices from '@/components/landing/PopularServices'
import PromoBanner from '@/components/landing/PromoBanner'
import FeaturedFreelancers from '@/components/landing/FeaturedFreelancers'
import BestClientMatches from '@/components/landing/BestClientMatches'
import CallToAction from '@/components/landing/CallToAction'
import Footer from '@/components/landing/Footer'

function Homepage() {
  return (
    <div>
      <Hero />
      <PopularServices />
      <PromoBanner
        eyebrow="For Freelancers"
        title="Grow your business with GCC Talents Pro"
        description="Get featured placement and priority support to win more clients."
        actionLabel="Learn More"
        actionTo="/sign-up"
      />
      <FeaturedFreelancers />
      <PromoBanner
        eyebrow="For Clients"
        title="Post a job and get proposals within 24 hours"
        description="Describe what you need and let qualified freelancers come to you."
        actionLabel="Post a Job"
        actionTo="/sign-up"
      />
      <BestClientMatches />
      <CallToAction />
      <Footer />
    </div>
  )
}

export default Homepage
