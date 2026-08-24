import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import DitheredWaves from './DitheredWaves'
import LogoCarousel from './LogoCarousel'
import ShinyText from './ShinyText'

const logoGroups = [
  ['Google', 'Microsoft', 'Amazon'],
  ['Spotify', 'Netflix', 'Airbnb'],
  ['Uber', 'Meta', 'Adobe'],
]

function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative flex min-h-[240px] flex-col items-center justify-center gap-10 overflow-hidden rounded-xl px-6 py-14 text-center">
        <div className="absolute inset-0">
          <DitheredWaves colors={['#2B4447', '#3A5457', '#D9D2C6', '#F6F0EA']} />
        </div>
        <div className="absolute inset-0 bg-black/15" />

        <div className="relative flex flex-col items-center gap-4 text-white">
          <ShinyText
            text="Ready to find the right talent?"
            duration={2}
            delay={1}
            className="text-2xl font-normal sm:text-5xl"
          />
          <Button
            size="lg"
            variant="secondary"
            className="text-lg font-normal! h-13 mt-2 px-10"
            nativeButton={false}
            render={<Link to="/sign-up" />}
          >
            Get Started
          </Button>
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <p className="text-xs font-medium tracking-widest text-white/90 uppercase">
            Trusted by professionals from
          </p>
          <LogoCarousel groups={logoGroups} className="h-8" />
        </div>
      </div>
    </section>
  )
}

export default CallToAction
