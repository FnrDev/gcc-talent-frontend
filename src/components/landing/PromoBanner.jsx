import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import DitheredWaves from './DitheredWaves'

// Each banner gets its own ramp so the two never read as the same card, and
// both stay inside the brand's teal/sand range. The ramps are deliberately
// shallow and dark: the dither pattern still shows, but the lightest stop is
// dark enough that white copy sitting on it clears AA even where the waves
// crest. Anything brighter would need the text to be the size CallToAction
// uses, and these cards carry 14px description copy.
const RAMPS = {
  teal: {
    colors: ['#0B2422', '#1B4A42', '#2E6B5C', '#488975'],
    fallbackClassName: 'bg-[#1B4A42]',
  },
  clay: {
    colors: ['#241C14', '#3F3225', '#5C4A33', '#7A6244'],
    fallbackClassName: 'bg-[#3F3225]',
  },
}

function PromoBanner({ eyebrow, title, description, actionLabel, actionTo, ramp = 'teal' }) {
  const { colors, fallbackClassName } = RAMPS[ramp] ?? RAMPS.teal

  return (
    <section className="mx-auto max-w-6xl px-4 py-4">
      <div className="relative isolate flex flex-col items-center gap-4 overflow-hidden rounded-xl px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="absolute inset-0" aria-hidden="true">
          <DitheredWaves colors={colors} fallbackClassName={fallbackClassName} />
        </div>

        <div className="relative">
          <p className="text-sm font-medium text-white/85">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/85">{description}</p>
        </div>
        <Button
          size="lg"
          variant="secondary"
          className="relative shrink-0"
          nativeButton={false}
          render={<Link to={actionTo} />}
        >
          {actionLabel}
        </Button>
      </div>
    </section>
  )
}

export default PromoBanner
